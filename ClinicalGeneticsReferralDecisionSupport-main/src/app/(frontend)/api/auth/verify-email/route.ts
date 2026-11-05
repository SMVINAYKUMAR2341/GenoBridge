import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token && !email) {
      return NextResponse.json(
        { message: 'Verification token is required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    const whereClause: any = {}
    if (token) {
      whereClause.emailVerificationToken = { equals: token }
    } else if (email) {
      whereClause.email = { equals: email.trim().toLowerCase() }
    }

    const users = await payload.find({
      collection: 'users',
      where: whereClause,
      limit: 1,
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { message: 'Invalid or expired verification token.' },
        { status: 400 }
      )
    }

    const user = users.docs[0] as any

    // Check token expiration if set
    if (user.emailVerificationTokenExpiresAt && new Date(user.emailVerificationTokenExpiresAt) < new Date()) {
      return NextResponse.json(
        { message: 'Verification token has expired. Please request a new verification link.' },
        { status: 400 }
      )
    }

    // Update user: mark emailVerified true, and ensure status is at least PROFESSIONAL_VERIFICATION_PENDING
    const nextStatus = user.verificationStatus === 'EMAIL_VERIFICATION_PENDING'
      ? 'PROFESSIONAL_VERIFICATION_PENDING'
      : (user.verificationStatus || 'PROFESSIONAL_VERIFICATION_PENDING')

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        emailVerified: true,
        verificationStatus: nextStatus,
        emailVerificationToken: null,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Work email has been successfully verified. Your account is currently under professional verification.',
      verificationStatus: nextStatus,
    })
  } catch (error: any) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { message: 'Failed to verify email. Please try again or contact clinical support.' },
      { status: 500 }
    )
  }
}

