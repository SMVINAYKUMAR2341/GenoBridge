'use client'

import React from 'react'
import { AuthVisualPanel } from '@/components/auth/AuthVisualPanel'

interface AuthCardShellProps {
  children: React.ReactNode
  maxWidth?: string
}

export function AuthCardShell({
  children,
  maxWidth = 'max-w-7xl',
}: AuthCardShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#04111d] flex items-center justify-center py-3 px-3 sm:py-4 sm:px-4 lg:py-4 lg:px-6">
      <div
        className={`w-full ${maxWidth} h-full lg:h-[calc(100vh-2rem)] bg-white rounded-3xl sm:rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100`}
      >
        {/* Left Brand Visual Panel with 4 curved squircle boxes & 3D DNA */}
        <div className="lg:col-span-5 p-2 sm:p-2.5">
          <AuthVisualPanel className="w-full h-full" />
        </div>

        {/* Right Content / Form Panel */}
        <div className="lg:col-span-7 flex flex-col justify-start overflow-y-auto px-6 py-5 sm:px-10 sm:py-7 lg:px-12 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthCardShell

