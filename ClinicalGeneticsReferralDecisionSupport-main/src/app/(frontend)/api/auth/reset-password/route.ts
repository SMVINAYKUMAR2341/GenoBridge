import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Use Payload's built-in reset password functionality
    await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error: any) {
    console.error('Reset password error:', error)

    if (error.message?.includes('token') || error.message?.includes('expired')) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token. Please request a new password reset link.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
