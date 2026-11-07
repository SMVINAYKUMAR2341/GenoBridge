export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import PedigreeStudioClient from '@/components/pedigree/PedigreeStudioClient'

export const metadata: Metadata = {
  title: 'Pedigree Studio | GENOBRIDGE Clinical Genetics',
  description: 'Three-Generation Visual Pedigree Chart & Multi-Family History Builder',
}

export default async function PedigreeStudioPage() {
  const user = await appAuth.currentSessionUser()

  if (!user) {
    redirect('/login?redirect=/pedigree')
  }

  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }

  if (user.verificationStatus !== 'APPROVED' || !user.enabled) {
    redirect('/account-pending')
  }

  return (
    <PedigreeStudioClient
      userName={user.name || 'Attending Clinician'}
      userRole={user.role || 'provider'}
    />
  )
}


