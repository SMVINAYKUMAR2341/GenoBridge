'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import AssessmentsProvider from '@/components/providers/AssessmentsProvider'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/account-pending',
  '/account-rejected',
]

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const path = usePathname()

  useEffect(() => setOpen(false), [path])

  // Prevent mouse scroll from inadvertently changing values on number inputs
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const active = document.activeElement
      if (active instanceof HTMLInputElement && active.type === 'number') {
        active.blur()
      }
      if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
        e.target.blur()
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  const isAuthRoute = path === '/' || AUTH_ROUTES.some((route) => path?.startsWith(route))

  if (isAuthRoute) {
    return <div className="min-h-screen bg-[#031525] text-[#F2F7FA]">{children}</div>
  }

  return (
    <AssessmentsProvider>
      <div className="min-h-screen bg-white text-slate-900">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        {/* overflow-x-clip contains full-bleed bands without breaking the sticky top bar */}
        <div className="overflow-x-clip lg:pl-[284px]">
          <Topbar onMenu={() => setOpen(true)} />
          <motion.main
            key={path}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="mx-auto max-w-[1400px] px-4 pt-8 pb-14 lg:px-8"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </AssessmentsProvider>
  )
}
