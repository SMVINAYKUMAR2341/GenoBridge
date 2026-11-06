export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { appAuth } from '@/lib/app-auth'
import PedigreeStudioClient from '@/components/pedigree/PedigreeStudioClient'

export const metadata: Metadata = {
  title: 'Pedigree Studio | GENOBRIDGE Clinical Genetics',
  description: 'Three-Generation Visual Pedigree Chart & Multi-Family History Builder',
}

export default async function PedigreeStudioPage() {
  const user = await appAuth.currentSessionUser()
  return (
    <PedigreeStudioClient
      userName={user?.name || 'SM VINAY KUMAR'}
      userRole={user?.role || 'provider'}
    />
  )
}


