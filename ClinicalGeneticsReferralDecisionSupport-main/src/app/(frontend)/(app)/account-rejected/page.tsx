'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  XCircle,
  AlertOctagon,
  Mail,
  ArrowRight,
  LogOut,
  HelpCircle,
  FileQuestion,
  ArrowLeft,
} from 'lucide-react'
import { AuthCardShell } from '@/components/auth/AuthCardShell'

export default function AccountRejectedPage() {
  const router = useRouter()
  const [rejectionDetails, setRejectionDetails] = useState<{
    name?: string
    email?: string
    rejectionReason?: string
  } | null>(null)

  useEffect(() => {
    // Try to retrieve user details if session exists
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setRejectionDetails({
            name: data.user.name,
            email: data.user.email,
            rejectionReason: data.user.rejectionReason,
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <AuthCardShell>
      <div className="max-w-xl mx-auto w-full my-auto py-2 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-medium">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>STATUS: REGISTRATION_NOT_APPROVED</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Access Not Granted
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We were unable to verify your clinical credentials with the designated State Medical or Nursing Council. Clinical decision support and patient records access is restricted.
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
          <div className="flex items-center gap-2 text-rose-900 text-xs font-bold uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Reviewer Findings</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            {rejectionDetails?.rejectionReason ||
              'The council registration number provided could not be matched against active council registries, or institutional credentials could not be verified by the clinical governance committee.'}
          </p>
        </div>

        {/* Next Steps / Appeal */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600">
          <h3 className="font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>What Can You Do?</span>
          </h3>
          <ul className="space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-slate-900">Submit Clarification:</strong> Contact our verification team with a digital copy of your valid State Medical Council or Nursing Council certificate.
            </li>
            <li>
              <strong className="text-slate-900">Update Hospital Credentials:</strong> If your registration details or posting hospital changed, request a record review.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href="mailto:governance@helixgenetics.in?subject=Helix%20Clinical%20Account%20Re-verification%20Appeal"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold bg-[#00D8C3] text-slate-950 hover:bg-[#22C9EE] shadow-md shadow-[#00D8C3]/20 transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Appeal to Clinical Governance</span>
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="text-center pt-2 border-t border-slate-200">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </AuthCardShell>
  )
}
