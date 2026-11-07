import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/doctor',
  '/nurse',
  '/anc',
  '/assessment',
  '/pedigree',
  '/history',
  '/referrals',
  '/saved',
  '/admin/dashboard',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isProtected) {
    const sessionToken =
      request.cookies.get('app-session')?.value || request.cookies.get('payload-token')?.value

    if (!sessionToken || sessionToken.trim() === '' || sessionToken === 'null' || sessionToken === 'undefined') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/doctor',
    '/doctor/:path*',
    '/nurse',
    '/nurse/:path*',
    '/anc',
    '/anc/:path*',
    '/assessment',
    '/assessment/:path*',
    '/pedigree',
    '/pedigree/:path*',
    '/history',
    '/referrals',
    '/saved',
    '/admin/dashboard',
    '/admin/dashboard/:path*',
  ],
}

