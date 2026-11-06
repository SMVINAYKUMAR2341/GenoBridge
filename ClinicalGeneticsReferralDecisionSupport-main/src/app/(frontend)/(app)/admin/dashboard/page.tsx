export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { appAuth } from '@/lib/app-auth'
import { AdminVerificationPanel } from '@/components/admin/AdminVerificationPanel'
import ClinicalCriteriaManager from '@/components/admin/ClinicalCriteriaManager'
import {
  ShieldAlert,
  UserCheck,
  FileCheck2,
  Lock,
  Database,
  Sliders,
  History,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Administrator Dashboard | GENOBRIDGE Clinical Governance',
  description: 'Clinical Account Verification & Governance Management',
}

export default async function AdminDashboardPage() {
  const user = await appAuth.currentSessionUser()

  if (!user) {
    redirect('/login')
  }

  // Strictly enforce admin role
  if (user.role !== 'admin' && (user as any).collection !== 'admins') {
    if (user.role === 'nurse') redirect('/nurse/dashboard')
    redirect('/doctor/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#08243B] via-[#041e33] to-[#08243B] border border-[#164C60] shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>SYSTEM GOVERNANCE &amp; CREDENTIALING ADMINISTRATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Portal — {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#A9BDCA] max-w-2xl">
            Review professional medical and nursing registrations, provision verified staff access, inspect audit records, and manage security governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#031525] text-white border border-[#164C60] hover:border-[#00D8C3] transition-all"
          >
            <Database className="w-3.5 h-3.5 text-[#00D8C3]" />
            <span>Payload Admin</span>
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#031525] text-white border border-[#164C60] hover:border-[#00D8C3] transition-all"
          >
            <History className="w-3.5 h-3.5 text-[#00D8C3]" />
            <span>Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Role Restriction Notice */}
      <div className="p-4 rounded-2xl bg-[#08243B]/60 border border-[#164C60] flex items-start gap-3 text-xs text-[#A9BDCA]">
        <ShieldAlert className="w-4 h-4 text-[#00D8C3] shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Least-Privilege Notice:</strong> In accordance with GENOBRIDGE clinical governance invariants, administrator privileges include account provisioning, credential verification, and audit review, but do not automatically grant authorization to sign clinical genetic assessments or patient referral letters.
        </p>
      </div>

      {/* Professional Verification Interface */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#00D8C3]" />
              <span>Professional Healthcare Registrations Queue</span>
            </h2>
            <p className="text-xs text-[#A9BDCA]">
              Verify Gynecologist (NMC/State Medical Council) and Nurse (INC/State Nursing Council) submissions before unlocking patient clinical workflows.
            </p>
          </div>
        </div>

        <AdminVerificationPanel />
      </div>

      {/* Clinical Guideline Criteria & Thresholds Governance (GenoBridge Admin Engine) */}
      <div className="pt-6 border-t border-[#164C60]/60">
        <ClinicalCriteriaManager />
      </div>
    </div>
  )
}

