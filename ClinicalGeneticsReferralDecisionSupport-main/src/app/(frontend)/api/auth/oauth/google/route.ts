import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') || 'gynecologist'
  const redirectParam = searchParams.get('redirect') || ''

  const origin = request.nextUrl.origin
  const callbackUrl = `${origin}/api/auth/oauth/callback`

  const stateObj = {
    role,
    redirect: redirectParam,
    nonce: Math.random().toString(36).substring(2),
  }
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url')

  const clientId = process.env.GOOGLE_CLIENT_ID

  // If live Google OAuth 2.0 Client ID is provisioned
  if (clientId) {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', clientId)
    googleAuthUrl.searchParams.set('redirect_uri', callbackUrl)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('state', state)
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'select_account')

    return NextResponse.redirect(googleAuthUrl.toString())
  }

  // If in Emergent Agent OAuth environment (from Histone)
  if (process.env.EMERGENT_AUTH_URL) {
    const emergentUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
      `${origin}/auth/callback`
    )}`
    return NextResponse.redirect(emergentUrl)
  }

  // Development / Staging fallback: Redirect to instant interactive OAuth account chooser
  const devChooserUrl = new URL(`${origin}/auth/callback`)
  devChooserUrl.searchParams.set('mode', 'dev_sso')
  devChooserUrl.searchParams.set('role', role)
  devChooserUrl.searchParams.set('state', state)

  return NextResponse.redirect(devChooserUrl.toString())
}

