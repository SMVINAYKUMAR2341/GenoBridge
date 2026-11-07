'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Dna,
  Users,
  Baby,
  Activity,
  GitFork,
  BookOpen,
  Clock,
  Sparkles,
} from 'lucide-react'
import { FamilyTree, UltrasoundScan } from '@/components/ui/Icons'

export interface PathwayScenario {
  id: string
  slug: string
  title: string
  shortCode: string
  description: string
  guidelines: string
  timeToComplete: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  badgeTone: string
}

export const PATHWAY_SCENARIOS: PathwayScenario[] = [
  {
    id: 'hereditary_cancer',
    slug: 'hereditary-cancer-risk',
    title: 'Hereditary Cancer Risk',
    shortCode: 'ONCO-01',
    description: 'BRCA1/2, Lynch syndrome (MLH1/MSH2/MSH6), and multi-gene panels for breast, ovarian, colorectal, and endometrial malignancies.',
    guidelines: 'ACOG No. 793 · NCCN v2.2024',
    timeToComplete: '< 2 mins',
    icon: Dna,
    badgeTone: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  },
  {
    id: 'carrier_screening',
    slug: 'preconception-carrier-screening',
    title: 'Preconception Carrier Screening',
    shortCode: 'CARR-02',
    description: 'Expanded carrier panels for Cystic Fibrosis, Spinal Muscular Atrophy, Beta Thalassemia, Sickle Cell, and Fragile X premutations.',
    guidelines: 'ACOG No. 691 · ACMG Tier 3 · FOGSI GCPR',
    timeToComplete: '< 2 mins',
    icon: Users,
    badgeTone: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  },
  {
    id: 'nipt_results',
    slug: 'nipt-results',
    title: 'NIPT Results & Aneuploidy Triage',
    shortCode: 'PREN-03',
    description: 'Cell-free fetal DNA screening for Trisomies 21, 18, 13, sex-chromosome aneuploidies, 22q11.2 microdeletions, or low fetal fraction.',
    guidelines: 'ACOG PB 226 · SMFM Consensus · FOGSI',
    timeToComplete: '< 1 min',
    icon: Baby,
    badgeTone: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
  },
  {
    id: 'abnormal_ultrasound',
    slug: 'abnormal-ultrasound-findings',
    title: 'Abnormal Fetal Ultrasound',
    shortCode: 'SCAN-04',
    description: 'Increased nuchal translucency (NT ≥ 3.5mm), fetal structural anomalies, hydrops, echogenic bowel, or choroid plexus cysts.',
    guidelines: 'ACOG PB 175 · ISUOG NT · ACMG CMA',
    timeToComplete: '< 2 mins',
    icon: UltrasoundScan,
    badgeTone: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  },
  {
    id: 'infertility_rpl',
    slug: 'infertility-recurrent-pregnancy-loss',
    title: 'Infertility & Recurrent Loss (RPL)',
    shortCode: 'REPR-05',
    description: 'Two or more clinical pregnancy losses, parental balanced reciprocal/Robertsonian translocations, or unexplained severe infertility.',
    guidelines: 'ASRM 2024 Guideline · ACOG PB 200',
    timeToComplete: '< 2 mins',
    icon: Activity,
    badgeTone: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  },
  {
    id: 'family_history',
    slug: 'positive-family-history',
    title: 'Multigenerational Family Pedigree',
    shortCode: 'LINE-06',
    description: 'Strong first- and second-degree pedigree patterns of hereditary genetic disorders, early onset cardiomyopathy, or consanguinity.',
    guidelines: 'FOGSI GCPR · ACMG Pedigree Standards',
    timeToComplete: '< 3 mins',
    icon: FamilyTree,
    badgeTone: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  },
]

export default function PathwayScenarioHub({
  title = 'Clinical Decision Support Pathways',
  subtitle = 'Select the clinical scenario that matches this patient. Every rule is linked to evidence-based guideline citations.',
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-900 font-bold">
            Evidence-Based Triage
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
            {subtitle}
          </p>
        </div>

        <Link
          href="/pedigree"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 border border-slate-300 hover:border-slate-900 hover:text-slate-950 transition-all self-start sm:self-auto shrink-0 shadow-xs"
        >
          <GitFork className="w-3.5 h-3.5 text-slate-900" />
          <span>Open Pedigree Studio</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PATHWAY_SCENARIOS.map((p) => {
          const IconComponent = p.icon
          return (
            <Link
              key={p.id}
              href={`/assessment/${p.slug}`}
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-slate-900"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${p.badgeTone}`}>
                    {p.shortCode}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                    {p.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                  <span>{p.guidelines}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-900 group-hover:translate-x-1 transition-transform">
                  <span>Start</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

