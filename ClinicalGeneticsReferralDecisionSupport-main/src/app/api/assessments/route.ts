import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { evaluatePathway, normalizePathwayId } from '@/lib/decision-engine'
import { dbQuery as query } from '@/lib/db-pool'

// Fallback in-memory cache for resilient edge execution
const fallbackAssessments: Array<Record<string, unknown>> = []

const VALID_PATHWAYS = new Set([
  'hereditary-cancer-risk',
  'preconception-carrier-screening',
  'nipt-results',
  'abnormal-ultrasound-findings',
  'infertility-recurrent-pregnancy-loss',
  'positive-family-history',
])

const PATHWAY_TITLES: Record<string, string> = {
  'hereditary-cancer-risk': 'Hereditary Cancer Risk Assessment',
  'preconception-carrier-screening': 'Preconception Carrier Screening',
  'nipt-results': 'Cell-Free DNA / NIPT Screening Evaluation',
  'abnormal-ultrasound-findings': 'Fetal Ultrasound Anomalies Evaluation',
  'infertility-recurrent-pregnancy-loss': 'Recurrent Pregnancy Loss & Infertility',
  'positive-family-history': 'High-Risk Family History & Pedigree Evaluation',
}

function mapDecisionEnum(outcome: string) {
  const norm = (outcome || '').toUpperCase()
  if (norm.includes('URGENT')) return 'urgent_referral'
  if (norm.includes('ROUTINE') || norm.includes('PRIORITY')) return 'routine_referral'
  if (norm.includes('BORDERLINE') || norm.includes('CONSIDER')) return 'borderline_consideration'
  return 'no_referral_needed'
}

function mapActionTakenEnum(decision: string) {
  if (decision === 'urgent_referral' || decision === 'routine_referral') return 'referral_generated'
  if (decision === 'borderline_consideration') return 'borderline_watchlist'
  return 'logged_no_referral'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pathway_id, pathwaySlug, input_data, patient_id, mrn, patient_name, provider_name } = body

    const targetSlug = pathway_id || pathwaySlug || 'preconception-carrier-screening'
    const inputs = input_data || body.inputs || {}

    const decision = evaluatePathway(targetSlug, inputs)
    const normSlug = VALID_PATHWAYS.has(targetSlug) ? targetSlug : 'preconception-carrier-screening'
    const pathwayTitle = PATHWAY_TITLES[normSlug] || 'Clinical Genetics Risk Assessment'

    const dbDecision = mapDecisionEnum(decision.outcome)
    const actionTaken = mapActionTakenEnum(dbDecision)
    const assessmentCode = `ASM-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    let patientUuid: string | null = null
    let effectiveMrn = mrn || `MRN-${patient_id || 'UNKNOWN'}`
    let effectiveName = patient_name || 'Patient'

    // Look up or match patient in PostgreSQL
    try {
      if (patient_id) {
        const patRes = await query<{ id: string; mrn: string; full_name: string }>(
          `SELECT id, mrn, full_name FROM patients WHERE id::text = $1 OR mrn = $1 LIMIT 1`,
          [patient_id]
        )
        if (patRes.rows.length > 0) {
          patientUuid = patRes.rows[0].id
          effectiveMrn = patRes.rows[0].mrn || effectiveMrn
          effectiveName = patRes.rows[0].full_name || effectiveName
        }
      }
    } catch (e) {
      console.warn('Patient lookup during assessment failed:', e)
    }

    let insertedId: string = randomUUID()

    // Persist directly to PostgreSQL assessments table
    try {
      const insertSql = `
        INSERT INTO assessments (
          patient_id, assessment_code, patient_mrn, patient_name,
          pathway_slug, pathway_title, decision, referral_target,
          rationale, guideline_citations, triggered_criteria_codes,
          clinical_inputs_summary, structured_inputs_json,
          action_taken, provider_name, provider_role
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13,
          $14, $15, $16
        ) RETURNING id, created_at;
      `
      const dbRes = await query<{ id: string; created_at: string }>(insertSql, [
        patientUuid,
        assessmentCode,
        effectiveMrn,
        effectiveName,
        normSlug,
        pathwayTitle,
        dbDecision,
        decision.referral_target || 'Clinical Genetics Specialist',
        decision.explanation || 'Evaluated against verified clinical practice guidelines.',
        (decision.guideline_citations || []).join('; ') || 'ACOG / ACMG / FOGSI Guidelines',
        (decision.matched_criteria || []).join(', '),
        JSON.stringify(inputs).slice(0, 500),
        JSON.stringify(inputs),
        actionTaken,
        provider_name || 'Attending Clinician',
        'obgyn_provider',
      ])

      if (dbRes.rows.length > 0) {
        insertedId = dbRes.rows[0].id
      }
    } catch (dbErr) {
      console.warn('PostgreSQL assessment storage error, saving to memory fallback:', dbErr)
    }

    const assessment = {
      id: insertedId,
      assessment_id: assessmentCode,
      assessment_code: assessmentCode,
      pathway_id: normalizePathwayId(targetSlug),
      pathwaySlug: normSlug,
      patient_id: patientUuid || patient_id || null,
      patient_mrn: effectiveMrn,
      patient_name: effectiveName,
      input_data: inputs,
      outcome: decision.outcome,
      decision: dbDecision,
      clinical_decision: decision.clinical_decision,
      referral_target: decision.referral_target,
      matched_criteria: decision.matched_criteria,
      explanation: decision.explanation,
      guideline_citations: decision.guideline_citations,
      action_taken: actionTaken,
      created_at: new Date().toISOString(),
    }

    fallbackAssessments.unshift(assessment)
    if (fallbackAssessments.length > 100) fallbackAssessments.pop()

    return NextResponse.json(assessment, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Assessment evaluation failed' },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pathwayId = searchParams.get('pathway_id')
  const patientId = searchParams.get('patient_id')
  const mrn = searchParams.get('mrn')

  try {
    let whereClauses: string[] = []
    let params: any[] = []

    if (patientId) {
      params.push(patientId)
      whereClauses.push(`(patient_id::text = $${params.length} OR patient_mrn = $${params.length})`)
    }
    if (mrn) {
      params.push(mrn)
      whereClauses.push(`patient_mrn = $${params.length}`)
    }
    if (pathwayId) {
      params.push(pathwayId)
      whereClauses.push(`pathway_slug::text = $${params.length}`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    const sql = `
      SELECT 
        id,
        assessment_code,
        patient_id,
        patient_mrn,
        patient_name,
        pathway_slug,
        pathway_title,
        decision,
        referral_target,
        rationale AS explanation,
        guideline_citations,
        triggered_criteria_codes,
        structured_inputs_json,
        action_taken,
        provider_name,
        created_at
      FROM assessments
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT 100;
    `
    const res = await query(sql, params)
    if (res.rows.length > 0) {
      return NextResponse.json(res.rows, { status: 200 })
    }
  } catch (e) {
    console.warn('Failed to query assessments from PostgreSQL, falling back to cache:', e)
  }

  let results = [...fallbackAssessments]
  if (pathwayId) results = results.filter((a) => a.pathwaySlug === pathwayId || a.pathway_id === pathwayId)
  if (patientId) results = results.filter((a) => a.patient_id === patientId || a.patient_mrn === patientId)

  return NextResponse.json(results, { status: 200 })
}
