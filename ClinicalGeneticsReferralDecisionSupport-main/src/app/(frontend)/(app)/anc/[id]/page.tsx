export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import { getAncRecordById } from '@/lib/anc-store'
import { AncRecordView } from '@/components/anc/AncRecordView'

interface AncRecordPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AncRecordPageProps): Promise<Metadata> {
  const { id } = await params
  const record = await getAncRecordById(id)
  return {
    title: record ? `${record.booking.name} — ANC Record | Helix` : 'Antenatal Patient Record | Helix',
    description: 'Detailed maternal and child protection record, timeline, and clinical evaluation.',
  }
}

export default async function AncDetailPage({ params }: AncRecordPageProps) {
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

  const { id } = await params
  const record = await getAncRecordById(id)

  if (!record) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <AncRecordView
        record={record}
        userRole={user.role ?? 'provider'}
        userName={user.name || 'Doctor'}
      />
    </div>
  )
}
