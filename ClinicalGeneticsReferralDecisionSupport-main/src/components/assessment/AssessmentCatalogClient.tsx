'use client'
import { useState } from 'react'
import {
  ChevronDown,
  Layers,
  LayoutGrid,
  List,
  Lock,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { HeroArt } from '@/components/ui/Graphics'
import PathwayCard from '@/components/ui/PathwayCard'
import { PATHWAYS } from '@/data/pathways'
import { PATIENTS } from '@/data/content'
import { useAssessments } from '@/components/providers/AssessmentsProvider'

const HIGHLIGHTS: [LucideIcon, string][] = [
  [ShieldCheck, 'Evidence-informed'],
  [Layers, 'Guideline aligned'],
  [Zap, 'Under 2 minutes'],
]
const VIEWS: ['grid' | 'list', LucideIcon, string][] = [
  ['grid', LayoutGrid, 'Grid view'],
  ['list', List, 'List view'],
]

export function AssessmentCatalogClient() {
  const { patientId, setPatientId } = useAssessments()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  return (
    <>
      <section className="hx-bleed relative isolate -mt-8 overflow-hidden pt-[30px] pb-[14px]">
        <div aria-hidden className="hx-hero-surface absolute inset-0 -z-10" />
        <HeroArt className="pointer-events-none absolute top-0 right-0 -z-10 hidden h-[300px] w-[min(820px,60%)] md:block" />
        <p className="text-[11.5px] font-semibold tracking-[0.3em] text-hx-ink uppercase">
          Point-of-care decision support
        </p>
        <h1 className="mt-[13px] text-[44px] leading-[1.06] font-extrabold tracking-[-0.025em] text-slate-900 sm:text-[52px]">
          New <span className="text-slate-900">Assessment</span>
        </h1>
        <p className="mt-3 text-[17px] text-slate-600">
          A clear next step, for every patient. Start with a clinical pathway.
        </p>
        <ul className="mt-[22px] flex flex-wrap gap-x-[21px] gap-y-3">
          {HIGHLIGHTS.map(([Icon, label]) => (
            <li
              key={label}
              className="flex h-[39px] items-center gap-[11px] rounded-xl border border-slate-200 bg-white pr-[19px] pl-[21px] text-[13px] font-semibold text-slate-800 shadow-xs backdrop-blur"
            >
              <Icon size={19} strokeWidth={1.8} className="text-slate-900" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section
        className="flex flex-wrap items-center justify-between gap-4 py-[14px] pr-[25px] pl-[28px] rounded-[14px] border border-slate-200 bg-white shadow-xs text-slate-900"
      >
        <div className="flex items-center gap-[22px]">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 border border-slate-200">
            <Users size={22} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Active Clinical Encounter</p>
            <p className="mt-0.5 text-[13px] text-slate-500">Point-of-care genetics triage & referral session</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-y-3">
          <div className="relative">
            <select
              aria-label="Select patient record"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-11 w-[320px] max-w-full appearance-none rounded-xl border border-slate-300 bg-white pr-10 pl-7 text-[14px] font-medium text-slate-900 transition outline-none hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 shadow-xs"
            >
              <option value="PT-001">Jane Doe · MRN-94821 (31yo, G2P1)</option>
              <option value="PT-002">Aisha Patel · MRN-83719 (29yo, G1P0)</option>
              <option value="PT-003">Sarah Connor · MRN-62104 (35yo, G3P2)</option>
              <option value="PT-004">Priyanka Sharma · MRN-51928 (33yo, G1P0)</option>
              <option value="PT-NEW">+ New Walk-in / OPD Referral</option>
            </select>
            <ChevronDown
              size={17}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-slate-500"
            />
          </div>
          <span aria-hidden className="mx-[21px] h-7 w-px bg-slate-200" />
          <span
            title="EHR Verified Session Active"
            className="flex items-center gap-[9px] text-[14px] font-bold text-slate-900"
          >
            <ShieldCheck size={18} strokeWidth={1.9} />
            Verified Clinical Session
          </span>
        </div>
      </section>

      <div className="mt-6 mb-2.5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[22px] font-bold tracking-[-0.01em] text-slate-900">
          Select a clinical pathway
        </h2>
        <div className="flex items-center gap-9">
          <div
            role="group"
            aria-label="Pathway layout"
            className="flex h-[43px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-xs"
          >
            {VIEWS.map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`flex h-[33px] w-[51px] items-center justify-center rounded-[9px] transition ${view === value ? 'bg-white text-slate-900 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Icon size={19} strokeWidth={1.8} />
              </button>
            ))}
          </div>
          <span className="text-[14px] text-slate-600">{PATHWAYS.length} pathways</span>
        </div>
      </div>
      <div
        className={
          view === 'grid' ? 'grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-3'
        }
      >
        {PATHWAYS.map((p, i) => (
          <PathwayCard key={p.slug} pathway={p} index={i} layout={view} />
        ))}
      </div>
    </>
  )
}

