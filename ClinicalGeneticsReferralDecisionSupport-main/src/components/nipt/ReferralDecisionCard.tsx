'use client'

import React from 'react'
import type { ReferralDecision, ReferralUrgencyTier, TierDisplayConfig } from '@/types/referral'
import { TIER_DISPLAY } from '@/types/referral'

export interface ReferralDecisionCardProps {
  decision: ReferralDecision
  onPrint?: () => void
  onExportFhir?: () => void
}

export function ReferralDecisionCard({
  decision,
  onPrint,
  onExportFhir,
}: ReferralDecisionCardProps) {
  const tierConfig: TierDisplayConfig = TIER_DISPLAY[decision.tier] || {
    label: decision.timeframeLabel || 'Referral Evaluation',
    sublabel: decision.timeframeHours || 'Review indicated',
    color: 'bg-slate-700',
    badge: decision.tier,
    icon: 'ℹ️',
    isUrgent: decision.isUrgent,
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs space-y-4">
      {/* Dynamic Urgency Banner */}
      <div className={`p-6 sm:p-7 text-white ${tierConfig.color}`}>
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] opacity-90 mb-2">
          <span>CLINICAL REFERRAL DECISION — DOCTOR REVIEW REQUIRED</span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] backdrop-blur-xs">
            {tierConfig.badge}
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <span className="text-2xl">{tierConfig.icon}</span>
          <span>{tierConfig.label}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium">
          <div>
            <span className="opacity-80">Referral Target: </span>
            <span className="font-bold underline underline-offset-2">
              {decision.referralTarget.join(' + ')}
            </span>
          </div>
          <div>
            <span className="opacity-80">Recommended Timeframe: </span>
            <span className="font-bold">{decision.timeframeHours}</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-5">
        {/* Triggering Criteria Met */}
        {decision.triggeringCriteria && decision.triggeringCriteria.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700">
              Triggering Guideline Criteria Met ({decision.triggeringCriteria.length})
            </h4>
            <div className="space-y-2">
              {decision.triggeringCriteria.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>• {c.criterion}</span>
                    {c.urgency && (
                      <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] uppercase font-mono">
                        {c.urgency}
                      </span>
                    )}
                  </div>
                  {c.note && <p className="text-slate-600">{c.note}</p>}
                  {c.action && <p className="text-slate-700 font-medium">Action: {c.action}</p>}
                  {c.citation && (
                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      Citation: {c.citation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counterfactual Sensitivity Analysis */}
        {decision.counterfactuals && decision.counterfactuals.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700">
              What Would Change This (Counterfactual Analysis)
            </h4>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {decision.counterfactuals.map((cf, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5"
                >
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    FACTOR: {cf.factor}
                  </div>
                  <div className="text-slate-700">
                    <span className="font-semibold">Currently:</span> {cf.current}
                  </div>
                  <div className="text-slate-900">
                    <span className="font-semibold">Alternative:</span> {cf.alternative}
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      Resulting Tier:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-[10px] text-slate-800">
                      {cf.resulting_tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{cf.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
          {onExportFhir && (
            <button
              type="button"
              onClick={onExportFhir}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Export HL7 FHIR
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Download PDF Report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
