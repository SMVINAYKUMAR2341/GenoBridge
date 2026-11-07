import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Stethoscope,
  HeartHandshake,
  ShieldCheck,
  FileCheck,
  Award,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Baby,
  Activity,
  FileText,
  UserCheck,
} from 'lucide-react'
import { appAuth } from '@/lib/app-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Staff & Account Management | GENOBRIDGE Clinical Genetics',
  description: 'Role-based access, credentialing and clinical delegation for Gynecologists and Nurses',
}

export default async function AccountPage() {
  const user = await appAuth.currentSessionUser()

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#164C60]/50">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#00D8C3] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D8C3] animate-pulse" />
            <span>CLINICAL STAFF &amp; DELEGATION ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Staff Account &amp; OPD Role Delegation
          </h1>
          <p className="mt-2 text-sm text-[#A9BDCA] max-w-3xl leading-relaxed">
            Role-based operational hierarchy designed for crowded Indian Maternal &amp; Child Health OPDs.
            Enables high-speed nurse pedigree intake while preserving statutory Gynecologist signoff authority under FOGSI and NMC guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/doctor/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3]/15 text-[#00D8C3] border border-[#00D8C3]/40 hover:bg-[#00D8C3]/25 transition"
          >
            Doctor Dashboard
          </Link>
          <Link
            href="/nurse/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#164C60]/50 text-white border border-[#164C60] hover:bg-[#164C60] transition"
          >
            Nurse Dashboard
          </Link>
        </div>
      </div>

      {/* Active Logged-In Account Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#08243B] via-[#041e33] to-[#08243B] border border-[#164C60] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00D8C3]/30 to-[#22C9EE]/20 border border-[#00D8C3]/50 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#00D8C3]/10">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">
                  {user?.name || 'Dr. Attending Clinician'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-[#00D8C3]/20 text-[#00D8C3] border border-[#00D8C3]/40">
                  {user?.role ? user.role.toUpperCase() : 'PROVIDER · OB/GYN'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-xs text-[#A9BDCA]">
                {user?.email || 'clinician.obg@hospital.gov.in'} · State Medical Council Reg: <strong className="text-white">REG-94821</strong>
              </p>
              <div className="text-[11px] text-[#A9BDCA] flex items-center gap-4 pt-1">
                <span>Facility: <strong>Department of Obstetrics &amp; Gynecology</strong></span>
                <span>Unit: <strong>Antenatal OPD Clinic</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l border-[#164C60]/70 pt-4 md:pt-0 md:pl-6">
            <div className="text-right hidden md:block">
              <div className="text-[11px] font-mono text-[#00D8C3] font-semibold">ABDM COMPLIANT</div>
              <div className="text-xs text-[#A9BDCA]">HPR ID: 91-8201-4491-01</div>
            </div>
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00D8C3] to-[#22C9EE] text-[#031525] hover:brightness-110 shadow-lg shadow-[#00D8C3]/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch OPD Intake</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Side-by-Side Clinical Role Architecture */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Role 1: Gynecologist / OB-GYN Provider */}
        <div className="rounded-3xl border border-[#00D8C3]/40 bg-[#08243B]/70 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00D8C3]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00D8C3]/15 border border-[#00D8C3]/40 flex items-center justify-center text-[#00D8C3]">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#00D8C3]">
                  PRIMARY CLINICAL DECISION MAKER
                </span>
                <h2 className="text-xl font-extrabold text-white">Gynecologist / OB-GYN</h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00D8C3] text-[#031525]">
              Attending Doctor
            </span>
          </div>

          <p className="text-xs text-[#A9BDCA] leading-relaxed">
            Registered medical practitioner with statutory authority to diagnose, assess reproductive risks, order invasive prenatal procedures, and approve genetic specialist consultation handovers.
          </p>

          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00D8C3]" />
              <span>Statutory Clinical Authorities</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#A9BDCA]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D8C3] shrink-0 mt-0.5" />
                <span><strong className="text-white">Approve &amp; Finalize Referrals:</strong> Sole authority to sign off on high-risk genetic triage recommendations (e.g. ACOG PB 226, NCCN HBOC, FOGSI).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D8C3] shrink-0 mt-0.5" />
                <span><strong className="text-white">Invasive Procedure Orders:</strong> Authority to schedule and perform Chorionic Villus Sampling (CVS) and Amniocentesis for high-risk cfDNA/ultrasound findings.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D8C3] shrink-0 mt-0.5" />
                <span><strong className="text-white">Digital Attestation:</strong> Digitally seals HL7 FHIR Genomics R4 bundles and clinical referral memos with State Medical Council registration stamp.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D8C3] shrink-0 mt-0.5" />
                <span><strong className="text-white">Criteria Governance:</strong> Review and attest clinical rule updates in the governed guideline database.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-[#164C60]/60 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#A9BDCA] block">Statutory Council:</span>
              <span className="font-semibold text-white">NMC / State Medical Council</span>
            </div>
            <div>
              <span className="text-[#A9BDCA] block">Qualifications:</span>
              <span className="font-semibold text-white">MBBS, MS/MD (OBG), DNB</span>
            </div>
          </div>
        </div>

        {/* Role 2: Staff Nurse / Clinical Genetic Nurse */}
        <div className="rounded-3xl border border-[#164C60] bg-[#08243B]/50 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#22C9EE]/15 border border-[#22C9EE]/40 flex items-center justify-center text-[#22C9EE]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#22C9EE]">
                  POINT-OF-CARE OPD COPILOT
                </span>
                <h2 className="text-xl font-extrabold text-white">Staff Nurse / Genetic Nurse</h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#164C60] text-white">
              Clinical Triage
            </span>
          </div>

          <p className="text-xs text-[#A9BDCA] leading-relaxed">
            Frontline healthcare professional responsible for breaking the 5-minute OPD crunch. Captures family history, flags red markers, and prepares draft assessments prior to doctor review.
          </p>

          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#22C9EE]" />
              <span>Core OPD Responsibilities</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#A9BDCA]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C9EE] shrink-0 mt-0.5" />
                <span><strong className="text-white">2-Minute Pedigree Intake:</strong> Guided intake capturing consanguinity, 3-generation lineage, recurrent pregnancy loss (RPL), and inherited traits.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C9EE] shrink-0 mt-0.5" />
                <span><strong className="text-white">Ultrasound &amp; Lab Triage:</strong> Flags abnormal structural ultrasound findings (thickened NT &ge; 3.5 mm, cystic hygroma) and cfDNA/NIPT reports.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C9EE] shrink-0 mt-0.5" />
                <span><strong className="text-white">Routine ANC Monitoring:</strong> Records booking visit vitals, blood pressure, hemoglobin electrophoresis, and pre-eclampsia screening.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C9EE] shrink-0 mt-0.5" />
                <span><strong className="text-white">Draft Preparation:</strong> Submits structured intake workflows into the attending Gynecologist review queue (cannot unilaterally finalize).</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-[#164C60]/60 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#A9BDCA] block">Statutory Council:</span>
              <span className="font-semibold text-white">INC / State Nursing Council</span>
            </div>
            <div>
              <span className="text-[#A9BDCA] block">Qualifications:</span>
              <span className="font-semibold text-white">B.Sc Nursing / GNM</span>
            </div>
          </div>
        </div>
      </div>

      {/* OPD Workflow Handover: 5-Minute Crunch Solution */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08243B]/60 border border-[#164C60] space-y-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-[#00D8C3]">
            HOW IT SOLVES THE 5-MINUTE OPD CRUNCH
          </span>
          <h3 className="text-xl font-bold text-white mt-1">
            Nurse-to-Gynecologist Handover Sequence
          </h3>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#031525] border border-[#164C60]/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#22C9EE]/20 text-[#22C9EE] flex items-center justify-center font-bold text-xs">
              01
            </div>
            <div className="text-sm font-bold text-white">Nurse 2-Min Intake</div>
            <p className="text-xs text-[#A9BDCA] leading-relaxed">
              Nurse documents consanguinity, recurrent pregnancy loss, and scans in waiting area or triage desk.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#031525] border border-[#164C60]/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#00D8C3]/20 text-[#00D8C3] flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div className="text-sm font-bold text-white">Guideline Matching</div>
            <p className="text-xs text-[#A9BDCA] leading-relaxed">
              Deterministic rule engine checks findings against FOGSI, ACOG, and ACMG criteria in &lt;1 second.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#031525] border border-[#164C60]/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#00D8C3]/20 text-[#00D8C3] flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div className="text-sm font-bold text-white">Gynecologist Review</div>
            <p className="text-xs text-[#A9BDCA] leading-relaxed">
              Doctor sees pre-triage alert, confirms urgency tier, and signs the clinical assessment brief in 45 seconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#031525] border border-[#164C60]/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div className="text-sm font-bold text-white">ABDM / FHIR Dispatch</div>
            <p className="text-xs text-[#A9BDCA] leading-relaxed">
              One-click generation of HL7 FHIR Genomics JSON bundle and printable PDF referral handed to patient.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

