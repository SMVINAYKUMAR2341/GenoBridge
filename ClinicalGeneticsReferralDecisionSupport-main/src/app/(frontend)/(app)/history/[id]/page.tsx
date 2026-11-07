export const dynamic = 'force-dynamic'

import React from 'react'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import PatientHistoryClient from '@/components/history/PatientHistoryClient'

interface HistoryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const user = await appAuth.currentSessionUser()
  if (!user) {
    redirect('/login?redirect=/history')
  }
  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }
  if (user.verificationStatus !== 'APPROVED' || !user.enabled) {
    redirect('/account-pending')
  }

  const { id } = await params

  return <PatientHistoryClient initialPatientId={id} />
}
