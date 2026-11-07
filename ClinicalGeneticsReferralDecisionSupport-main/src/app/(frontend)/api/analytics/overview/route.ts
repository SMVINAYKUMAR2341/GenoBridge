import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { dbQuery } from '@/lib/db-pool'
import fs from 'fs'
import { ANC_FILE, REPORTS_META_FILE } from '@/lib/anc-store'
import type { RoutineAncData } from '@/lib/anc-model'
import { getUnifiedPatients } from '@/lib/patient-history-service'

export async function GET(req: NextRequest) {
  try {
    let user = null
    try {
      user = await appAuth.currentSessionUser()
    } catch (authErr) {
      console.warn('Analytics route: auth session lookup error:', authErr)
    }

    if (!user || (user.verificationStatus && user.verificationStatus !== 'APPROVED') || user.enabled === false) {
      return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || 'all'
    const portalFilter = searchParams.get('portal') || 'all'

    // Calculate Date Threshold
    const now = new Date()
    let startDate: Date | null = null

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else if (range === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (range === 'prev_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }

    // 1. Patient Analytics (Unique count across DB and ANC)
    let allPatients: any[] = []
    try {
      allPatients = await getUnifiedPatients()
    } catch (patErr) {
      console.warn('Analytics route: unified patients load error:', patErr)
      allPatients = []
    }

    const filteredPatients = allPatients.filter((p) => {
      try {
        if (startDate) {
          const regDate = p.registeredAt instanceof Date ? p.registeredAt : new Date(p.registeredAt || Date.now())
          if (regDate < startDate) return false
        }
        if (portalFilter !== 'all' && !(p.sourcePortals || []).includes(portalFilter)) return false
        return true
      } catch {
        return true
      }
    })

    const totalUniquePatients = filteredPatients.length
    const activePatients = filteredPatients.filter((p) => {
      const status = String(p.pregnancyStatus || '').toLowerCase()
      return status.includes('active') || status.includes('pregnant')
    }).length

    const patientsWithAnc = filteredPatients.filter((p) => Boolean(p.hasAnc)).length
    const patientsWithPedigree = filteredPatients.filter((p) => Boolean(p.hasPedigree)).length
    const patientsWithAssessments = filteredPatients.filter((p) => (p.assessmentCount || 0) > 0).length
    const patientsWithReports = filteredPatients.filter((p) => (p.documentCount || 0) > 0).length

    // 2. Cross-Portal Activity Metrics (Actual database queries)
    let totalWorkflows = 0
    let finalizedAssessments = 0
    let draftAssessments = 0
    const pathwayCounts: Record<string, number> = {}

    try {
      const wfRes = await dbQuery<{ pathway_slug: string; state: string; count: string }>(
        `SELECT pathway_slug, state, count(*) as count 
         FROM clinical_workflows 
         GROUP BY pathway_slug, state;`,
      )
      if (wfRes && Array.isArray(wfRes.rows)) {
        for (const row of wfRes.rows) {
          const count = parseInt(String(row.count || '0'), 10) || 0
          totalWorkflows += count
          if (row.state === 'FINALIZED') finalizedAssessments += count
          else draftAssessments += count
          const pSlug = row.pathway_slug || 'General Assessment'
          pathwayCounts[pSlug] = (pathwayCounts[pSlug] || 0) + count
        }
      }
    } catch (wfErr) {
      console.warn('Analytics route: clinical_workflows query error:', wfErr)
    }

    // Include assessments from assessments table
    try {
      const asmRes = await dbQuery<{ action_taken: string; count: string }>(
        `SELECT action_taken, count(*) as count FROM assessments GROUP BY action_taken;`,
      )
      if (asmRes && Array.isArray(asmRes.rows)) {
        for (const row of asmRes.rows) {
          const count = parseInt(String(row.count || '0'), 10) || 0
          finalizedAssessments += count
        }
      }
    } catch (asmErr) {
      console.warn('Analytics route: assessments table query error:', asmErr)
    }

    // Total Pedigrees in PostgreSQL
    let totalPedigrees = 0
    try {
      const pedCountRes = await dbQuery<{ count: string }>('SELECT count(*) as count FROM pedigrees;')
      if (pedCountRes && Array.isArray(pedCountRes.rows) && pedCountRes.rows.length > 0) {
        totalPedigrees = parseInt(String(pedCountRes.rows[0]?.count || '0'), 10) || 0
      }
    } catch (pedErr) {
      console.warn('Analytics route: pedigrees table query error:', pedErr)
    }

    // 3. ANC Module Real Aggregates
    let ancVisitsTotal = 0
    let ancUltrasoundsTotal = 0
    let ancLabsTotal = 0
    let ancVaccinationsTotal = 0
    let ancHighRiskTotal = 0

    try {
      if (fs.existsSync(ANC_FILE)) {
        const content = await fs.promises.readFile(ANC_FILE, 'utf-8')
        const ancRecords: RoutineAncData[] = JSON.parse(content || '[]')
        for (const anc of ancRecords) {
          if (startDate) {
            const dateVal = anc.booking?.bookingDate || (anc as any).lastUpdated || Date.now()
            if (new Date(dateVal) < startDate) continue
          }
          ancVisitsTotal += Array.isArray(anc.visits) ? anc.visits.length : 0
          ancUltrasoundsTotal += Array.isArray(anc.ultrasounds) ? anc.ultrasounds.length : 0
          ancLabsTotal += anc.investigations ? 1 : 0
          ancVaccinationsTotal += anc.vaccinations ? 1 : 0
          if (anc.riskClassification?.riskLevel === 'HIGH' || anc.status === 'HIGH_RISK') {
            ancHighRiskTotal++
          }
        }
      }
    } catch (ancErr) {
      console.warn('Analytics route: ANC data read error:', ancErr)
    }

    // 4. Documents & Reports Total
    let totalDocumentsGenerated = 0
    try {
      if (fs.existsSync(REPORTS_META_FILE)) {
        const metaContent = await fs.promises.readFile(REPORTS_META_FILE, 'utf-8')
        const allMeta: any[] = JSON.parse(metaContent || '[]')
        totalDocumentsGenerated = Array.isArray(allMeta) ? allMeta.length : 0
      }
    } catch (metaErr) {
      console.warn('Analytics route: reports metadata read error:', metaErr)
    }

    // 5. Demographics (Age Buckets from actual records)
    const ageBuckets = {
      '< 20': 0,
      '20–24': 0,
      '25–29': 0,
      '30–34': 0,
      '35–39': 0,
      '40+': 0,
    }

    filteredPatients.forEach((p) => {
      const ageNum = typeof p.age === 'number' ? p.age : parseInt(String(p.age || '0'), 10)
      if (!ageNum || isNaN(ageNum) || ageNum < 20) ageBuckets['< 20']++
      else if (ageNum <= 24) ageBuckets['20–24']++
      else if (ageNum <= 29) ageBuckets['25–29']++
      else if (ageNum <= 34) ageBuckets['30–34']++
      else if (ageNum <= 39) ageBuckets['35–39']++
      else ageBuckets['40+']++
    })

    const ageDistribution = Object.entries(ageBuckets).map(([group, count]) => ({
      group,
      count,
    }))

    // 6. Cross-Portal Distribution
    const portalActivity = [
      { portal: 'ANC Portal', records: filteredPatients.filter((p) => p.hasAnc).length + ancVisitsTotal },
      { portal: 'Pedigree Studio', records: totalPedigrees },
      { portal: 'Doctor Portal', records: totalWorkflows + patientsWithAssessments },
      { portal: 'Hospital Portal', records: filteredPatients.length },
      { portal: 'Reporting Module', records: totalDocumentsGenerated },
    ]

    // 7. Dynamic Trend (Grouped by Date)
    const trendMap = new Map<string, { date: string; registrations: number; clinicalVisits: number }>()

    filteredPatients.forEach((p) => {
      let d = 'Recent'
      try {
        if (p.registeredAt instanceof Date) {
          d = p.registeredAt.toISOString().slice(0, 10)
        } else if (typeof p.registeredAt === 'string' && p.registeredAt.length >= 10) {
          d = p.registeredAt.slice(0, 10)
        }
      } catch {}
      const cur = trendMap.get(d) || { date: d, registrations: 0, clinicalVisits: 0 }
      cur.registrations++
      trendMap.set(d, cur)
    })

    const trend = Array.from(trendMap.values()).slice(-14)

    return NextResponse.json(
      {
        success: true,
        filters: { range, portal: portalFilter },
        kpis: {
          totalUniquePatients,
          activePatients,
          patientsWithAnc,
          patientsWithPedigree,
          patientsWithAssessments,
          patientsWithReports,
          totalWorkflows,
          finalizedAssessments,
          draftAssessments,
          totalPedigrees,
          ancVisitsTotal,
          ancUltrasoundsTotal,
          ancLabsTotal,
          ancVaccinationsTotal,
          ancHighRiskTotal,
          totalDocumentsGenerated,
        },
        ageDistribution,
        portalActivity,
        trend,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error calculating analytics overview:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to aggregate analytics' },
      { status: 500 },
    )
  }
}
