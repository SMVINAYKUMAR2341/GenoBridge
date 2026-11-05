import { NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import {
  getAllAncRecords,
  createAncRecord,
  saveDraft,
  type AncFilterOptions,
} from '@/lib/anc-store'
import { parseRoutineAnc } from '@/lib/anc-model'

/**
 * ANC REGISTRATION & QUERY API
 *
 * GET  /api/anc - Paginated list, search, status & risk filtering, and real-time dashboard KPIs
 * POST /api/anc - Register new patient or save draft with server validation & atomic JSON persistence
 */

export async function GET(request: Request) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = searchParams.get('status') || 'ALL'
  const risk = searchParams.get('risk') || 'ALL'
  const includeArchived = searchParams.get('includeArchived') === 'true'
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
  const sortBy = (searchParams.get('sortBy') as any) || 'lastUpdated'
  const sortOrder = (searchParams.get('sortOrder') as any) || 'desc'

  const options: AncFilterOptions = {
    search,
    status,
    risk,
    includeArchived,
    page,
    limit,
    sortBy,
    sortOrder,
  }

  const result = await getAllAncRecords(options)

  return NextResponse.json({
    records: result.records,
    stats: result.stats,
    total: result.total,
    page: page || 1,
    limit: limit || result.total,
    userRole: user.role,
    userName: user.name,
  })
}

export async function POST(request: Request) {
  const user = await appAuth.currentSessionUser()
  if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
    return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const isDraft = body.status === 'DRAFT' || body.isDraft === true

    const parsed = parseRoutineAnc(body)
    if (!parsed.success) {
      // If it's a draft, allow partial data as long as version is valid
      if (!isDraft) {
        return NextResponse.json(
          { error: 'Invalid ANC record format', details: parsed.errors },
          { status: 400 },
        )
      }
    }

    const recordData = parsed.success ? parsed.data : body
    const actor = {
      name: user.name || 'Clinical Staff',
      role: user.role || 'provider',
      email: user.email,
    }

    let saved
    if (isDraft) {
      saved = await saveDraft(recordData, actor)
    } else {
      saved = await createAncRecord(recordData, actor, false)
    }

    if (!saved.success) {
      return NextResponse.json({ error: saved.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: saved.data,
      message: saved.message,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
