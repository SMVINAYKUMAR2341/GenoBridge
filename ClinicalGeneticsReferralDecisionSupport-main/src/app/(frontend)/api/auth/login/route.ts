import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter'

type SupportedRole = 'gynecologist' | 'nurse' | 'admin'

function matchesRole(user: any, selectedRole: string): boolean {
  const normRole = selectedRole.toLowerCase().trim()

  if (normRole === 'gynecologist' || normRole === 'doctor' || normRole === 'ob-gyn') {
    return user.category === 'gynecologist' || user.role === 'provider' || user.role === 'gynecologist'
  }

  if (normRole === 'nurse' || normRole === 'medical_assistant') {
    return user.category === 'nurse' || user.role === 'nurse'
  }

  if (normRole === 'admin') {
    return user.role === 'admin'
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role = typeof body.role === 'string' ? body.role.trim().toLowerCase() : ''
    const rememberMe = Boolean(body.rememberMe)

    // 1. Validate mandatory fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Work email and password are required.' },
        { status: 400 }
      )
    }

    // 2. Validate selected professional role
    if (!role) {
      return NextResponse.json(
        { message: 'Please select your professional role before signing in.' },
        { status: 400 }
      )
    }

    if (role !== 'gynecologist' && role !== 'nurse' && role !== 'admin') {
      return NextResponse.json(
        { message: 'Invalid professional role selected. Choose Gynecologist / OB-GYN or Nurse / Medical Assistant.' },
        { status: 400 }
      )
    }

    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    const rateCheck = checkRateLimit(`login:${ip}:${email}`, {
      maxAttempts: 5,
      windowMs: 900000, // 15 mins
      lockoutDurationMs: 900000, // 15 mins
    })

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          message: `Too many failed login attempts. Please try again in ${Math.ceil(
            (rateCheck.retryAfterSeconds || 60) / 60
          )} minutes.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds || 60) },
        }
      )
    }

    const payload = await getPayload({ config })

    try {
      // 3. Authenticate email and password against stored password hash in users collection
      const result = await payload.login({
        collection: 'users',
        data: { email, password },
      })

      if (!result.user || !result.token) {
        return NextResponse.json(
          { message: 'Invalid email or password.' },
          { status: 401 }
        )
      }

      const user = result.user as any

      // 4. ROLE MATCHING: Compare selected role with registered user category/role
      if (!matchesRole(user, role)) {
        // Scenario B: Selected role does not match registered account
        return NextResponse.json(
          {
            message: 'The selected professional role does not match your registered account.',
            status: 'ROLE_MISMATCH',
          },
          { status: 403 }
        )
      }

      const verificationStatus =
        user.verificationStatus ||
        (user.enabled ? 'APPROVED' : 'PROFESSIONAL_VERIFICATION_PENDING')

      // 5. Check account status: SUSPENDED
      if (verificationStatus === 'SUSPENDED') {
        return NextResponse.json(
          {
            message: 'Your account has been suspended by clinical administration. Please contact clinical governance.',
            status: 'SUSPENDED',
          },
          { status: 403 }
        )
      }

      // 6. Check account status: REJECTED
      if (verificationStatus === 'REJECTED') {
        return NextResponse.json(
          {
            message: user.rejectionReason || 'Your professional verification was not approved.',
            status: 'REJECTED',
            redirectTo: '/account-rejected',
          },
          { status: 403 }
        )
      }

      // 7. Check account status: EMAIL VERIFICATION PENDING
      if (verificationStatus === 'EMAIL_VERIFICATION_PENDING') {
        return NextResponse.json(
          {
            message: 'Please verify your work email address to complete registration.',
            status: 'EMAIL_VERIFICATION_PENDING',
            redirectTo: `/verify-email?email=${encodeURIComponent(user.email)}`,
          },
          { status: 403 }
        )
      }

      // 8. Check account status: PROFESSIONAL VERIFICATION PENDING / DISABLED
      if (
        verificationStatus === 'PROFESSIONAL_VERIFICATION_PENDING' ||
        verificationStatus === 'REGISTERED' ||
        verificationStatus === 'EMAIL_VERIFIED' ||
        !user.enabled
      ) {
        return NextResponse.json(
          {
            message: 'Your professional account is awaiting administrator verification.',
            status: 'PROFESSIONAL_VERIFICATION_PENDING',
            redirectTo: '/account-pending',
          },
          { status: 403 }
        )
      }

      // 9. APPROVED ACCOUNT: Determine workspace destination
      let redirectTo = '/doctor/dashboard'
      if (user.role === 'admin') {
        redirectTo = '/admin/dashboard'
      } else if (role === 'nurse' || user.role === 'nurse') {
        redirectTo = '/nurse/dashboard'
      } else {
        redirectTo = '/doctor/dashboard'
      }

      // Reset rate limit counter on valid credentials
      resetRateLimit(`login:${ip}:${email}`)

      // 10. Create authenticated session only when all checks pass
      const maxAge = rememberMe ? 7 * 24 * 3600 : 3600 // 7 days if rememberMe, otherwise 1 hour

      const response = NextResponse.json({
        success: true,
        status: 'APPROVED',
        redirectTo,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          category: user.category,
          verificationStatus: 'APPROVED',
          hospitalClinicName: user.hospitalClinicName,
        },
      })

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge,
        path: '/',
      }

      response.cookies.set('app-session', result.token, cookieOptions)
      response.cookies.set('payload-token', result.token, cookieOptions)

      return response
    } catch (authError: any) {
      if (
        authError.name === 'AuthenticationError' ||
        authError.message?.includes('incorrect') ||
        authError.message?.includes('not found') ||
        authError.message?.includes('Invalid')
      ) {
        // Scenario C: Invalid password or email
        return NextResponse.json(
          { message: 'Invalid email or password.' },
          { status: 401 }
        )
      }
      throw authError
    }
  } catch (error: any) {
    console.error('Login error:', error)

    if (error.message?.includes('locked')) {
      return NextResponse.json(
        { message: 'Account is temporarily locked due to repeated failed login attempts. Please try again in 10 minutes.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { message: 'Authentication service temporarily unavailable' },
      { status: 500 }
    )
  }
}
