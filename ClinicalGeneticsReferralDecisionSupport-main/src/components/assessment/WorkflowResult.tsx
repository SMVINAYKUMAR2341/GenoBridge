'use client'

import React from 'react'
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
  Printer,
  ShieldCheck,
} from 'lucide-react'
import type { WorkflowRecord } from '@/lib/workflow-store'
import type { DecisionResult } from '@/lib/decision-engine'
import { buildFhirGenomicsBundle, downloadFhirBundleJson } from '@/lib/fhir-genomics-bundle'

export const OUTCOME_LABELS: Record<string, string> = {
  urgent_referral: 'Urgent referral',
  routine_referral: 'Routine referral',
  no_referral_needed: 'No referral needed',
  borderline_consideration: 'Manual clinical review',
  insufficient_information: 'Insufficient information — manual review',
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
  // Extract server evaluation if present
  const snapshot = (record?.evaluationSnapshot as Record<string, unknown>) || {}
  const serverResult = (snapshot.result as Record<string, unknown>) || {}

  // Determine final outcome
  const rawDecisionKey =
    (serverResult.decision as string) ||
    decision?.clinical_decision ||
    (decision?.outcome === 'urgent'
      ? 'urgent_referral'
      : decision?.outcome === 'routine'
        ? 'routine_referral'
        : decision?.outcome === 'borderline'
          ? 'borderline_consideration'
          : 'no_referral_needed')

  const isUrgent = rawDecisionKey === 'urgent_referral' || decision?.outcome === 'urgent'
  const isRoutine = rawDecisionKey === 'routine_referral' || decision?.outcome === 'routine'
  const isBorderline = rawDecisionKey === 'borderline_consideration' || decision?.outcome === 'borderline'
  const isNoReferral = !isUrgent && !isRoutine && !isBorderline

  // Referral Target & Timeframe
  const referralTarget =
    (serverResult.referralTarget as string) ||
    decision?.referral_target ||
    (isNoReferral ? 'Routine Obstetric & Primary Care' : 'Clinical Genetics / Genetic Counselor')

  const timeframe = isUrgent
    ? '< 48–72 hours'
    : isRoutine
      ? '< 2–3 weeks'
      : isBorderline
        ? 'At next scheduled clinical review'
        : 'Routine prenatal follow-up'

  // Rationale & Explanations
  const explanation =
    (serverResult.rationale as string) ||
    decision?.explanation ||
    (isNoReferral
      ? 'No active high-risk clinical genetics referral criteria were met on this evaluation. Standard routine prenatal and obstetric surveillance recommended.'
      : 'Deterministic guideline-aligned referral criteria met based on clinical assessment presentation.')

  // Matched Criteria list
  const rawCriteria = (serverResult.matchedCriteria as any[]) || decision?.matched_criteria || []
  const matchedCriteria = Array.isArray(rawCriteria)
    ? rawCriteria.map((c: any) => ({
        key: c.rule_key || c.code || c.id || 'RULE',
        label: c.label || c.title || 'Clinical Criterion',
        description: c.description || '',
        outcome: c.outcome || (isUrgent ? 'urgent' : 'routine'),
        target: c.referral_target || referralTarget,
        citation: c.guideline_source
          ? `${c.guideline_source}: ${c.citation || ''}`
          : c.guidelineCitation || 'ACOG / ACMG / FOGSI Clinical Practice Guidelines',
      }))
    : []

  // Guidelines citations list
  const guidelineCitations =
    decision?.guideline_citations && decision.guideline_citations.length > 0
      ? decision.guideline_citations
      : [
          'ACOG Practice Bulletin 691 & FOGSI Preconception Guidelines — Carrier Screening',
          'ACOG Committee Opinion 690 — Carrier Screening in Consanguineous Unions',
          'ACMG Technical Standards for Clinical Genetics Practice',
          'NCCN Clinical Practice Guidelines in Oncology — Genetic/Familial High-Risk Assessment',
        ]

  const handleExportFhir = () => {
    try {
      const syntheticRef = record?.syntheticPatientReference || 'SYN-STANDALONE'
      const bundle = buildFhirGenomicsBundle({
        workflowKey: record?.workflowKey || `genobridge-${Date.now()}`,
        syntheticPatientReference: syntheticRef,
        pathwaySlug: pathwaySlug || record?.pathwaySlug || 'genetics-assessment',
        decision: rawDecisionKey,
        referralTarget,
        inputs: inputs || (record?.assessmentInputs as Record<string, unknown>) || {},
        matchedCriteria: matchedCriteria.map((c) => ({
          code: c.key,
          title: c.label,
          outcome: c.outcome,
          guidelineCitation: c.citation,
        })),
        guidelines: guidelineCitations,
      })
      downloadFhirBundleJson(bundle, `fhir-genomics-${syntheticRef}.json`)
    } catch (e) {
      console.error('FHIR export error:', e)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 text-white animate-in fade-in duration-300">
      {/* 1. Authoritative Clinical Recommendation Hero Banner */}
      <div
        className={`rounded-2xl p-6 sm:p-8 text-white shadow-xl border ${
          isUrgent
            ? 'bg-gradient-to-r from-[#881337] via-[#9f1239] to-[#be123c] border-rose-500/50'
            : isRoutine
              ? 'bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#b45309] border-amber-500/50'
              : isBorderline
                ? 'bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#475569] border-slate-500/50'
                : 'bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669] border-emerald-500/50'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] opacity-90 mb-3">
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>CLINICAL REFERRAL DECISION</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold tracking-wider text-[11px] backdrop-blur-xs">
            {isUrgent
              ? 'REFER — URGENT'
              : isRoutine
                ? 'REFER — ROUTINE'
                : isBorderline
                  ? 'BORDERLINE CONSIDERATION'
                  : 'NO REFERRAL NEEDED'}
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
          {isUrgent && <AlertCircle className="w-9 h-9 text-rose-200 shrink-0" />}
          {isRoutine && <AlertTriangle className="w-9 h-9 text-amber-200 shrink-0" />}
          {isBorderline && <Info className="w-9 h-9 text-slate-200 shrink-0" />}
          {isNoReferral && <CheckCircle2 className="w-9 h-9 text-emerald-200 shrink-0" />}
          <span>
            {isUrgent
              ? 'Urgent Clinical Referral Recommended'
              : isRoutine
                ? 'Routine Clinical Referral Recommended'
                : isBorderline
                  ? 'Borderline Presentation — Specialist Discussion'
                  : 'No Immediate Genetics Referral Indicated'}
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

      {/* 2. Deterministic Decision Rationale */}
      <section className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#0e4331] pb-3">
          <h3 className="text-sm font-mono tracking-[0.18em] uppercase font-bold text-[#34d399] flex items-center gap-2">
            <FileText size={16} />
            Deterministic Decision Rationale
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#033424] text-[#a7f3d0] border border-[#0e5c3e]">
            ENGINE: FOGSI · ACOG · ACMG · NCCN
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-200 font-medium">
          {explanation}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-3 text-xs">
            <span className="text-slate-400 block mb-1">Target Specialist</span>
            <span className="font-bold text-white text-sm">{referralTarget}</span>
          </div>
          <div className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-3 text-xs">
            <span className="text-slate-400 block mb-1">Timeframe</span>
            <span className="font-bold text-white text-sm">{timeframe}</span>
          </div>
          <div className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-3 text-xs">
            <span className="text-slate-400 block mb-1">Evaluation Status</span>
            <span className="font-bold text-[#34d399] text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              Verified Deterministic
            </span>
          </div>
        </div>
      </section>

      {/* 3. Matched Clinical Criteria */}
      <section className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#0e4331] pb-3">
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <span>Matched Criteria &amp; Practice Guidelines</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#033424] text-[#34d399] border border-[#0e5c3e]">
              {matchedCriteria.length} rule{matchedCriteria.length === 1 ? '' : 's'} met
            </span>
          </h3>
        </div>

        {matchedCriteria.length > 0 ? (
          <div className="space-y-3">
            {matchedCriteria.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-4 text-sm space-y-2 hover:border-[#10b981]/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span>{c.label}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                      c.outcome === 'urgent'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {c.outcome}
                  </span>
                </div>
                {c.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
                )}
                <div className="pt-1.5 border-t border-[#0e4331]/80 text-[11px] text-[#34d399] font-medium flex items-center gap-1.5">
                  <ShieldCheck size={13} className="shrink-0" />
                  <span>Guideline: {c.citation}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#0e4331] bg-[#032a1f] p-5 text-sm text-slate-300 text-center">
            No high-risk criteria triggered by the recorded clinical inputs. Patient is eligible for standard routine monitoring.
          </div>
        )}
      </section>

      {/* 4. Governing Practice Guidelines */}
      <section className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-6 shadow-md space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Source Clinical Guidelines &amp; Statutory Provenance
        </h4>
        <ul className="space-y-2 text-xs text-slate-300">
          {guidelineCitations.map((g, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1 shrink-0" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. Clinical Action Controls */}
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
            <span>Export FHIR Genomics</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-md"
          >
            <Printer size={16} />
            <span>Print / Save Referral</span>
          </button>
        </div>
      </div>
    </div>
  )
}
