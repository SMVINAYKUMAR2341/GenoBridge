export const dynamic = 'force-dynamic'

import React from 'react'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import AnalyticsPanel from '@/components/clinical/AnalyticsPanel'

export default async function AnalyticsPage() {
  const user = await appAuth.currentSessionUser()
  if (!user) {
    redirect('/login?redirect=/analytics')
  }
  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }
  if ((user.verificationStatus && user.verificationStatus !== 'APPROVED') || user.enabled === false) {
    redirect('/account-pending')
  }

  return <AnalyticsPanel />
}
