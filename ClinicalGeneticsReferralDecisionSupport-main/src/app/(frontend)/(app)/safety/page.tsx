export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import SafetyPanel from '@/components/clinical/SafetyPanel'

export const metadata: Metadata = {
  title: 'Security, Privacy & Deployment Readiness | GENOBRIDGE',
  description: 'Application security controls, data handling, account protection and deployment configuration verification.',
}

export default function SafetyPage() {
  return <SafetyPanel />
}
