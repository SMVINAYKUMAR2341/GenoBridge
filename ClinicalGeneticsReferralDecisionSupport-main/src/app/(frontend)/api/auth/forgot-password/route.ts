import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Use Payload's built-in forgot password functionality
    await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: false, // Allow Payload to send email
    })

    // Always return success (security best practice - don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    })
  }
}
