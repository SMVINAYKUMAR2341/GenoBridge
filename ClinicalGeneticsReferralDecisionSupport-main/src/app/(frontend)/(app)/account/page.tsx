import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import AccountManagementClient from '@/components/account/AccountManagementClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account Information & Security | GENOBRIDGE Clinical Genetics',
  description: 'Verified clinician profile, statutory registration credentials, and password security management.',
}

export default async function AccountPage() {
  const user = await appAuth.currentSessionUser()

  if (!user) {
    redirect('/login?redirect=/account')
  }

  const accountData = {
    id: user.id,
    name: user.name || 'Dr. Attending Clinician',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    email: user.email,
    phone: user.phone || undefined,
    role: user.role || undefined,
    category: user.category || undefined,
    medicalRegistrationNumber: user.medicalRegistrationNumber || undefined,
    stateMedicalCouncil: user.stateMedicalCouncil || undefined,
    registrationState: user.registrationState || undefined,
    nursingRegistrationNumber: user.nursingRegistrationNumber || undefined,
    stateNursingCouncil: user.stateNursingCouncil || undefined,
    hospitalClinicName: user.hospitalClinicName || undefined,
    department: user.department || undefined,
    designation: user.designation || undefined,
    verificationStatus:
      user.verificationStatus ||
      (user.enabled ? 'APPROVED' : 'PROFESSIONAL_VERIFICATION_PENDING'),
    emailVerified: user.emailVerified || false,
    submittedAt: user.submittedAt || user.createdAt || undefined,
  }

  return <AccountManagementClient user={accountData} />
}
