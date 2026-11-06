export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { AncDashboard } from '@/components/anc/AncDashboard'

export const metadata: Metadata = {
  title: 'Antenatal Care (ANC) Registry | GENOBRIDGE Clinical Decision Support',
  description: 'MoHFW and ACOG compliant antenatal care registry, obstetric risk screening, and monitoring workspace.',
}

export default async function AncPage() {
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

  return (
    <div className="space-y-6">
      <AncDashboard userRole={user.role ?? 'provider'} userName={user.name || 'Doctor'} />
    </div>
  )
}
