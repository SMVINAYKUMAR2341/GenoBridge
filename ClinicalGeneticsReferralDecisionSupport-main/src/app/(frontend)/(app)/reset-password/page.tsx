import React from 'react'
import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { AuthCardShell } from '@/components/auth/AuthCardShell'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Set New Password | Helix Clinical Genetics',
  description: 'Create a new secure password for your clinical workspace',
}

export default function ResetPasswordPage() {
  return (
    <AuthCardShell>
      <div className="max-w-xl mx-auto w-full my-auto py-2">
        <div className="mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Secure Credential Reset</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create New Password
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Please choose a strong, unique password to protect patient health records and clinical decisions.
          </p>
        </div>

        <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading reset verification...</div>}>
          <ResetPasswordForm />
        </React.Suspense>
      </div>
    </AuthCardShell>
  )
}
