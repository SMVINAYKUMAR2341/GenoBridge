export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import AssessmentFlow from '@/components/assessment/AssessmentFlow'
import { PATHWAYS, pathwayBySlug } from '@/data/pathways'
import { appAuth } from '@/lib/app-auth'

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pathway = pathwayBySlug(slug)
  if (!pathway) notFound()

  const user = await appAuth.currentSessionUser()

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/assessment/${slug}`)}`)
  }

  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }

  if (user.verificationStatus !== 'APPROVED' || !user.enabled) {
    redirect('/account-pending')
  }

  return <AssessmentFlow pathway={pathway} />
}
