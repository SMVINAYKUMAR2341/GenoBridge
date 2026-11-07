import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'

export async function POST(request: NextRequest) {
  try {
    await appAuth.logout()

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    response.cookies.delete('app-session')
    response.cookies.delete('payload-token')

    return response
  } catch (error: any) {
    console.error('Logout error:', error)

    const response = NextResponse.json({
      success: true,
      message: 'Logged out',
    })

    response.cookies.delete('app-session')
    response.cookies.delete('payload-token')

    return response
  }
}

