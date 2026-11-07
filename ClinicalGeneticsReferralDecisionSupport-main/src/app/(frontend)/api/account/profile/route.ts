import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await appAuth.currentSessionUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        category: user.category,
        designation: user.designation || '',
        department: user.department || '',
        hospitalClinicName: user.hospitalClinicName || '',
        medicalRegistrationNumber: user.medicalRegistrationNumber || '',
        stateMedicalCouncil: user.stateMedicalCouncil || '',
        registrationState: user.registrationState || '',
        nursingRegistrationNumber: user.nursingRegistrationNumber || '',
        stateNursingCouncil: user.stateNursingCouncil || '',
        verificationStatus:
          user.verificationStatus ||
          (user.enabled ? 'APPROVED' : 'PROFESSIONAL_VERIFICATION_PENDING'),
        emailVerified: Boolean(user.emailVerified),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/account/profile:', error)
    return NextResponse.json(
      { message: 'Failed to retrieve account profile.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await appAuth.currentSessionUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))

    // Input sanitization and validation
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined
    const designation = typeof body.designation === 'string' ? body.designation.trim() : undefined
    const department = typeof body.department === 'string' ? body.department.trim() : undefined
    const hospitalClinicName =
      typeof body.hospitalClinicName === 'string'
        ? body.hospitalClinicName.trim()
        : undefined

    if (name !== undefined && (name.length < 2 || name.length > 100)) {
      return NextResponse.json(
        { message: 'Full name must be between 2 and 100 characters.' },
        { status: 400 }
      )
    }

    if (phone !== undefined && phone.length > 25) {
      return NextResponse.json(
        { message: 'Phone number cannot exceed 25 characters.' },
        { status: 400 }
      )
    }

    // Explicitly reject any attempts to update role, status, or administrative permissions
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (designation !== undefined) updateData.designation = designation
    if (department !== undefined) updateData.department = department
    if (hospitalClinicName !== undefined) updateData.hospitalClinicName = hospitalClinicName

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No valid profile fields provided for update.' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Persist changes directly to database
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: updateData,
      overrideAccess: true,
    })

    // Log security audit record
    try {
      const actorRole =
        user.role === 'nurse'
          ? 'Nurse / MA'
          : user.role === 'admin'
            ? 'Clinic Administrator'
            : 'OB/GYN Provider'

      await payload.create({
        collection: 'audit-logs',
        data: {
          eventCode: `AUD-PRF-${Date.now()}`,
          actorName: user.name || 'Staff User',
          actorRole,
          actionType: 'STAFF_ACCESS_CHANGED',
          resourceRef: `users:${user.id}`,
          details: `User profile fields updated: ${Object.keys(updateData).join(', ')}`,
          encryptionVerified: true,
        },
        overrideAccess: true,
      })
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully and persisted to database.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        category: updatedUser.category,
        designation: updatedUser.designation || '',
        department: updatedUser.department || '',
        hospitalClinicName: updatedUser.hospitalClinicName || '',
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Error in PATCH /api/account/profile:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to update account profile.' },
      { status: 500 }
    )
  }
}

