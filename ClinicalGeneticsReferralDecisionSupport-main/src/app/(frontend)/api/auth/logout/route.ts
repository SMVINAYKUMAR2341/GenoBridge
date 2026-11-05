import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    // Clear authentication cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    response.cookies.delete('payload-token')

    return response
  } catch (error: any) {
    console.error('Logout error:', error)

    // Even if there's an error, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out',
    })

    response.cookies.delete('payload-token')

    return response
  }
}
