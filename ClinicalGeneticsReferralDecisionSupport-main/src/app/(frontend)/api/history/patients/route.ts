import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { getUnifiedPatients } from '@/lib/patient-history-service'

export async function GET(req: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
      return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || searchParams.get('search') || ''

    const patients = await getUnifiedPatients(q)

    return NextResponse.json(
      {
        success: true,
        total: patients.length,
        patients,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching unified patients:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch patients' },
      { status: 500 },
    )
  }
}
