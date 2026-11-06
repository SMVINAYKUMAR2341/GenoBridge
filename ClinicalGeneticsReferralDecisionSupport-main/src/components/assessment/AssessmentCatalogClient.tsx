'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  ShieldCheck,
  Zap,
  BookOpen,
  Users,
} from 'lucide-react'
import PathwayCard from '@/components/ui/PathwayCard'
import { PATHWAYS } from '@/data/pathways'
import { PATIENTS } from '@/data/content'
import { useAssessments } from '@/components/providers/AssessmentsProvider'

export function AssessmentCatalogClient() {
  const { patientId, setPatientId } = useAssessments()
  const [view, setView] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-8">
      {/* Histone Parity Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-[#164C60]/50">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#00D8C3] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D8C3] animate-pulse" />
            <span>New assessment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Which clinical scenario applies?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#A9BDCA] max-w-2xl leading-relaxed">
            Pick the pathway that matches this patient&apos;s presentation. Every result is linked to its source guideline and takes under two minutes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Patient Selector */}
          <div className="relative">
            <select
              aria-label="Select simulated patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-10 w-[240px] appearance-none rounded-xl border border-[#164C60] bg-[#08243B] pr-10 pl-4 text-xs font-semibold text-white transition outline-none hover:border-[#00D8C3] focus:border-[#00D8C3]"
            >
              {PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#00D8C3]"
            />
          </div>

          <Link
            href="/anc/register"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] shadow-md shadow-[#00D8C3]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add patient</span>
          </Link>
        </div>
      </div>

      {/* Sub-bar with Layout Controls and Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8aaec3]">
          <span className="px-2.5 py-0.5 rounded-full bg-[#08243B] border border-[#164C60] text-white">
            {PATHWAYS.length} Clinical Pathways
          </span>
          <span className="hidden sm:inline">· FOGSI / ACOG / ACMG / ASRM Aligned</span>
        </div>

        <div
          role="group"
          aria-label="Pathway layout"
          className="flex items-center gap-1 rounded-xl border border-[#164C60] bg-[#031525] p-1"
        >
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
            className={`flex h-7 w-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
              view === 'grid'
                ? 'bg-[#00D8C3] text-[#031525]'
                : 'text-[#8aaec3] hover:text-white'
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
            className={`flex h-7 w-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
              view === 'list'
                ? 'bg-[#00D8C3] text-[#031525]'
                : 'text-[#8aaec3] hover:text-white'
            }`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Pathways Grid */}
      <div
        className={
          view === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'grid grid-cols-1 gap-3.5'
        }
      >
        {PATHWAYS.map((p, i) => (
          <PathwayCard key={p.slug} pathway={p} index={i} layout={view} />
        ))}
      </div>
    </div>
  )
}
export default AssessmentCatalogClient
