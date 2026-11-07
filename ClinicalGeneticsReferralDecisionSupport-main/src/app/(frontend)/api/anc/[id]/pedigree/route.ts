import { NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { getAncRecordById } from '@/lib/anc-store'
import { generatePedigreeFromAnc, syncAndPersistAncPedigree } from '@/lib/anc-pedigree-sync'
import { dbQuery } from '@/lib/db-pool'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
      return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
    }

    const { id } = await context.params
    const anc = await getAncRecordById(id)
    if (!anc) {
      return NextResponse.json({ error: `ANC record '${id}' not found` }, { status: 404 })
    }

    const mrn = anc.booking.hospitalRegNumber || `MRN-${anc.booking.identifier}`

    // Look for existing pedigree in PostgreSQL
    const result = await dbQuery(
      `SELECT p.* FROM pedigrees p
       LEFT JOIN patients pt ON p.patient_id = pt.id
       WHERE pt.mrn = $1 OR p.title LIKE $2
       ORDER BY p.updated_at DESC LIMIT 1;`,
      [mrn, `%${anc.booking.identifier}%`],
    )

    if (result.rows.length > 0) {
      const row = result.rows[0]
      return NextResponse.json({
        pedigree: {
          id: row.id,
          title: row.title,
          version: 2,
          consanguinity: Boolean(row.consanguinity),
          ancestries: row.ancestries || [],
          notes: row.notes || '',
          members: row.members || [],
          relationships: row.relationships || [],
          canvasLayout: row.canvas_layout || {},
          summary: row.summary || {},
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      })
    }

    // Auto-generate on the fly from ANC data
    const generated = generatePedigreeFromAnc(anc)
    return NextResponse.json({ pedigree: generated })
  } catch (error: any) {
    console.error('Error fetching ANC pedigree:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch pedigree' }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
      return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
    }

    const { id } = await context.params
    const anc = await getAncRecordById(id)
    if (!anc) {
      return NextResponse.json({ error: `ANC record '${id}' not found` }, { status: 404 })
    }

    const synced = await syncAndPersistAncPedigree(anc, user.id)

    return NextResponse.json({
      success: true,
      message: 'Pedigree synchronized and persisted to database.',
      pedigree: synced,
    })
  } catch (error: any) {
    console.error('Error syncing ANC pedigree:', error)
    return NextResponse.json({ error: error?.message || 'Failed to sync pedigree' }, { status: 500 })
  }
}
