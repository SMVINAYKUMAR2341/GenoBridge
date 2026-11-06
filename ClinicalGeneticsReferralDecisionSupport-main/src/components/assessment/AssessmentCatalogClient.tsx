'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  ArrowRight,
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
      {/* Histone Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-mono tracking-[0.22em] uppercase font-bold text-[#b8125d] mb-2">
            NEW ASSESSMENT
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl tracking-tight text-slate-900">
            Which clinical scenario applies?
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
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
              className="h-10 w-[220px] appearance-none rounded-md border border-slate-200 bg-white pr-9 pl-3.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-[#b8125d] shadow-xs"
            >
              {PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
            />
          </div>

          <Link
            href="/pedigree"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add patient</span>
          </Link>
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
