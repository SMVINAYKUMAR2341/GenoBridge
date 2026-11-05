import { NextRequest, NextResponse } from 'next/server'
import { appAuth } from '@/lib/app-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        category: user.category,
        medicalRegistrationNumber: user.medicalRegistrationNumber,
        stateMedicalCouncil: user.stateMedicalCouncil,
        registrationState: user.registrationState,
        nursingRegistrationNumber: user.nursingRegistrationNumber,
        stateNursingCouncil: user.stateNursingCouncil,
        hospitalClinicName: user.hospitalClinicName,
        department: user.department,
        designation: user.designation,
        verificationStatus: user.verificationStatus || (user.enabled ? 'APPROVED' : 'PROFESSIONAL_VERIFICATION_PENDING'),
        emailVerified: user.emailVerified,
        enabled: user.enabled,
        rejectionReason: user.rejectionReason,
        reviewedBy: user.reviewedBy,
        reviewedAt: user.reviewedAt,
        additionalInfoRequested: user.additionalInfoRequested,
        submittedAt: user.submittedAt || user.createdAt,
      },
    })
  } catch (error: any) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { authenticated: false, message: 'Session check failed' },
      { status: 500 }
    )
  }
}

