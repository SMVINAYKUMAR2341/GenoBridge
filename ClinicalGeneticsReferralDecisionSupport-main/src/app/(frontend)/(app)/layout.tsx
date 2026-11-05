import type { ReactNode } from 'react'
import AppShell from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'

export default function Layout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
