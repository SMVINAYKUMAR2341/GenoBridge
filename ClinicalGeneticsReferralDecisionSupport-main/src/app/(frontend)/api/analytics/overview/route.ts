import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { dbQuery } from '@/lib/db-pool'
import fs from 'fs'
import { ANC_FILE, REPORTS_META_FILE } from '@/lib/anc-store'
import type { RoutineAncData } from '@/lib/anc-model'
import { getUnifiedPatients } from '@/lib/patient-history-service'

export async function GET(req: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
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
    const allPatients = await getUnifiedPatients()
    const filteredPatients = allPatients.filter((p) => {
      if (startDate && new Date(p.registeredAt || Date.now()) < startDate) return false
      if (portalFilter !== 'all' && !p.sourcePortals.includes(portalFilter)) return false
      return true
    })

    const totalUniquePatients = filteredPatients.length
    const activePatients = filteredPatients.filter((p) => p.pregnancyStatus.toLowerCase().includes('active') || p.pregnancyStatus.toLowerCase().includes('pregnant')).length
    const patientsWithAnc = filteredPatients.filter((p) => p.hasAnc).length
    const patientsWithPedigree = filteredPatients.filter((p) => p.hasPedigree).length
    const patientsWithAssessments = filteredPatients.filter((p) => p.assessmentCount > 0).length
    const patientsWithReports = filteredPatients.filter((p) => p.documentCount > 0).length

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
      for (const row of wfRes.rows) {
        const count = parseInt(row.count, 10) || 0
        totalWorkflows += count
        if (row.state === 'FINALIZED') finalizedAssessments += count
        else draftAssessments += count
        const pSlug = row.pathway_slug || 'General Assessment'
        pathwayCounts[pSlug] = (pathwayCounts[pSlug] || 0) + count
      }
    } catch {}

    // Total Pedigrees in PostgreSQL
    let totalPedigrees = 0
    try {
      const pedCountRes = await dbQuery<{ count: string }>('SELECT count(*) as count FROM pedigrees;')
      totalPedigrees = parseInt(pedCountRes.rows[0]?.count || '0', 10)
    } catch {}

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
          if (startDate && new Date(anc.booking?.bookingDate || (anc as any).lastUpdated || Date.now()) < startDate) continue
          ancVisitsTotal += Array.isArray(anc.visits) ? anc.visits.length : 0
          ancUltrasoundsTotal += Array.isArray(anc.ultrasounds) ? anc.ultrasounds.length : 0
          ancLabsTotal += Array.isArray(anc.investigations) ? anc.investigations.length : 0
          ancVaccinationsTotal += Array.isArray(anc.vaccinations) ? anc.vaccinations.length : 0
          if (anc.riskClassification?.riskLevel === 'HIGH') ancHighRiskTotal++
        }
      }
    } catch {}

    // 4. Documents & Reports Total
    let totalDocumentsGenerated = 0
    try {
      if (fs.existsSync(REPORTS_META_FILE)) {
        const metaContent = await fs.promises.readFile(REPORTS_META_FILE, 'utf-8')
        const allMeta: any[] = JSON.parse(metaContent || '[]')
        totalDocumentsGenerated = allMeta.length
      }
    } catch {}

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
      const age = p.age
      if (!age || age < 20) ageBuckets['< 20']++
      else if (age <= 24) ageBuckets['20–24']++
      else if (age <= 29) ageBuckets['25–29']++
      else if (age <= 34) ageBuckets['30–34']++
      else if (age <= 39) ageBuckets['35–39']++
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
      const d = (p.registeredAt || '').slice(0, 10) || 'Recent'
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
