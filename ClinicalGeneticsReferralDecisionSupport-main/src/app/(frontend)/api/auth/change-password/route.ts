import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'

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

    // Verify current password by attempting a test login with user email
    try {
      await payload.login({
        collection: 'users',
        data: { email: user.email, password: currentPassword },
      })
    } catch {
      return NextResponse.json(
        { message: 'Incorrect current password. Please check and try again.' },
        { status: 400 }
      )
    }

    // Update password
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { password: newPassword },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. Use your new password on next sign-in.',
    })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to update password. Please try again.' },
      { status: 500 }
    )
  }
}

