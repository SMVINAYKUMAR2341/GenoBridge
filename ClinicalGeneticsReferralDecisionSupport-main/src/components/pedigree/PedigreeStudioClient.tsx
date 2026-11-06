'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  GitFork,
  ArrowLeft,
  Sparkles,
  Download,
  Info,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { PedigreeEditor } from '@/components/clinical/PedigreeEditor'
import { createDemoPedigree, createEmptyPedigree, type PedigreeModel } from '@/components/clinical/pedigree-model'

export default function PedigreeStudioClient({
  userName,
  userRole,
}: {
  userName: string
  userRole: string
}) {
  const [pedigree, setPedigree] = useState<PedigreeModel>(() => createDemoPedigree())

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#08243B] via-[#041e33] to-[#08243B] border border-[#164C60] shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D8C3]/15 border border-[#00D8C3]/30 text-[#00D8C3] text-xs font-semibold">
            <GitFork className="w-3.5 h-3.5" />
            <span>MULTIGENERATIONAL PEDIGREE STUDIO · LIVE SVG CANVAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Family Pedigree &amp; Lineage Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#A9BDCA] max-w-2xl">
            Interactive 3-generation medical pedigree visualizer. Standard clinical genetics symbols (squares for males, circles for females, diagonal slashes for deceased, filled condition indicators, proband marker).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPedigree(createDemoPedigree())}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#102B43] text-white border border-[#164C60] hover:bg-[#164C60] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00D8C3]" />
            <span>Load Demo Family</span>
          </button>
          <button
            type="button"
            onClick={() => setPedigree(createEmptyPedigree())}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#031525] text-white border border-[#164C60] hover:bg-[#102B43] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#22C9EE]" />
            <span>Clear / Start Blank</span>
          </button>
        </div>
      </div>

      {/* Clinical Guidance Notice & Statutory Index */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#08243B]/60 border border-[#164C60] flex items-start gap-3 text-xs text-[#A9BDCA]">
          <Info className="w-4 h-4 text-[#00D8C3] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Clinical Pedigree Guidance:</strong> Document confirmed diagnoses with age-at-diagnosis whenever available. First-degree relatives (parents, full siblings, children) carry 50% shared genetics; second-degree relatives (grandparents, aunts, uncles) carry 25%.
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#08243B]/60 border border-[#164C60] flex items-start gap-3 text-xs text-[#A9BDCA]">
          <ShieldCheck className="w-4 h-4 text-[#4fdbc8] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Statutory Standard:</strong> Calibrated against <span className="text-[#00D8C3] font-semibold">ACMG &amp; FOGSI GCPR 2024</span> clinical pedigree guidelines. Double partner lines signify consanguineous marriages; proband arrow indicates consultand.
          </div>
        </div>
      </div>

      {/* The Full Interactive Pedigree Visualizer & Member Editor */}
      <div className="rounded-2xl border border-[#164C60]/70 bg-[#021627]/90 p-4 sm:p-6 shadow-2xl">
        <PedigreeEditor value={pedigree} onChange={setPedigree} />
      </div>
    </div>
  )
}

