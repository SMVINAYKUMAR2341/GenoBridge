import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!currentPassword) {
      return NextResponse.json(
        { message: 'Current password is required to verify your identity.' },
        { status: 400 }
      )
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: 'New password must be different from your current password.' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Verify current password by attempting an authentication check with user email
    try {
      await payload.login({
        collection: 'users',
        data: { email: user.email, password: currentPassword },
      })
    } catch {
      return NextResponse.json(
        { message: 'Incorrect current password. Please check your credentials and try again.' },
        { status: 400 }
      )
    }

    // Persist new password directly to database (Payload handles bcrypt salt & hash)
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { password: newPassword },
      overrideAccess: true,
    })

    // Log security audit record
    try {
      const actorRole =
        user.role === 'nurse'
          ? 'Nurse / MA'
          : user.role === 'admin'
            ? 'Clinic Administrator'
            : 'OB/GYN Provider'

      await payload.create({
        collection: 'audit-logs',
        data: {
          eventCode: `AUD-PWD-${Date.now()}`,
          actorName: user.name || 'Staff User',
          actorRole,
          actionType: 'STAFF_ACCESS_CHANGED',
          resourceRef: `users:${user.id}`,
          details: 'Account password changed successfully.',
          encryptionVerified: true,
        },
        overrideAccess: true,
      })
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. Please use your new password on subsequent logins.',
    })
  } catch (error: any) {
    console.error('Error in POST /api/account/change-password:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to update password.' },
      { status: 500 }
    )
  }
}

