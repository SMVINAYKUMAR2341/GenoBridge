import { NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { getAncRecordById } from '@/lib/anc-store'
import {
  generateAncReportPdf,
  getPatientReports,
} from '@/lib/anc-report-generator'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * REPORT GENERATION & LISTING API
 *
 * GET  /api/anc/[id]/report - List all generated reports for this patient
 * POST /api/anc/[id]/report - Generate a new official A4 clinical PDF report
 */

export async function GET(request: Request, context: RouteContext) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { id } = await context.params
  const reports = await getPatientReports(id)
  return NextResponse.json({ reports })
}

export async function POST(request: Request, context: RouteContext) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { id } = await context.params
  const record = await getAncRecordById(id)
  if (!record) {
    return NextResponse.json({ error: `Antenatal record '${id}' not found` }, { status: 404 })
  }

  const actor = {
    name: user.name || 'Clinical Staff',
    role: user.role || 'provider',
    email: user.email,
  }

  try {
    const { metadata } = await generateAncReportPdf(record, actor)
    return NextResponse.json({
      success: true,
      message: `ANC Clinical Report ${metadata.fileName} generated successfully.`,
      metadata,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Failed to generate report', details: msg }, { status: 500 })
  }
}

