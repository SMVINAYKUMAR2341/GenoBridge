import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'
import { getUnifiedPatientDossier } from '@/lib/patient-history-service'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await appAuth.currentSessionUser()
    if (!user || user.verificationStatus !== 'APPROVED' || !user.enabled) {
      return NextResponse.json({ error: 'Unauthorized clinical session' }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'Patient identifier required' }, { status: 400 })
    }

    const dossier = await getUnifiedPatientDossier(id)
    if (!dossier) {
      return NextResponse.json({ error: `Patient '${id}' not found` }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        dossier,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching patient dossier:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch patient history' },
      { status: 500 },
    )
  }
}

