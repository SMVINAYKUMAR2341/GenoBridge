export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { AssessmentCatalogClient } from '@/components/assessment/AssessmentCatalogClient'

export const metadata: Metadata = {
  title: 'Doctor Dashboard | GENOBRIDGE Clinical Genetics',
  description: 'Evidence-informed clinical genetic pathways and referral decision support.',
}

export default async function DoctorDashboardPage() {
  return <AssessmentCatalogClient />
}
