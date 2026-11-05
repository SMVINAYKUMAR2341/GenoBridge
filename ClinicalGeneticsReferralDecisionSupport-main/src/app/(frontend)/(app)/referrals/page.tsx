import { redirect } from 'next/navigation'
import { appAuth } from '@/lib/app-auth'
import WorkspaceHistory from '@/components/clinical/WorkspaceHistory'

export default async function ReferralsPage() {
  const user = await appAuth.currentSessionUser()
  if (!user) {
    redirect('/login')
  }
  return <WorkspaceHistory view="referrals" />
}
