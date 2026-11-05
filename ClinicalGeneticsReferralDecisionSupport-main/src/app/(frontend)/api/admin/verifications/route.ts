import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'
import crypto from 'node:crypto'

export async function GET(request: NextRequest) {
  try {
    const caller = await appAuth.currentSessionUser()
    const isAdmin = caller && (caller.role === 'admin' || (caller as any).collection === 'admins')

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized. Administrator privileges required to inspect professional verifications.' },
        { status: 403 }
      )
    }

    const payload = await getPayload({ config })
    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')

    const where: any = {}
    if (statusFilter && statusFilter !== 'ALL') {
      where.verificationStatus = { equals: statusFilter }
    }

    const applicants = await payload.find({
      collection: 'users',
      where,
      limit: 100,
      sort: '-submittedAt',
      overrideAccess: true,
    })

    const formatted = applicants.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phone: doc.phone,
      category: doc.category,
      role: doc.role,
      medicalRegistrationNumber: doc.medicalRegistrationNumber,
      stateMedicalCouncil: doc.stateMedicalCouncil,
      registrationState: doc.registrationState,
      nursingRegistrationNumber: doc.nursingRegistrationNumber,
      stateNursingCouncil: doc.stateNursingCouncil,
      hospitalClinicName: doc.hospitalClinicName,
      department: doc.department,
      designation: doc.designation,
      submittedAt: doc.submittedAt || doc.createdAt,
      verificationStatus: doc.verificationStatus,
      emailVerified: doc.emailVerified,
      enabled: doc.enabled,
      rejectionReason: doc.rejectionReason,
      reviewedBy: doc.reviewedBy,
      reviewedAt: doc.reviewedAt,
      additionalInfoRequested: doc.additionalInfoRequested,
    }))

    return NextResponse.json({
      success: true,
      count: formatted.length,
      applicants: formatted,
    })
  } catch (error: any) {
    console.error('Fetch verifications error:', error)
    return NextResponse.json(
      { message: 'Failed to retrieve verifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await appAuth.currentSessionUser()
    const isAdmin = caller && (caller.role === 'admin' || (caller as any).collection === 'admins')

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized. Only administrators may approve or reject professional credentials.' },
        { status: 403 }
      )
    }

    const { userId, action, reason, notes } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { message: 'User ID and action (APPROVE | REJECT | REQUEST_INFO) are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })
    const userDoc = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    }) as any

    if (!userDoc) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const reviewerName = caller.name || caller.email || 'Admin Reviewer'

    if (action === 'APPROVE') {
      const isDoctor = userDoc.role === 'provider' || userDoc.category === 'gynecologist'
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          verificationStatus: 'APPROVED',
          enabled: true,
          reviewedBy: reviewerName,
          reviewedAt: now,
          reviewerAuthorized: isDoctor,
          reviewerQualification: isDoctor ? userDoc.clinicalQualification || 'Board-Certified OB/GYN' : null,
          reviewerAuthorizationExpiresAt: isDoctor ? oneYearLater : null,
        },
        overrideAccess: true,
      })

      // Write immutable audit log
      await payload.create({
        collection: 'audit-logs',
        overrideAccess: true,
        data: {
          eventCode: `VER-APP-${crypto.randomUUID()}`,
          actorName: reviewerName,
          actorRole: 'Specialist Admin',
          actionType: 'CRITERIA_VALIDATED',
          resourceRef: `users:${userId}`,
          details: `Approved clinical credentials for ${userDoc.name} (${userDoc.category || userDoc.role}). Reg: ${userDoc.medicalRegistrationNumber || userDoc.nursingRegistrationNumber || 'N/A'}. Enabled: true.`,
          encryptionVerified: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Account for ${userDoc.name} has been APPROVED and activated.`,
        verificationStatus: 'APPROVED',
      })
    }

    if (action === 'REJECT') {
      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return NextResponse.json({ message: 'A specific reason is required to reject an application' }, { status: 400 })
      }

      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          verificationStatus: 'REJECTED',
          enabled: false,
          rejectionReason: reason.trim(),
          reviewedBy: reviewerName,
          reviewedAt: now,
        },
        overrideAccess: true,
      })

      await payload.create({
        collection: 'audit-logs',
        overrideAccess: true,
        data: {
          eventCode: `VER-REJ-${crypto.randomUUID()}`,
          actorName: reviewerName,
          actorRole: 'Specialist Admin',
          actionType: 'CRITERIA_VALIDATED',
          resourceRef: `users:${userId}`,
          details: `Rejected clinical registration for ${userDoc.name}. Reason: ${reason.trim()}`,
          encryptionVerified: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Application for ${userDoc.name} has been REJECTED.`,
        verificationStatus: 'REJECTED',
      })
    }

    if (action === 'REQUEST_INFO') {
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          additionalInfoRequested: notes ? notes.trim() : 'Additional proof of registration required.',
          reviewedBy: reviewerName,
          reviewedAt: now,
        },
        overrideAccess: true,
      })

      return NextResponse.json({
        success: true,
        message: `Additional information requested for ${userDoc.name}.`,
      })
    }

    return NextResponse.json({ message: 'Invalid action specified' }, { status: 400 })
  } catch (error: any) {
    console.error('Process verification error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update verification' },
      { status: 500 }
    )
  }
}

