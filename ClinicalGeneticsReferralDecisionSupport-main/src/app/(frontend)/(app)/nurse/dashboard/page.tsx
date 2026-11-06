export const dynamic = 'force-dynamic'

import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { appAuth } from '@/lib/app-auth'
import {
  HeartHandshake,
  UserPlus,
  GitBranch,
  FileSpreadsheet,
  Send,
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  ShieldAlert,
  Sparkles,
  Baby,
  Clock,
  GitFork,
} from 'lucide-react'
import PathwayScenarioHub from '@/components/dashboard/PathwayScenarioHub'
import PublishedGuidelinesIndex from '@/components/clinical/PublishedGuidelinesIndex'

export const metadata: Metadata = {
  title: 'Nurse Dashboard | GENOBRIDGE Clinical Genetics',
  description: 'Nurse & Medical Assistant Intake and Pedigree Workspace',
}

export default async function NurseDashboardPage() {
  const sessionUser = await appAuth.currentSessionUser()
  const user = sessionUser || {
    name: 'Clinical Nurse Coordinator',
    designation: 'Maternal Health Specialist',
    hospitalClinicName: 'GenoBridge Clinical Genetics Care Network',
    department: 'Obstetrics & Genetics OPD',
    role: 'nurse',
    category: 'nurse',
    verificationStatus: 'APPROVED',
    enabled: true,
  }

  return (
    <div className="space-y-8">
      {/* Nurse Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fce7f3] text-[#b8125d] text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>VERIFIED NURSE / MEDICAL ASSISTANT WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            {user.designation || 'Clinical Nurse Coordinator'} • {user.hospitalClinicName || 'Hospital Unit'} • {user.department || 'Obstetrics & Genetics'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/pedigree"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold bg-[#b8125d] text-white hover:bg-[#9d0f4e] shadow-xs transition"
          >
            <GitFork className="w-4 h-4" />
            <span>Open Pedigree Studio</span>
          </Link>
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 transition"
          >
            <span>New Genetic Assessment</span>
          </Link>
        </div>
      </div>

      {/* Role Governance Boundary Warning */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-amber-900">Clinical Governance Role Boundary</div>
          <div className="text-slate-600 leading-relaxed">
            In accordance with clinical safety rules, your account is authorized to register patients, capture multi-generation pedigree trees, record risk indicators, and create draft assessments. Final approval and diagnostic referral generation are reviewed by an authorized Gynecologist.
          </div>
        </div>
      </div>

      {/* Primary Intake Duties */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#08243B]/70 border border-[#164C60] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D8C3]/15 border border-[#00D8C3]/30 flex items-center justify-center text-[#00D8C3]">
            <Baby className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">1. ANC Patient Registration</h3>
          <p className="text-xs text-[#A9BDCA] leading-relaxed">
            Register new obstetric patients, calculate gestational age, G/P/L/A, Naegele's EDD, baseline vitals, and socio-demographics.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/anc/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D8C3] hover:underline"
            >
              <span>Register Patient</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[#164C60]">•</span>
            <Link
              href="/anc"
              className="inline-flex items-center gap-1 text-xs text-[#A9BDCA] hover:text-white"
            >
              <span>View Registry</span>
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#08243B]/70 border border-[#164C60] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D8C3]/15 border border-[#00D8C3]/30 flex items-center justify-center text-[#00D8C3]">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">2. Antenatal Visits &amp; Vitals</h3>
          <p className="text-xs text-[#A9BDCA] leading-relaxed">
            Record repeatable chronological ANC visits, blood pressure, SFH fundal height, FHR, urinalysis, and Td/TT vaccinations.
          </p>
          <div className="pt-2">
            <Link
              href="/anc"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D8C3] hover:underline"
            >
              <span>Document Visit Entry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#08243B]/70 border border-[#164C60] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D8C3]/15 border border-[#00D8C3]/30 flex items-center justify-center text-[#00D8C3]">
            <GitFork className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">3. Family Pedigree Studio</h3>
          <p className="text-xs text-[#A9BDCA] leading-relaxed">
            Build interactive 3-generation pedigree charts. Record maternal and paternal diagnoses, ages, and consanguinity for doctor review.
          </p>
          <div className="pt-2">
            <Link
              href="/pedigree"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D8C3] hover:underline"
            >
              <span>Open Pedigree Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Statutory Guidelines & Direct Professional Index (FOGSI / ACOG / ACMG / ASRM / NCCN) */}
      <PublishedGuidelinesIndex />

      {/* 6-Pathway Scenario Hub */}
      <PathwayScenarioHub
        title="Triage &amp; Intake Pathways"
        subtitle="Capture baseline clinical indicators across all 6 standardized genetics pathways for attending doctor evaluation."
      />
    </div>
  )
}

