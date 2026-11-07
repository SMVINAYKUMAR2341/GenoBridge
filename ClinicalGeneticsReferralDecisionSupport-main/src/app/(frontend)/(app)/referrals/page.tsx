export const dynamic = 'force-dynamic'

import React from 'react'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import WorkspaceHistory from '@/components/clinical/WorkspaceHistory'

export default async function ReferralsPage() {
  const user = await appAuth.currentSessionUser()
  if (!user) {
    redirect('/login?redirect=/referrals')
  }
  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }
  if (user.verificationStatus !== 'APPROVED' || !user.enabled) {
    redirect('/account-pending')
  }

  return <WorkspaceHistory view="referrals" />
}

