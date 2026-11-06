'use client'

import React from 'react'
import {
  Stethoscope,
  HeartPulse,
  Microscope,
  FlaskConical,
} from 'lucide-react'
import DnaVisual from '@/components/auth/DnaVisual'

export function AuthVisualPanel({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-[26px] bg-[#021627] bg-gradient-to-b from-[#021627] via-[#031B2B] to-[#021d33] p-6 sm:p-7 relative flex flex-col justify-between overflow-hidden border border-[#164C60]/50 h-[480px] sm:h-[540px] lg:h-full shadow-inner shrink-0 ${className}`}
    >
      {/* =========================================================================
          1. SEAMLESS FULL-BLEED DNA BACKGROUND ILLUMINATION
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <DnaVisual />
      </div>

      {/* =========================================================================
          2. GenoBridge LOGO & BRAND HEADER
          ========================================================================= */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#06243d] border border-[#165675] flex items-center justify-center text-[#00D8C3] shadow-lg shadow-[#00D8C3]/20">
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.4" />
            <path d="M12 3v18" stroke="currentColor" />
            <path d="M3 12h18" stroke="currentColor" />
            <circle cx="12" cy="12" r="3" fill="#00D8C3" fillOpacity="0.3" stroke="#00D8C3" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center">
            GENOBRIDGE<span className="text-[#00D8C3]">Health</span>
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8aaec3]">
            Clinical Genetics Decision Support
          </p>
        </div>
      </div>

      {/* =========================================================================
          3. THE 4 CLINICAL MICRO-BADGES & FLOATING SQUIRCLE CARDS
          ========================================================================= */}
      <div className="relative z-10 flex-1 my-2 w-full pointer-events-none">
        {/* Badge 1 (Top Left): Stethoscope + OB-GYN Clinical Triage */}
        <div className="absolute top-[6%] left-[3%] sm:left-[4%] flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl bg-[#06243d]/90 border border-[#165a7c]/90 backdrop-blur-md shadow-xl shadow-cyan-950/80 transition-transform duration-200">
          <div className="w-9 h-9 rounded-xl bg-[#08304f] border border-[#00D8C3]/40 flex items-center justify-center text-[#00D8C3] shadow-inner shrink-0">
            <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D8C3]" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white leading-tight">OB-GYN Triage</div>
            <div className="text-[9px] font-semibold text-[#00D8C3] tracking-wide">ACOG Protocols</div>
          </div>
        </div>

        {/* Badge 2 (Lower Left): HeartPulse + Fetal & ANC Monitoring */}
        <div className="absolute top-[48%] left-[3%] sm:left-[4%] flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl bg-[#06243d]/90 border border-[#165a7c]/90 backdrop-blur-md shadow-xl shadow-cyan-950/80 transition-transform duration-200">
          <div className="w-9 h-9 rounded-xl bg-[#08304f] border border-[#00D8C3]/40 flex items-center justify-center text-[#00D8C3] shadow-inner shrink-0">
            <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D8C3]" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white leading-tight">Fetal &amp; ANC Care</div>
            <div className="text-[9px] font-semibold text-[#00D8C3] tracking-wide">Routine Surveillance</div>
          </div>
        </div>

        {/* Badge 3 (Middle Right): Microscope + Genomic Variant Analysis */}
        <div className="absolute top-[36%] right-[3%] sm:right-[4%] flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl bg-[#06243d]/90 border border-[#165a7c]/90 backdrop-blur-md shadow-xl shadow-cyan-950/80 transition-transform duration-200">
          <div className="w-9 h-9 rounded-xl bg-[#08304f] border border-[#00D8C3]/40 flex items-center justify-center text-[#00D8C3] shadow-inner shrink-0">
            <Microscope className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D8C3]" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white leading-tight">Genomic Analysis</div>
            <div className="text-[9px] font-semibold text-[#00D8C3] tracking-wide">ACMG Variant Triage</div>
          </div>
        </div>

        {/* Badge 4 (Bottom Right): FlaskConical + Biochemical & NIPT Markers */}
        <div className="absolute bottom-[8%] right-[3%] sm:right-[4%] flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl bg-[#06243d]/90 border border-[#165a7c]/90 backdrop-blur-md shadow-xl shadow-cyan-950/80 transition-transform duration-200">
          <div className="w-9 h-9 rounded-xl bg-[#08304f] border border-[#00D8C3]/40 flex items-center justify-center text-[#00D8C3] shadow-inner shrink-0">
            <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D8C3]" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white leading-tight">Biochemical Lab</div>
            <div className="text-[9px] font-semibold text-[#00D8C3] tracking-wide">NIPT &amp; Quad Screen</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM BRANDING
          ========================================================================= */}
      <div className="relative z-10 border-t border-white/10 pt-4 flex items-center justify-between text-xs text-slate-400">
        <p className="text-slate-400 text-xs">
          Clinical Genetics Decision Support
        </p>
        <span className="font-mono text-[11px] text-[#00D8C3]">v2.4 Core</span>
      </div>
    </aside>
  )
}

export default AuthVisualPanel
