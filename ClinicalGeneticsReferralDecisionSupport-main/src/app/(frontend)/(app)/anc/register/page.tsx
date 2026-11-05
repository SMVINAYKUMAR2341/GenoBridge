export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { AncForm } from '@/components/anc/AncForm'
import { getAncRecordById } from '@/lib/anc-store'

export const metadata: Metadata = {
  title: 'Register Antenatal Patient | Helix ANC Module',
  description: 'Complete obstetric intake and multi-step ANC registration form.',
}

interface RegisterPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function AncRegisterPage({ searchParams }: RegisterPageProps) {
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

  const { id } = await searchParams
  let initialRecord = undefined
  if (id) {
    initialRecord = (await getAncRecordById(id)) || undefined
  }

  return (
    <div className="space-y-6">
      <AncForm
        initialData={initialRecord}
        userRole={user.role ?? 'provider'}
        userName={user.name || 'Doctor'}
      />
    </div>
  )
}
