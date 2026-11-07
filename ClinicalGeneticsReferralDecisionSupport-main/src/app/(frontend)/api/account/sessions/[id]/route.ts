import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await appAuth.currentSessionUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const { id: sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { message: 'Session ID is required.' },
        { status: 400 }
      )
    }

    const payload = await getPayloadClient()
    const pool = (payload.db as any)?.pool

    if (pool) {
      // Enforce ownership: only delete session if it belongs to this user
      await pool.query(
        `DELETE FROM users_sessions WHERE id = $1 AND _parent_id = $2`,
        [sessionId, user.id]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully.',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/account/sessions/[id]:', error)
    return NextResponse.json(
      { message: 'Failed to revoke session.' },
      { status: 500 }
    )
  }
}

