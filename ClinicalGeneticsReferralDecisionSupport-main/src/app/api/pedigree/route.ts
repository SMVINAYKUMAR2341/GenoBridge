import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { dbQuery } from '@/lib/db-pool'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const pedigreeId = searchParams.get('id')

    let queryText = 'SELECT * FROM pedigrees WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1'
    let queryParams: any[] = [user.id]

    if (pedigreeId) {
      queryText = 'SELECT * FROM pedigrees WHERE id = $1 AND user_id = $2'
      queryParams = [pedigreeId, user.id]
    }

    const result = await dbQuery(queryText, queryParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ pedigree: null }, { status: 200 })
    }

    const row = result.rows[0]
    return NextResponse.json(
      {
        pedigree: {
          id: row.id,
          userId: row.user_id,
          patientId: row.patient_id,
          title: row.title,
          consanguinity: Boolean(row.consanguinity),
          ancestries: row.ancestries || [],
          notes: row.notes || '',
          summary: row.summary || {},
          members: row.members || [],
          relationships: row.relationships || [],
          canvasLayout: row.canvas_layout || {},
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching pedigree:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch pedigree' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      id,
      title = 'Three-Generation Clinical Pedigree',
      consanguinity = false,
      ancestries = [],
      notes = '',
      members = [],
      relationships = [],
      canvasLayout = {},
      patientId = null,
    } = body

    // Calculate descriptive summary counts
    const totalMembers = members.length
    const gens = new Set(members.map((m: any) => m.generation || 1))
    const numGenerations = gens.size || 1
    const affectedCount = members.filter((m: any) => m.geneticStatus === 'affected').length
    const carrierCount = members.filter((m: any) => m.geneticStatus === 'carrier' || m.geneticStatus === 'suspected_carrier').length
    const unknownCount = members.filter((m: any) => m.geneticStatus === 'unknown').length

    const summary = {
      totalMembers,
      numGenerations,
      affectedCount,
      carrierCount,
      unknownCount,
    }

    const pedigreeId = id || randomUUID()

    // Upsert into pedigrees table
    const upsertSql = `
      INSERT INTO pedigrees (
        id, user_id, patient_id, title, consanguinity, ancestries, notes,
        summary, members, relationships, canvas_layout, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        consanguinity = EXCLUDED.consanguinity,
        ancestries = EXCLUDED.ancestries,
        notes = EXCLUDED.notes,
        summary = EXCLUDED.summary,
        members = EXCLUDED.members,
        relationships = EXCLUDED.relationships,
        canvas_layout = EXCLUDED.canvas_layout,
        updated_at = NOW()
      RETURNING *;
    `

    const params = [
      pedigreeId,
      user.id,
      patientId,
      title,
      Boolean(consanguinity),
      JSON.stringify(ancestries),
      notes,
      JSON.stringify(summary),
      JSON.stringify(members),
      JSON.stringify(relationships),
      JSON.stringify(canvasLayout),
    ]

    const result = await dbQuery(upsertSql, params)
    const row = result.rows[0]

    return NextResponse.json(
      {
        success: true,
        message: 'Pedigree saved successfully to database.',
        pedigree: {
          id: row.id,
          userId: row.user_id,
          patientId: row.patient_id,
          title: row.title,
          consanguinity: Boolean(row.consanguinity),
          ancestries: row.ancestries,
          notes: row.notes,
          summary: row.summary,
          members: row.members,
          relationships: row.relationships,
          canvasLayout: row.canvas_layout,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error saving pedigree:', error)
    return NextResponse.json({ error: error?.message || 'Failed to save pedigree' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Pedigree ID required' }, { status: 400 })
    }

    await dbQuery('DELETE FROM pedigrees WHERE id = $1 AND user_id = $2', [id, user.id])

    return NextResponse.json({ success: true, message: 'Pedigree deleted.' }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting pedigree:', error)
    return NextResponse.json({ error: error?.message || 'Failed to delete pedigree' }, { status: 500 })
  }
}

