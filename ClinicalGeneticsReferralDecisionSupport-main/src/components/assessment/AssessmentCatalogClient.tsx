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
import { PreviewBanner } from '@/components/ui/Primitives'
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
        <h1 className="mt-[13px] text-[44px] leading-[1.06] font-extrabold tracking-[-0.025em] text-white sm:text-[52px]">
          New <span className="text-[#34d399]">Assessment</span>
        </h1>
        <p className="mt-3 text-[17px] text-slate-300">
          A clear next step, for every patient. Start with a clinical pathway.
        </p>
        <ul className="mt-[22px] flex flex-wrap gap-x-[21px] gap-y-3">
          {HIGHLIGHTS.map(([Icon, label]) => (
            <li
              key={label}
              className="flex h-[39px] items-center gap-[11px] rounded-xl border border-[#0e4331] bg-[#021f17]/90 pr-[19px] pl-[21px] text-[13px] font-semibold text-white shadow-sm backdrop-blur"
            >
              <Icon size={19} strokeWidth={1.8} className="text-[#34d399]" />
              {label}
            </li>
          ))}
        </ul>
        <PreviewBanner className="mt-5" />
      </section>

      <section
        className="flex flex-wrap items-center justify-between gap-4 py-[11px] pr-[25px] pl-[28px] rounded-[14px] border border-[#0e4331] bg-[#021f17] shadow-hx text-white"
      >
        <div className="flex items-center gap-[22px]">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#033424] text-[#34d399] border border-[#0e5c3e]">
            <Users size={22} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-white">Patient context</p>
            <p className="mt-0.5 text-[13px] text-slate-300">Simulated assessment · no patient data</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-y-3">
          <div className="relative">
            <select
              aria-label="Select simulated patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-11 w-[284px] max-w-full appearance-none rounded-xl border border-[#0e4331] bg-[#032a1f] pr-10 pl-7 text-[14px] font-medium text-white transition outline-none hover:border-[#10b981] focus:border-[#00e5ce] focus:ring-4 focus:ring-[#00e5ce]/20 [&>option]:bg-[#032a1f] [&>option]:text-white"
            >
              {PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={17}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[#00e5ce]"
            />
          </div>
          <span aria-hidden className="mx-[21px] h-7 w-px bg-[#0e4331]" />
          <span
            title="Real patient access is disabled in this preview"
            className="flex items-center gap-[9px] text-[14px] font-bold text-[#34d399]"
          >
            <Lock size={18} strokeWidth={1.9} />
            Patient access
          </span>
        </div>
      </section>

      <div className="mt-6 mb-2.5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[22px] font-bold tracking-[-0.01em] text-white">
          Select a clinical pathway
        </h2>
        <div className="flex items-center gap-9">
          <div
            role="group"
            aria-label="Pathway layout"
            className="flex h-[43px] items-center gap-1 rounded-xl border border-[#0e4331] bg-[#021f17] p-1 shadow-sm"
          >
            {VIEWS.map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`flex h-[33px] w-[51px] items-center justify-center rounded-[9px] transition ${view === value ? 'bg-[#033424] text-[#34d399] border border-[#0e5c3e]' : 'text-slate-300 hover:bg-[#032a1f] hover:text-white'}`}
              >
                <Icon size={19} strokeWidth={1.8} />
              </button>
            ))}
          </div>
          <span className="text-[14px] text-slate-300">{PATHWAYS.length} pathways</span>
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

