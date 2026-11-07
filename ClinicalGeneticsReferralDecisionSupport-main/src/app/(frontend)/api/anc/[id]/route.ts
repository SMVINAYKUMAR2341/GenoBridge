import { NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import {
  getAncRecordById,
  updateAncRecord,
  archiveAncRecord,
  getAuditLogs,
} from '@/lib/anc-store'
import { getPatientReports } from '@/lib/anc-report-generator'
import { parseRoutineAnc } from '@/lib/anc-model'
import { syncAndPersistAncPedigree } from '@/lib/anc-pedigree-sync'

/**
 * SINGLE PATIENT ANC RECORD API
 *
 * GET    /api/anc/[id] - Retrieve single record, patient audit trail, and generated reports
 * PUT    /api/anc/[id] - Full update with server-side validation & clinical recalculation
 * PATCH  /api/anc/[id] - Partial update of specific clinical sections (visits, labs, scans, etc.)
 * DELETE /api/anc/[id] - Archival of record with clinical rationale
 */

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Record identifier required' }, { status: 400 })
  }

  const record = await getAncRecordById(id)
  if (!record) {
    return NextResponse.json({ error: `Antenatal record '${id}' not found` }, { status: 404 })
  }

  const [auditLogs, reports] = await Promise.all([
    getAuditLogs(record.booking.identifier),
    getPatientReports(record.booking.identifier),
  ])

  return NextResponse.json({
    record,
    auditLogs,
    reports,
    userRole: user.role,
    userName: user.name,
  })
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { id } = await context.params
  try {
    const body = await request.json()
    const parsed = parseRoutineAnc(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ANC record format', details: parsed.errors },
        { status: 400 },
      )
    }

    const actor = {
      name: user.name || 'Clinical Staff',
      role: user.role || 'provider',
      email: user.email,
    }

    const result = await updateAncRecord(id, parsed.data, actor)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 })
    }

    // Auto-sync pedigree and patient in database
    try {
      await syncAndPersistAncPedigree(result.data, user.id)
    } catch (pedErr) {
      console.warn('Could not auto-sync pedigree:', pedErr)
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { id } = await context.params
  try {
    const updates = await request.json()
    const actor = {
      name: user.name || 'Clinical Staff',
      role: user.role || 'provider',
      email: user.email,
    }

    const result = await updateAncRecord(id, updates, actor)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 })
    }

    // Auto-sync pedigree and patient in database
    try {
      await syncAndPersistAncPedigree(result.data, user.id)
    } catch (pedErr) {
      console.warn('Could not auto-sync pedigree on patch:', pedErr)
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { id } = await context.params
  const { searchParams } = new URL(request.url)
  const reason = searchParams.get('reason') || 'Archived by clinical provider'

  const actor = {
    name: user.name || 'Clinical Staff',
    role: user.role || 'provider',
    email: user.email,
  }

  const result = await archiveAncRecord(id, actor, reason)
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 404 })
  }

  return NextResponse.json({ success: true, message: result.message })
}

