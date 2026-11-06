import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { evaluatePathway, normalizePathwayId } from '@/lib/decision-engine'

// In-memory cache of recent assessments for fast PoC lookups
const recentAssessments: Array<Record<string, unknown>> = []

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pathway_id, pathwaySlug, input_data, patient_id } = body

    const targetSlug = pathway_id || pathwaySlug || 'preconception-carrier-screening'
    const inputs = input_data || body.inputs || {}

    const decision = evaluatePathway(targetSlug, inputs)

    const assessment = {
      assessment_id: `asm_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      pathway_id: normalizePathwayId(targetSlug),
      pathwaySlug: targetSlug,
      patient_id: patient_id || null,
      input_data: inputs,
      outcome: decision.outcome,
      clinical_decision: decision.clinical_decision,
      referral_target: decision.referral_target,
      matched_criteria: decision.matched_criteria,
      explanation: decision.explanation,
      guideline_citations: decision.guideline_citations,
      created_at: new Date().toISOString(),
    }

    recentAssessments.unshift(assessment)
    if (recentAssessments.length > 100) recentAssessments.pop()

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

  let results = [...recentAssessments]
  if (pathwayId) results = results.filter((a) => a.pathway_id === pathwayId)
  if (patientId) results = results.filter((a) => a.patient_id === patientId)

  return NextResponse.json(results, { status: 200 })
}

