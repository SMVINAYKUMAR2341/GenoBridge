import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getPayloadClient } from '@/lib/payload'
import { genoBridgeCache, CACHE_TAGS } from '@/lib/cache'

export const dynamic = 'force-dynamic'

function signPayloadJwt(payload: Record<string, any>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${signature}`
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  let selectedRole = 'gynecologist'
  if (stateRaw) {
    try {
      const decoded = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf-8'))
      if (decoded.role) selectedRole = decoded.role
    } catch {
      // Ignore state parse error
    }
  }

  // Handle Google OAuth Code exchange if code is provided
  let googleUser: { email: string; name: string; picture?: string; sub?: string } | null = null

  if (code && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    try {
      const callbackUrl = `${origin}/api/auth/oauth/callback`
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenRes.json()
      if (tokenData.access_token) {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        googleUser = await userRes.json()
      }
    } catch (err) {
      console.error('[Google OAuth] Token exchange error:', err)
    }
  }

  if (!googleUser || !googleUser.email) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Google authentication failed.')}`
    )
  }

  return await completeOAuthSession(googleUser, selectedRole, origin)
}

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin
  try {
    const body = await request.json()
    const { session_id, role = 'gynecologist', userProfile } = body

    let googleUser: { email: string; name: string; picture?: string } | null = userProfile || null

    // If GenoBridge Emergent OAuth session_id is provided
    if (session_id) {
      try {
        const emergentRes = await fetch(
          'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
          { headers: { 'X-Session-ID': session_id } }
        )
        if (emergentRes.ok) {
          const data = await emergentRes.json()
          googleUser = {
            email: data.email,
            name: data.name || data.email.split('@')[0],
            picture: data.picture || '',
          }
        }
      } catch (err) {
        console.error('[Emergent OAuth] Exchange failed:', err)
      }
    }

    if (!googleUser || !googleUser.email) {
      return NextResponse.json({ message: 'Invalid OAuth profile' }, { status: 400 })
    }

    return await completeOAuthSession(googleUser, role, origin, true)
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'OAuth error' }, { status: 500 })
  }
}

async function completeOAuthSession(
  googleUser: { email: string; name: string; picture?: string },
  role: string,
  origin: string,
  isJson: boolean = false
) {
  const payload = await getPayloadClient()
  const cleanEmail = googleUser.email.trim().toLowerCase()

  // 1. Check if user already exists in users collection
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: cleanEmail } },
    limit: 1,
  })

  let user: any = existing.docs[0] || null

  const mappedRole =
    role === 'nurse' ? 'nurse' : role === 'admin' ? 'admin' : 'provider'
  const mappedCategory = role === 'nurse' ? 'nurse' : 'gynecologist'

  // 2. If user does not exist, provision a new clinical account
  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString('hex') + 'A1!'
    user = await payload.create({
      collection: 'users',
      data: {
        email: cleanEmail,
        name: googleUser.name || cleanEmail.split('@')[0],
        password: randomPassword,
        role: mappedRole,
        category: mappedCategory,
        enabled: true,
        verificationStatus: 'APPROVED',
        hospitalClinicName: 'GENOBRIDGE Healthcare Network',
        department: mappedRole === 'nurse' ? 'Obstetrics & Nursing' : 'Clinical Genetics & OB-GYN',
        designation: mappedRole === 'nurse' ? 'Staff Nurse Coordinator' : 'Consultant Gynecologist',
      } as any,
    })
  }

  // 3. Generate secure signed Payload JWT
  const secret = process.env.PAYLOAD_SECRET || 'GENOBRIDGE-dev-secret-key-change-in-production-min-32-chars'
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 7 * 24 * 3600 // 7 days

  const token = signPayloadJwt(
    {
      id: user.id,
      collection: 'users',
      email: user.email,
      iat,
      exp,
    },
    secret
  )

  // 4. Prime the L1 & L2 cache
  const tokenSig = token.slice(-32)
  const cacheKey = `auth:session:${tokenSig}`
  await genoBridgeCache.set(cacheKey, user, 180, [CACHE_TAGS.userSession(user.id)])

  // 5. Determine redirect target
  let redirectTo = '/doctor/dashboard'
  if (user.role === 'admin') {
    redirectTo = '/admin/dashboard'
  } else if (user.role === 'nurse' || user.category === 'nurse') {
    redirectTo = '/nurse/dashboard'
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 3600,
    path: '/',
  }

  if (isJson) {
    const res = NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
    res.cookies.set('app-session', token, cookieOptions)
    res.cookies.set('payload-token', token, cookieOptions)
    return res
  }

  const res = NextResponse.redirect(`${origin}${redirectTo}`)
  res.cookies.set('app-session', token, cookieOptions)
  res.cookies.set('payload-token', token, cookieOptions)
  return res
}

