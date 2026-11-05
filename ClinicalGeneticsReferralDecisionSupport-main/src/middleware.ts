import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/doctor',
  '/nurse',
  '/anc',
  '/assessment',
  '/history',
  '/referrals',
  '/saved',
  '/admin/dashboard',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isProtected) {
    const sessionToken =
      request.cookies.get('app-session')?.value || request.cookies.get('payload-token')?.value

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/doctor/:path*',
    '/nurse/:path*',
    '/anc/:path*',
    '/assessment/:path*',
    '/history',
    '/referrals',
    '/saved',
    '/admin/dashboard/:path*',
  ],
}

