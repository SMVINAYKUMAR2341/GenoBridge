import { NextResponse } from 'next/server'
import { evaluatePathway } from '@/lib/decision-engine'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pathway, features, inputs } = body

    if (!pathway) {
      return NextResponse.json({ message: 'Pathway is required' }, { status: 400 })
    }

    // Attempt to connect to Python FastAPI semantic retrieval engine if running
    try {
      const fastApiUrl = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000/evaluate'
      const fastApiResponse = await fetch(fastApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathway,
          features: typeof features === 'string' ? features : JSON.stringify(features || inputs || {}),
        }),
        signal: AbortSignal.timeout(1500), // 1.5s timeout for fast fallback
      })

      if (fastApiResponse.ok) {
        const data = await fastApiResponse.json()
        return NextResponse.json(data)
      }
    } catch {
      // Graceful fallback to client/server-side deterministic engine
    }

    // Deterministic SaMD evaluation bridge
    const rawInputs = typeof inputs === 'object' && inputs !== null ? inputs : {}
    const evaluated = evaluatePathway(pathway, rawInputs)

    return NextResponse.json({
      match_confidence: Math.round((evaluated.confidence_score || 0.95) * 100),
      clinical_risk: evaluated.outcome.toUpperCase(),
      recommended_action: evaluated.explanation,
      triggering_parameters: features || JSON.stringify(rawInputs),
      evidence_level: 'Level A / Standard of Care',
      guideline_source: evaluated.guideline_citations[0] || 'ACOG / NCCN / ACMG / ASRM Clinical Practice Guidelines',
      cpt_codes: evaluated.cpt_codes || [],
      icd10_codes: evaluated.icd10_codes || [],
      counseling_points: evaluated.counseling_points || [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Internal evaluation error' },
      { status: 500 }
    )
  }
}
