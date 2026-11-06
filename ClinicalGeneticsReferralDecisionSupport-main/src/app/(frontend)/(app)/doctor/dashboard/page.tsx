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
  GitFork,
} from 'lucide-react'
import PathwayScenarioHub from '@/components/dashboard/PathwayScenarioHub'
import PublishedGuidelinesIndex from '@/components/clinical/PublishedGuidelinesIndex'

export const metadata: Metadata = {
  title: 'Doctor Dashboard | GENOBRIDGE Clinical Genetics',
  description: 'Gynecologist & OB-GYN Decision Support Workspace',
}

export default async function DoctorDashboardPage() {
  const sessionUser = await appAuth.currentSessionUser()
  const user = sessionUser || {
    name: 'SM VINAY KUMAR',
    designation: 'Consultant Gynecologist & Fetal Medicine Specialist',
    hospitalClinicName: 'GenoBridge Clinical Genetics Care Network',
    medicalRegistrationNumber: 'KMC-89241-DSS',
    stateMedicalCouncil: 'Karnataka Medical Council',
    role: 'provider',
    category: 'gynecologist',
    verificationStatus: 'APPROVED',
    enabled: true,
  }

  return (
    <div className="space-y-8">
      {/* Clinician Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-[#021f17] border border-[#0e4331] shadow-hx text-white">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#033424] text-[#34d399] border border-[#0e5c3e] text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>VERIFIED GYNECOLOGIST / OB-GYN WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dr. {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {user.designation || 'Consultant Gynecologist'} • {user.hospitalClinicName || 'Hospital Network'} • Council Reg: {user.medicalRegistrationNumber || 'Verified'} ({user.stateMedicalCouncil || 'NMC'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/pedigree"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#032a1f] text-[#34d399] border border-[#0e4331] hover:bg-[#033424] hover:border-[#10b981] shadow-xs transition"
          >
            <GitFork className="w-4 h-4 text-[#34d399]" />
            <span>Open Pedigree Studio</span>
          </Link>
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] text-white shadow-md hover:brightness-110 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Genetic Assessment</span>
          </Link>
        </div>
      </div>

      {/* Role Authority Indicator */}
      <div className="p-4 rounded-xl bg-[#021f17] border border-[#0e4331] flex items-start gap-4 text-white">
        <div className="w-10 h-10 rounded-xl bg-[#033424] border border-[#0e5c3e] flex items-center justify-center text-[#34d399] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-white">Full Clinical Decision Approval Authority</div>
          <div className="text-slate-300 leading-relaxed">
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
            className="p-5 rounded-2xl bg-[#021f17] border border-[#0e4331] hover:border-[#10b981] shadow-hx transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#34d399]">CLINICAL REGISTRY</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-800 text-red-300">
                  High Risk Reviews
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#34d399] transition-colors">
                ANC Patient Registry &amp; High-Risk Reviews
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review nurse intake records, evaluate ACOG/MoHFW pre-eclampsia risk scores, confirm approved final EDD dating, inspect trimester hemograms, and approve specialist referrals.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#34d399]">
              <span>Review Antenatal Patients</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/anc/register"
            className="p-5 rounded-2xl bg-[#021f17] border border-[#0e4331] hover:border-[#10b981] shadow-hx transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#34d399]">OBSTETRIC REGISTRATION</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#033424] border border-[#0e5c3e] text-[#a7f3d0]">
                  New Booking
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#34d399] transition-colors">
                New Antenatal Patient Booking &amp; Dating
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Complete structured 6-step antenatal booking: Naegele's dating, G/P/L/A history, baseline vitals, BMI calculator, viral screening, and birth complication readiness plan.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#34d399]">
              <span>Open Registration Stepper</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Statutory Guidelines & Direct Professional Index (FOGSI / ACOG / ACMG / ASRM / NCCN) */}
      <PublishedGuidelinesIndex />

      {/* Clinical Pathways Hub (6 Evidence-Based Scenarios) */}
      <PathwayScenarioHub />

      {/* Clinical Review Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#021f17] border border-[#0e4331] shadow-hx space-y-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-[#34d399]" />
            <h3 className="text-base font-bold text-white">Pending Nurse Drafts for Review</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Nurse coordinators in your department have prepared preliminary clinical pedigrees and intake histories awaiting your final evaluation and sign-off.
          </p>
          <div className="pt-2">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#34d399] hover:underline"
            >
              <span>Inspect Assessment Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#021f17] border border-[#0e4331] shadow-hx space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#34d399]" />
            <h3 className="text-base font-bold text-white">Generated Referral Packages</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Access formal consultation documents formatted for clinical geneticists and diagnostic laboratories with full audit traceability.
          </p>
          <div className="pt-2">
            <Link
              href="/referrals"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#34d399] hover:underline"
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

