export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { appAuth } from '@/lib/app-auth'
import {
  Stethoscope,
  ShieldCheck,
  FileCheck,
  Users,
  Activity,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Baby,
  AlertTriangle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Doctor Dashboard | Helix Clinical Genetics',
  description: 'Gynecologist & OB-GYN Decision Support Workspace',
}

export default async function DoctorDashboardPage() {
  const user = await appAuth.currentSessionUser()

  if (!user) {
    redirect('/login')
  }

  // Handle pending or rejected accounts
  if (user.verificationStatus === 'REJECTED') {
    redirect('/account-rejected')
  }
  if (user.verificationStatus !== 'APPROVED' || !user.enabled) {
    redirect('/account-pending')
  }

  // Role routing enforcement
  if (user.role === 'nurse') {
    redirect('/nurse/dashboard')
  }
  if (user.role === 'admin') {
    redirect('/admin/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Clinician Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#08243B] via-[#041e33] to-[#08243B] border border-[#164C60] shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D8C3]/15 border border-[#00D8C3]/30 text-[#00D8C3] text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>VERIFIED GYNECOLOGIST / OB-GYN WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dr. {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#A9BDCA] max-w-2xl">
            {user.designation || 'Consultant Gynecologist'} • {user.hospitalClinicName || 'Hospital Network'} • Council Reg: {user.medicalRegistrationNumber || 'Verified'} ({user.stateMedicalCouncil || 'NMC'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/anc"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] shadow-lg shadow-[#00D8C3]/20 transition-all"
          >
            <Baby className="w-4 h-4" />
            <span>Antenatal Care (ANC) Module</span>
          </Link>
          <Link
            href="/assessment/hereditary-cancer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#102B43] text-white border border-[#164C60] hover:bg-[#164C60] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Genetic Assessment</span>
          </Link>
        </div>
      </div>

      {/* Role Authority Indicator */}
      <div className="p-4 rounded-2xl bg-[#08243B]/60 border border-[#164C60]/70 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#00D8C3]/10 border border-[#00D8C3]/30 flex items-center justify-center text-[#00D8C3] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-white">Full Clinical Decision Approval Authority</div>
          <div className="text-[#A9BDCA] leading-relaxed">
            As a verified medical practitioner registered with {user.stateMedicalCouncil || 'the State Medical Council'}, you have statutory authority to finalize high-risk genetic triage recommendations, review nurse-prepared pedigree drafts, and sign specialist consultation briefs.
          </div>
        </div>
      </div>

      {/* Antenatal Care (ANC) Decision Support Module */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold uppercase tracking-wider text-[#00D8C3] flex items-center gap-2">
            <Baby className="w-5 h-5 text-[#00D8C3]" />
            <span>Antenatal Care (ANC) &amp; Obstetric Monitoring Module</span>
          </h2>
          <Link
            href="/anc"
            className="text-xs font-semibold text-[#00D8C3] hover:underline flex items-center gap-1"
          >
            <span>Open All ANC Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href="/anc"
            className="p-5 rounded-2xl bg-gradient-to-br from-[#08243B] to-[#041e33] border border-[#164C60] hover:border-[#00D8C3] transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#00D8C3]">CLINICAL REGISTRY</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                  High Risk Reviews
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                ANC Patient Registry &amp; High-Risk Reviews
              </h3>
              <p className="text-xs text-[#A9BDCA] leading-relaxed">
                Review nurse intake records, evaluate ACOG/MoHFW pre-eclampsia risk scores, confirm approved final EDD dating, inspect trimester hemograms, and approve specialist referrals.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#00D8C3]">
              <span>Review Antenatal Patients</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/anc/register"
            className="p-5 rounded-2xl bg-gradient-to-br from-[#08243B] to-[#041e33] border border-[#164C60] hover:border-[#00D8C3] transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#00D8C3]">OBSTETRIC REGISTRATION</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D8C3]/15 border border-[#00D8C3]/30 text-[#00D8C3]">
                  New Booking
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                New Antenatal Patient Booking &amp; Dating
              </h3>
              <p className="text-xs text-[#A9BDCA] leading-relaxed">
                Complete structured 6-step antenatal booking: Naegele's dating, G/P/L/A history, baseline vitals, BMI calculator, viral screening, and birth complication readiness plan.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#00D8C3]">
              <span>Open Registration Stepper</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Clinical Pathways Quick Access */}
      <div className="space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wider text-[#00D8C3]">
          Active Clinical Genetic Pathways
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/assessment/hereditary-cancer"
            className="p-5 rounded-2xl bg-[#08243B]/70 border border-[#164C60] hover:border-[#00D8C3] hover:shadow-lg hover:shadow-[#00D8C3]/10 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00D8C3]">PATHWAY 01</span>
              <h3 className="text-base font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                Hereditary Cancer Risk (BRCA1/2 &amp; Lynch)
              </h3>
              <p className="text-xs text-[#A9BDCA] leading-relaxed">
                NCCN / ACMG multi-generational family history triage for breast, ovarian, and colorectal cancer risk.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#00D8C3]">
              <span>Launch Assessment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/assessment/preconception-carrier"
            className="p-5 rounded-2xl bg-[#08243B]/70 border border-[#164C60] hover:border-[#00D8C3] hover:shadow-lg hover:shadow-[#00D8C3]/10 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00D8C3]">PATHWAY 02</span>
              <h3 className="text-base font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                Preconception &amp; Carrier Screening
              </h3>
              <p className="text-xs text-[#A9BDCA] leading-relaxed">
                ACOG committee opinion screening for hemoglobinopathies, spinal muscular atrophy, and cystic fibrosis.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#00D8C3]">
              <span>Launch Assessment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/assessment/nipt-discordance"
            className="p-5 rounded-2xl bg-[#08243B]/70 border border-[#164C60] hover:border-[#00D8C3] hover:shadow-lg hover:shadow-[#00D8C3]/10 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00D8C3]">PATHWAY 03</span>
              <h3 className="text-base font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                Atypical NIPT / cfDNA Results
              </h3>
              <p className="text-xs text-[#A9BDCA] leading-relaxed">
                Diagnostic counseling guidance for high-risk cell-free DNA aneuploidy calls and discordant ultrasound findings.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#00D8C3]">
              <span>Launch Assessment</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Clinical Review Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#08243B]/60 border border-[#164C60] space-y-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-[#00D8C3]" />
            <h3 className="text-base font-bold text-white">Pending Nurse Drafts for Review</h3>
          </div>
          <p className="text-xs text-[#A9BDCA] leading-relaxed">
            Nurse coordinators in your department have prepared preliminary clinical pedigrees and intake histories awaiting your final evaluation and sign-off.
          </p>
          <div className="pt-2">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#00D8C3] hover:underline"
            >
              <span>Inspect Assessment Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#08243B]/60 border border-[#164C60] space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#00D8C3]" />
            <h3 className="text-base font-bold text-white">Generated Referral Packages</h3>
          </div>
          <p className="text-xs text-[#A9BDCA] leading-relaxed">
            Access formal consultation documents formatted for clinical geneticists and diagnostic laboratories with full audit traceability.
          </p>
          <div className="pt-2">
            <Link
              href="/referrals"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#00D8C3] hover:underline"
            >
              <span>View Dispatched Referrals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

