export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { AssessmentCatalogClient } from '@/components/assessment/AssessmentCatalogClient'

export const metadata: Metadata = {
  title: 'Clinical Pathways | GENOBRIDGE Decision Support',
  description: 'Evidence-informed clinical genetic pathways and referral decision support.',
}

export default async function AssessmentCatalogPage() {
  // Seamless open access: no admin or login permission gate required
  return <AssessmentCatalogClient />
}

