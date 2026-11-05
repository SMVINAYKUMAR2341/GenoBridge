import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { AssessmentCatalogClient } from '@/components/assessment/AssessmentCatalogClient'

export const metadata: Metadata = {
  title: 'Clinical Pathways | Helix Decision Support',
  description: 'Evidence-informed clinical genetic pathways and referral decision support.',
}

export default async function AssessmentCatalogPage() {
  const user = await appAuth.currentSessionUser()

  if (!user) {
    redirect('/login')
  }

  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }
  if (user.verificationStatus !== 'APPROVED' || !user.enabled) {
    redirect('/account-pending')
  }

  return <AssessmentCatalogClient />
}
