export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { AuthCardShell } from '@/components/auth/AuthCardShell'
import { KeyRound } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reset Password | Helix Clinical Genetics',
  description: 'Reset your Helix healthcare professional account password',
}

export default function ForgotPasswordPage() {
  return (
    <AuthCardShell>
      <div className="max-w-xl mx-auto w-full my-auto py-2">
        <div className="mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium mb-3">
            <KeyRound className="w-3.5 h-3.5 text-teal-600" />
            <span>Account Security Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Reset Your Password
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Enter your verified work email address to receive single-use credentials recovery instructions.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </AuthCardShell>
  )
}
