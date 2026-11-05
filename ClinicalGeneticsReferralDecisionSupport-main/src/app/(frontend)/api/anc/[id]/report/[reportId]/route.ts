import { NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { getReportPdfFile, getPatientReports } from '@/lib/anc-report-generator'

interface RouteContext {
  params: Promise<{ id: string; reportId: string }>
}

/**
 * SERVE GENERATED PDF STREAM
 *
 * GET /api/anc/[id]/report/[reportId] - Stream the official PDF document for preview, download, or printing
 */

export async function GET(request: Request, context: RouteContext) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { id, reportId } = await context.params
  const reports = await getPatientReports(id)

  const found = reports.find((r) => r.id === reportId || r.fileName === reportId)
  if (!found) {
    return NextResponse.json({ error: 'Report not found for this patient' }, { status: 404 })
  }

  const pdfBuffer = await getReportPdfFile(found.fileName)
  if (!pdfBuffer) {
    return NextResponse.json({ error: 'PDF file not found in storage' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const download = searchParams.get('download') === 'true'

  return new NextResponse(pdfBuffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${found.fileName}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

