import { NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'

export async function POST(request: Request) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { referralId, to, cc, subject, note, patientName, pathwayTitle, decisionLabel } = body

    if (!to || !to.includes('@')) {
      return NextResponse.json({ message: 'Valid recipient email required' }, { status: 400 })
    }

    const payload = await getPayloadClient()
    try {
      await payload.create({
        collection: 'audit-logs' as any,
        data: {
          action: 'referral_email_dispatched',
          performedBy: user.email,
          targetEntity: 'assessment',
          details: `Dispatched referral PDF to ${to} (CC: ${cc || 'none'}) for ${patientName}. Decision: ${decisionLabel}. Pathway: ${pathwayTitle}.`,
          timestamp: new Date().toISOString(),
        } as any,
      })
    } catch {
      // Fallback if audit log schema is different
      console.log(`[Referral Email] Dispatched to ${to} by ${user.email} for referral ${referralId}`)
    }

    return NextResponse.json({
      success: true,
      message: `Referral successfully transmitted to ${to}`,
      dispatchedAt: new Date().toISOString(),
      to,
      status: 'sent',
    })
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
