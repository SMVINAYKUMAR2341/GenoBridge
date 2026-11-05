'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Clock,
  ShieldCheck,
  Building,
  Award,
  RefreshCw,
  LogOut,
  Mail,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { AuthCardShell } from '@/components/auth/AuthCardShell'

export default function AccountPendingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [user, setUser] = useState<{
    name?: string
    email?: string
    role?: string
    category?: string
    verificationStatus?: string
    hospitalClinicName?: string
  } | null>(null)

  const checkStatus = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          if (data.user.verificationStatus === 'APPROVED' && data.user.enabled) {
            const dest =
              data.user.role === 'admin'
                ? '/admin/dashboard'
                : data.user.role === 'nurse'
                ? '/nurse/dashboard'
                : '/doctor/dashboard'
            router.push(dest)
            return
          }
          if (data.user.verificationStatus === 'REJECTED') {
            router.push('/account-rejected')
            return
          }
        }
      }
    } catch {
      // Offline / not signed in yet
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    void checkStatus()
  }, [])

  const handleLogout = async () => {
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
        {/* Badge & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>STATUS: VERIFICATION_PENDING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Application Under Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your clinical registration details have been securely recorded. An authorized medical administrator is reviewing your council registration to authorize access to genetic patient records.
          </p>
        </div>

        {/* Workflow Progress Steps */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Approval Process Stages
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">1. Registration Submitted</div>
                <div className="text-slate-500">Personal and institutional profile received.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">2. Work Email Captured</div>
                <div className="text-slate-500">Institutional domain acknowledged.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-800">3. Professional Council Review</div>
                <div className="text-slate-500">
                  Admin verification of State Medical / Nursing Council registration.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">4. Clinical Workspace Provisioning</div>
                <div className="text-slate-500">Access granted to patient referrals and decision support.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card if available */}
        {user && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-semibold text-slate-900">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Work Email:</span>
              <span className="font-mono text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-teal-700 capitalize">
                {user.category || user.role}
              </span>
            </div>
            {user.hospitalClinicName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="text-slate-900">{user.hospitalClinicName}</span>
              </div>
            )}
          </div>
        )}

        {/* Clinical Governance Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            To maintain patient data privacy under Indian health data governance, patient referral histories and clinical risk engines remain locked until verification completes (typically 24–48 hours).
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={checkStatus}
            disabled={checking}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold bg-[#00D8C3] text-slate-950 hover:bg-[#22C9EE] shadow-md shadow-[#00D8C3]/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="text-center pt-2 border-t border-slate-200">
          <a
            href="mailto:governance@helixgenetics.in?subject=Helix%20Account%20Verification%20Inquiry"
            className="text-xs text-slate-500 hover:text-teal-700 underline"
          >
            Need expedited verification? Contact Clinical Governance
          </a>
        </div>
      </div>
    </AuthCardShell>
  )
}
