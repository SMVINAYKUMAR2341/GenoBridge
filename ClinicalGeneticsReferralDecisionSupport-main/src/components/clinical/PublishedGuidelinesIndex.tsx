'use client'

import React from 'react'
import Link from 'next/link'
import { BookOpen, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react'

export interface GuidelineIndexItem {
  org: 'FOGSI' | 'ACOG' | 'ACMG' | 'ASRM' | 'NCCN'
  docNumber: string
  title: string
  scope: string
  tone: string
}

export const PUBLISHED_GUIDELINES: GuidelineIndexItem[] = [
  {
    org: 'FOGSI',
    docNumber: 'FOGSI GCPR 2024',
    title: 'Routine Antenatal Care & Consanguinity',
    scope: 'Indian MCH · Consanguineous Unions · 3-Gen Pedigree · Hemoglobinopathy',
    tone: 'border-[#4fdbc8]/40 bg-[#4fdbc8]/10 text-[#4fdbc8]',
  },
  {
    org: 'ACOG',
    docNumber: 'ACOG Bull. 691 / ACMG Tier 3',
    title: 'Preconception Carrier Screening',
    scope: 'Pan-Ethnic CFTR, SMN1, Beta Thalassemia, Sickle Cell & Partner Testing',
    tone: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  },
  {
    org: 'ACOG',
    docNumber: 'ACOG PB 226 / SMFM 2026',
    title: 'Fetal Chromosomal Screening (NIPT)',
    scope: 'Cell-free DNA · Trisomies 21/18/13 · Fetal Fraction <4% Redraw Triage',
    tone: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
  },
  {
    org: 'ACOG',
    docNumber: 'ACOG PB 175 / ISUOG',
    title: 'Abnormal Ultrasound Findings',
    scope: 'Nuchal Translucency ≥3.5mm · Cystic Hygroma · VSD · Microarray Indications',
    tone: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  },
  {
    org: 'ASRM',
    docNumber: 'ASRM 2024 / ACOG PB 200',
    title: 'Recurrent Pregnancy Loss (RPL)',
    scope: '≥2 Spontaneous Losses · Parental Karyotyping for Balanced Translocations',
    tone: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  {
    org: 'NCCN',
    docNumber: 'ACOG No. 793 / NCCN v2.2024',
    title: 'Hereditary Cancer Syndromes',
    scope: 'BRCA1/2 · Lynch Syndrome (MLH1/MSH2) · Early-Onset Breast/Ovarian Triage',
    tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
]

export default function PublishedGuidelinesIndex({
  compact = false,
}: {
  compact?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#0e4331] bg-[#021f17] p-5 sm:p-6 shadow-hx space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#34d399] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#34d399]" />
            <span>Direct Statutory Evidence Base · Zero-Hallucination Rules</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Published Clinical Guidelines Index (FOGSI · ACOG · ACMG · ASRM · NCCN)
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            All 6 triage pathways in GenoBridge are indexed directly to published professional society guidelines. Every referral urgency level is mathematically calibrated against verified document editions with zero LLM hallucination.
          </p>
        </div>

        <Link
          href="/guidelines"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#032a1f] border border-[#0e4331] hover:border-[#10b981] text-slate-300 hover:text-white transition-all shrink-0 w-fit"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#34d399]" />
          <span>Full Governance Catalog</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {PUBLISHED_GUIDELINES.map((item) => (
          <div
            key={item.docNumber}
            className="p-3.5 rounded-xl bg-[#032a1f]/70 border border-[#0e4331] hover:border-[#10b981]/60 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${item.tone}`}>
                {item.docNumber}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">
                {item.org}
              </span>
            </div>
            <div className="text-xs font-bold text-white">
              {item.title}
            </div>
            <div className="text-[11px] text-slate-300 leading-snug">
              {item.scope}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

