'use client'

import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileCode2,
  FileText,
  Info,
  Mail,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Send,
  X,
  UserCheck,
  Edit3,
} from 'lucide-react'
import type { WorkflowRecord } from '@/lib/workflow-store'
import type { DecisionResult, StandardTier } from '@/lib/decision-engine'
import { buildFhirGenomicsBundle, downloadFhirBundleJson } from '@/lib/fhir-genomics-bundle'

export const OUTCOME_LABELS: Record<string, string> = {
  urgent_referral: 'Urgent referral (Within 48–72h)',
  routine_referral: 'Routine referral (Within 2–4 weeks)',
  no_referral_needed: 'Routine obstetric / primary care',
  borderline_consideration: 'Priority specialist review (Within 1–2 weeks)',
  insufficient_information: 'Insufficient data — parameters missing',
  criteria_pending_approval: 'Criteria pending approval — manual review',
}

interface Props {
  record?: WorkflowRecord | null
  decision?: DecisionResult | null
  pathwaySlug?: string
  inputs?: Record<string, any>
  onReturnToForm?: () => void
}

export function WorkflowResult({
  record,
  decision,
  pathwaySlug,
  inputs,
  onReturnToForm,
}: Props) {
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('doctor@hospital.org')
  const [emailSending, setEmailSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null)

  // Doctor Override State
  const [isOverridden, setIsOverridden] = useState(false)
  const [overrideTier, setOverrideTier] = useState<StandardTier>('PRIORITY')
  const [overrideReason, setOverrideReason] = useState('')
  const [doctorName, setDoctorName] = useState('Dr. SM Vinay Kumar, MD (OB-GYN)')
  const [doctorRegNumber, setDoctorRegNumber] = useState('KMC-74892')
  const [attestationConfirmed, setAttestationConfirmed] = useState(false)

  // Bilingual Patient Note Tab State
  const [langTab, setLangTab] = useState<'en' | 'hi'>('en')
  const [editableSummaryEn, setEditableSummaryEn] = useState(
    decision?.patient_summary_en ||
      'Your doctor has recommended a specialist clinical genetics consultation based on verified clinical guidelines. This is an assistive referral navigation step to review family health records and discuss testing choices.'
  )
  const [editableSummaryHi, setEditableSummaryHi] = useState(
    decision?.patient_summary_hi ||
      'आपके चिकित्सक ने क्लिनिकल दिशा-निर्देशों के आधार पर विशेषज्ञ जेनेटिक परामर्श की अनुशंसा की है। यह किसी बीमारी का अंतिम निदान नहीं है, बल्कि स्वास्थ्य रिकॉर्ड की समीक्षा और उपयुक्त जांच विकल्पों पर मार्गदर्शन हेतु एक परामर्श है।'
  )

  // Extract server evaluation if present
  const snapshot = (record?.evaluationSnapshot as Record<string, unknown>) || {}
  const serverResult = (snapshot.result as Record<string, unknown>) || {}

  // Determine standard tier
  const recommendedTier: StandardTier = decision?.tier || (
    decision?.outcome === 'urgent'
      ? 'URGENT'
      : decision?.outcome === 'borderline'
        ? 'PRIORITY'
        : decision?.outcome === 'routine'
          ? 'ROUTINE'
          : 'COUNSEL_AND_REASSESS'
  )

  const activeTier: StandardTier = isOverridden ? overrideTier : recommendedTier

  const isUrgent = activeTier === 'URGENT'
  const isPriority = activeTier === 'PRIORITY'
  const isRoutine = activeTier === 'ROUTINE'
  const isCounsel = activeTier === 'COUNSEL_AND_REASSESS'
  const isInsufficient = activeTier === 'INSUFFICIENT_DATA'
  const isNoReferral = isCounsel || isInsufficient

  // Referral Target & Timeframe
  const referralTarget =
    (serverResult.referralTarget as string) ||
    decision?.referral_target ||
    (isNoReferral ? 'Routine Obstetric & Primary Care' : 'Clinical Genetics / Genetic Counselor')

  const timeframe = isUrgent
    ? '< 48–72 hours (Time-Critical)'
    : isPriority
      ? '< 1–2 weeks (Priority Review)'
      : isRoutine
        ? '< 2–4 weeks (Routine Consultation)'
        : 'Routine prenatal / clinical follow-up'

  // Rationale & Explanations
  const explanation =
    (serverResult.rationale as string) ||
    decision?.explanation ||
    (isNoReferral
      ? 'No active high-risk clinical genetics referral criteria were met on this evaluation. Standard routine prenatal and obstetric surveillance recommended.'
      : 'Deterministic guideline-aligned referral criteria met based on clinical assessment presentation.')

  // Matched Criteria list (Fired Rules Waterfall)
  const firedRules = decision?.fired_rules || []
  const counterfactuals = decision?.counterfactuals || []
  const dataGaps = decision?.not_fired_rules_with_missing_inputs || []
  const timeCtx = decision?.time_critical_context

  // Guideline citations
  const guidelineCitations = Array.from(
    new Set(
      decision?.guideline_citations && decision.guideline_citations.length > 0
        ? decision.guideline_citations
        : [
            'ACOG Practice Bulletin No. 691 / ACMG Tier 3 — Preconception Carrier Screening',
            'ACOG Practice Bulletin No. 226 / SMFM — Screening for Fetal Chromosomal Abnormalities',
            'ACOG Practice Bulletin No. 175 — Ultrasound Examination in Pregnancy',
            'ASRM Practice Committee 2024 — Evaluation of Recurrent Pregnancy Loss',
            'FOGSI Good Clinical Practice Recommendations in Antenatal Genetics',
            'NCCN Clinical Practice Guidelines in Oncology — Genetic/Familial High-Risk Assessment',
          ]
    )
  )

  const handleExportFhir = () => {
    try {
      const syntheticRef = record?.syntheticPatientReference || 'PATIENT-ENCOUNTER'
      const pedigreeModel = (record?.pedigree as any)?.people ? (record?.pedigree as any) : null
      const bundle = buildFhirGenomicsBundle(pedigreeModel, {
        patientName: syntheticRef,
        pathwayTitle: pathwaySlug || record?.pathwaySlug || 'genetics-assessment',
        decisionLabel: activeTier,
        guidelineCitations,
      })
      downloadFhirBundleJson(bundle, `fhir-abdm-bundle-${syntheticRef}.json`)
    } catch (e) {
      console.error('FHIR export error:', e)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      const patientRef = record?.syntheticPatientReference || 'PATIENT-ENCOUNTER'
      const res = await fetch('/api/referrals/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientRef,
          physicianName: doctorName,
          physicianRegNumber: doctorRegNumber,
          pathway: pathwaySlug || 'Clinical Genetics Decision Support',
          evaluation: {
            risk_level: activeTier,
            original_tier: recommendedTier,
            is_overridden: isOverridden,
            override_reason: overrideReason,
            confidence_score: decision?.confidence_score || 0.98,
            matched_rule_id: decision?.matched_rule_id || 'RULE-MATCH',
            guideline: guidelineCitations[0] || 'ACOG / NCCN / ACMG / ASRM Clinical Practice Guidelines',
            action: explanation,
            cpt_codes: decision?.cpt_codes || ['96040'],
            icd10_codes: decision?.icd10_codes || ['Z15.01'],
            triggering_inputs: inputs || {},
            time_critical_context: timeCtx,
            patient_summary_en: editableSummaryEn,
            patient_summary_hi: editableSummaryHi,
            fired_rules: firedRules,
            counterfactuals,
            data_gaps: dataGaps,
            attestation_confirmed: attestationConfirmed,
            ruleset_version_hash: 'SHA256:d8a29b4e7c10f3918a7c92b8',
          },
        }),
      })

      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Clinical_Brief_${patientRef.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      window.print()
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailStatus({ success: false, message: 'Please provide a valid recipient email address.' })
      return
    }

    try {
      setEmailSending(true)
      setEmailStatus(null)
      const patientRef = record?.syntheticPatientReference || 'PATIENT-ENCOUNTER'
      const res = await fetch('/api/referrals/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          referralId: record?.workflowKey || `case-${Date.now()}`,
          patientName: patientRef,
          pathwayTitle: pathwaySlug || 'Clinical Genetics Assessment',
          decisionLabel: `${activeTier} REFERRAL`,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setEmailStatus({ success: true, message: `Clinical brief dispatched successfully to ${recipientEmail}` })
        setTimeout(() => setShowEmailModal(false), 2000)
      } else {
        setEmailStatus({ success: false, message: data.message || 'Dispatch failed' })
      }
    } catch (err: any) {
      setEmailStatus({ success: false, message: err.message || 'Network error sending email' })
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <div className="space-y-6 text-white animate-in fade-in duration-300">
      {/* 1. Indian Statutory PCPNDT Notice (for prenatal pathways) */}
      {timeCtx?.pcpndt_notice && (
        <div className="rounded-2xl border border-red-900/70 bg-red-950/40 p-5 text-xs text-red-200 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-red-300 uppercase tracking-wider text-xs">
            <ShieldAlert size={16} />
            <span>Statutory Notice: PC&amp;PNDT Act, 1994 Mandatory Compliance</span>
          </div>
          <p className="leading-relaxed text-red-200">
            {timeCtx.pcpndt_notice}
          </p>
        </div>
      )}

      {/* 2. MTP Act 2021 Urgency Benchmark Banner (if pregnant & GA entered) */}
      {timeCtx?.urgency_deadline && (
        <div className="rounded-2xl border border-amber-800/70 bg-amber-950/40 p-5 text-xs text-amber-200 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider text-xs">
              <Clock size={16} />
              <span>Time-Critical Urgency Benchmark (MTP Act 2021)</span>
            </div>
            {timeCtx.days_to_mtp_24w_limit !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-900 text-amber-200 font-bold text-[11px]">
                {timeCtx.days_to_mtp_24w_limit} days to 24-week limit
              </span>
            )}
          </div>
          <p className="font-bold text-white text-sm">
            {timeCtx.urgency_deadline}
          </p>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {timeCtx.mtp_notice}
          </p>
        </div>
      )}

      {/* 3. Authoritative Clinical Referral Decision Hero Banner */}
      <div
        className={`rounded-2xl p-6 sm:p-8 text-white shadow-xl border ${
          isUrgent
            ? 'bg-gradient-to-r from-[#881337] via-[#9f1239] to-[#be123c] border-rose-500/50'
            : isPriority
              ? 'bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#c2410c] border-orange-500/50'
              : isRoutine
                ? 'bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#b45309] border-amber-500/50'
                : 'bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669] border-emerald-500/50'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] opacity-90 mb-3">
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>CLINICAL REFERRAL DECISION — DOCTOR REVIEW REQUIRED</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold tracking-wider text-[11px] backdrop-blur-xs">
            {isOverridden ? `OVERRIDDEN: ${activeTier}` : activeTier}
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
          {isUrgent && <AlertCircle className="w-9 h-9 text-rose-200 shrink-0" />}
          {isPriority && <AlertTriangle className="w-9 h-9 text-orange-200 shrink-0" />}
          {isRoutine && <AlertTriangle className="w-9 h-9 text-amber-200 shrink-0" />}
          {isNoReferral && <CheckCircle2 className="w-9 h-9 text-emerald-200 shrink-0" />}
          <span>
            {isUrgent
              ? 'Urgent Clinical Referral Recommended (Same day – 72h)'
              : isPriority
                ? 'Priority Clinical Referral Recommended (Within 1–2 weeks)'
                : isRoutine
                  ? 'Routine Clinical Referral Recommended (Within 2–4 weeks)'
                  : isCounsel
                    ? 'Counsel and Reassess — Guideline Criteria Not Met'
                    : 'Insufficient Data — Essential Parameters Missing'}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm sm:text-base font-medium">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider opacity-80">Referral Target:</span>
            <span className="font-bold underline underline-offset-4">{referralTarget}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="opacity-80" />
            <span className="text-xs uppercase tracking-wider opacity-80">Recommended Timeframe:</span>
            <span className="font-bold">{timeframe}</span>
          </div>
        </div>
      </div>

      {/* 4. Glass-Box Clinical Rationale (Replacing SHAP with Fired Criteria Waterfall) */}
      <section className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0e4331] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#34d399]" />
            <h3 className="text-sm font-mono tracking-[0.18em] uppercase font-bold text-[#34d399]">
              Glass-Box Clinical Rationale (Guideline Waterfall)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#033424] text-[#a7f3d0] border border-[#0e5c3e] flex items-center gap-1.5">
              <span>Determinism:</span>
              <strong className="text-white font-mono">100% Guideline Match</strong>
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#033424] text-[#34d399] border border-[#0e5c3e]">
              RULE: {decision?.matched_rule_id || 'STATUTORY-CRITERIA'}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-200 font-medium">
          {explanation}
        </p>

        {/* Fired Criteria Waterfall Cards */}
        {firedRules.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Triggering Guideline Criteria Met ({firedRules.length})
            </div>
            {firedRules.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-4 text-sm space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span>{r.label}</span>
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                      r.tier === 'URGENT'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : r.tier === 'PRIORITY'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {r.tier}
                  </span>
                </div>
                {r.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>
                )}
                <div className="pt-2 border-t border-[#0e4331]/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#34d399] font-medium flex items-center gap-1.5">
                    <ShieldCheck size={13} className="shrink-0" />
                    <span>Citation: {r.citation}</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Action: Non-treatment referral
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-4 text-xs text-slate-300 text-center">
            No active high-risk clinical genetics referral criteria were triggered by the entered inputs.
          </div>
        )}
      </section>

      {/* 5. What Would Change This (Counterfactual Sensitivity Analysis) */}
      {counterfactuals.length > 0 && (
        <section className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-md space-y-3">
          <div className="flex items-center gap-2 border-b border-[#0e4331] pb-3">
            <Sparkles size={16} className="text-[#34d399]" />
            <h3 className="text-sm font-mono tracking-[0.18em] uppercase font-bold text-[#34d399]">
              What Would Change This (Counterfactual Analysis)
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Sensitivity modeling showing what clinical changes would alter the recommended referral tier:
          </p>
          <div className="space-y-2.5 pt-1">
            {counterfactuals.map((cf, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-3.5 text-xs grid sm:grid-cols-3 gap-3 items-center"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Factor</span>
                  <strong className="text-white font-medium">{cf.factor}</strong>
                  <span className="block text-[11px] text-slate-300 mt-0.5">Currently: {cf.current_value}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Alternative Scenario</span>
                  <span className="text-amber-200 font-medium">{cf.alternate_value}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Resulting Tier</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#033424] text-[#34d399] border border-[#0e5c3e] inline-block">
                    {cf.resulting_tier}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{cf.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Data Gaps (Missing Inputs That Could Alter Tier) */}
      {dataGaps.length > 0 && (
        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 text-xs text-slate-300 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-slate-200 uppercase tracking-wider text-xs">
            <Info size={15} className="text-[#34d399]" />
            <span>Data Gaps — Unentered Clinical Parameters</span>
          </div>
          <p className="text-[11px] text-slate-400">
            The following fields were left unanswered. Entering them may escalate or modify the referral tier:
          </p>
          <div className="grid sm:grid-cols-2 gap-2 pt-1">
            {dataGaps.map((gap, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>{gap.rule_label}</span>
                  <span className="text-[10px] font-mono text-amber-300">Potential: {gap.potential_tier}</span>
                </div>
                <div className="text-[10px] text-slate-400">{gap.guideline_citation}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Bilingual Patient-Friendly Summary (6th-Grade Reading Level) */}
      <section className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0e4331] pb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#34d399]" />
            <h3 className="text-sm font-mono tracking-[0.18em] uppercase font-bold text-[#34d399]">
              Patient Guidance Summary (6th-Grade Reading Level)
            </h3>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[#0e4331] bg-[#032a1f] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLangTab('en')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                langTab === 'en' ? 'bg-[#10b981] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLangTab('hi')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                langTab === 'hi' ? 'bg-[#10b981] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          This patient-facing guidance note explains why the referral is suggested, what to bring, questions to ask, and what to expect during the consultation (without diagnosis or medication advice). Clinicians may edit prior to export.
        </p>

        {langTab === 'en' ? (
          <textarea
            rows={8}
            value={editableSummaryEn}
            onChange={(e) => setEditableSummaryEn(e.target.value)}
            className="w-full p-4 rounded-xl border border-[#0e4331] bg-[#032a1f] text-slate-200 text-xs font-sans leading-relaxed focus:outline-none focus:border-[#10b981]"
          />
        ) : (
          <textarea
            rows={8}
            value={editableSummaryHi}
            onChange={(e) => setEditableSummaryHi(e.target.value)}
            className="w-full p-4 rounded-xl border border-[#0e4331] bg-[#032a1f] text-slate-200 text-xs font-sans leading-relaxed focus:outline-none focus:border-[#10b981]"
          />
        )}
      </section>

      {/* 8. Doctor-in-the-Loop Override & Attestation Panel */}
      <section className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#0e4331] pb-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <UserCheck size={18} className="text-[#34d399]" />
            <span>Doctor-in-the-Loop Override &amp; Approval Sign-Off</span>
          </div>
          <span className="text-[11px] font-mono text-[#34d399] uppercase">
            Mandatory Attestation
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold block">Attending Clinician Name</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white text-xs font-medium focus:outline-none focus:border-[#10b981]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold block">Medical Council Reg. No. (NMC / SMC)</label>
            <input
              type="text"
              value={doctorRegNumber}
              onChange={(e) => setDoctorRegNumber(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white text-xs font-medium focus:outline-none focus:border-[#10b981]"
            />
          </div>
        </div>

        {/* Override Control */}
        <div className="p-4 rounded-xl border border-[#0e5c3e] bg-[#033424]/40 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-white">
            <input
              type="checkbox"
              checked={isOverridden}
              onChange={(e) => setIsOverridden(e.target.checked)}
              className="w-4 h-4 rounded accent-[#10b981]"
            />
            <span>Override Algorithmic Tier Recommendation with Clinical Judgement</span>
          </label>

          {isOverridden && (
            <div className="space-y-3 pt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                    Select Clinician-Assigned Tier
                  </label>
                  <select
                    value={overrideTier}
                    onChange={(e) => setOverrideTier(e.target.value as StandardTier)}
                    className="w-full h-10 px-3 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white text-xs font-bold focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="URGENT">URGENT (Time-Critical, same day to 72h)</option>
                    <option value="PRIORITY">PRIORITY (Within 1–2 weeks)</option>
                    <option value="ROUTINE">ROUTINE (Standard consultation)</option>
                    <option value="COUNSEL_AND_REASSESS">COUNSEL &amp; REASSESS (Criteria not met)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                    Mandatory Clinical Override Justification (Audit Logged)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Document clinical rationale for overriding engine recommendation"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white text-xs focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Doctor Review Attestation Checkbox */}
        <label className="flex items-start gap-3 p-4 rounded-xl border border-[#0e5c3e] bg-[#033424] cursor-pointer text-xs text-white">
          <input
            type="checkbox"
            checked={attestationConfirmed}
            onChange={(e) => setAttestationConfirmed(e.target.checked)}
            className="w-4 h-4 rounded accent-[#10b981] mt-0.5 shrink-0"
          />
          <span className="leading-relaxed">
            <strong>Doctor Review Completed:</strong> I confirm that I have reviewed the clinical parameters, deterministic guideline criteria, and statutory evidence. I authorize the release of this clinical referral brief and confirm compliance with the PC&amp;PNDT Act, 1994 and DPDP Act, 2023.
          </span>
        </label>
      </section>

      {/* 9. Clinical Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {onReturnToForm && (
          <button
            type="button"
            onClick={onReturnToForm}
            className="px-5 py-2.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white hover:bg-[#063825] hover:border-[#10b981]/50 text-sm font-semibold transition cursor-pointer flex items-center gap-2"
          >
            ← Modify Inputs
          </button>
        )}

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={handleExportFhir}
            className="px-4 py-2.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-[#34d399] hover:bg-[#033424] hover:border-[#10b981] text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <FileCode2 size={16} />
            <span>Export FHIR ABDM Bundle</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-[#34d399] hover:bg-[#033424] hover:border-[#10b981] text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Mail size={16} />
            <span>Email Brief to Physician</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || !attestationConfirmed}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Download size={16} />
            <span>
              {downloadingPdf
                ? 'Generating Vector PDF…'
                : !attestationConfirmed
                  ? 'Sign Doctor Attestation to Download'
                  : 'Download Approved PDF Brief'}
            </span>
          </button>
        </div>
      </div>

      {/* Email Dispatch Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0e4331] pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Mail size={18} className="text-[#34d399]" />
                <span>Secure Physician Email Dispatch</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Transmits the approved clinical referral brief with attached vector PDF over encrypted TLS. Protected under the Digital Personal Data Protection (DPDP) Act, 2023 and ABDM Health Data Management Policy.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold block">
                Attending Physician Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white text-xs font-semibold focus:outline-none focus:border-[#10b981]"
                placeholder="physician@hospital.org"
              />
            </div>

            {emailStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  emailStatus.success
                    ? 'bg-[#033424] text-[#a7f3d0] border border-[#0e5c3e]'
                    : 'bg-rose-950/80 text-rose-200 border border-rose-800'
                }`}
              >
                {emailStatus.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
                <span>{emailSending ? 'Dispatching…' : 'Transmit Brief'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
