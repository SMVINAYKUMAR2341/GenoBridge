export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { AssessmentCatalogClient } from '@/components/assessment/AssessmentCatalogClient'

export const metadata: Metadata = {
  title: 'Nurse Dashboard | GENOBRIDGE Clinical Genetics',
  description: 'Evidence-informed clinical genetic pathways and referral decision support.',
}

export default async function NurseDashboardPage() {
  const user = await appAuth.currentSessionUser()

  if (!user) {
    redirect('/login?role=nurse&redirect=/nurse/dashboard')
  }

  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }

  if (user.verificationStatus !== 'APPROVED' || !user.enabled) {
    redirect('/account-pending')
  }

  return <AssessmentCatalogClient />
}
