'use client'

import React from 'react'
import type { NIPTClinicalIntake, SoftMarkerProfile } from '@/types/nipt'

export const SOFT_MARKER_OPTIONS: Array<{ key: keyof SoftMarkerProfile; label: string; association?: string }> = [
  { key: 'nuchalFoldThickened', label: 'Nuchal fold thickened (≥6mm at 15–21w)', association: 'T21' },
  { key: 'echogenicBowel', label: 'Echogenic bowel', association: 'T21 / T18' },
  { key: 'shortFemur', label: 'Short femur (<0.91 FL/BPD ratio)', association: 'T21' },
  { key: 'shortHumerus', label: 'Short humerus', association: 'T21' },
  { key: 'echogenicIntracardiacFocus', label: 'Echogenic intracardiac focus (EIF)', association: 'T21' },
  { key: 'choroidPlexusCysts', label: 'Choroid plexus cysts (CPC)', association: 'T18' },
  { key: 'renal_pyelectasis', label: 'Renal pyelectasis (mild hydronephrosis)', association: 'T21' },
  { key: 'ventriculomegaly', label: 'Ventriculomegaly', association: 'T21 / T18' },
  { key: 'aberrantRightSubclavianArtery', label: 'Aberrant right subclavian artery (ARSA)', association: 'T21' },
  { key: 'sandwichSign', label: 'Sandwich sign', association: 'T18' },
  { key: 'clubfoot', label: 'Clubfoot / rocker-bottom foot', association: 'T18 / T13' },
]

export interface ClinicalIntakeFormProps {
  intake: NIPTClinicalIntake
  setIntake: React.Dispatch<React.SetStateAction<NIPTClinicalIntake>>
  onSubmit?: () => void
  disabled?: boolean
}

export function ClinicalIntakeForm({
  intake,
  setIntake,
  onSubmit,
  disabled = false,
}: ClinicalIntakeFormProps) {
  return (
    <div className="space-y-6 text-slate-900">
      {/* Gestational Age */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
          <span>Gestational Age (completed weeks)</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            min={6}
            max={42}
            placeholder="Weeks"
            disabled={disabled}
            value={intake.gestationalAgeWeeks || ''}
            onChange={(e) =>
              setIntake({ ...intake, gestationalAgeWeeks: Math.max(0, parseInt(e.target.value, 10) || 0) })
            }
            className="w-28 h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:border-slate-900 shadow-xs"
            required
          />
          <span className="text-xs text-slate-500 font-medium">completed weeks</span>
          {intake.gestationalAgeWeeks >= 22 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold">
              ⚠ GA ≥ 22w — decision window narrowing
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Critical for urgency stratification. CVS window: 10–14w. Amniocentesis window: 15–20w.
        </p>
      </div>

      {/* Maternal Age */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
          <span>Maternal Age (years)</span>
          <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          min={15}
          max={55}
          placeholder="Age in years"
          disabled={disabled}
          value={intake.maternalAge || ''}
          onChange={(e) =>
            setIntake({ ...intake, maternalAge: Math.max(0, parseInt(e.target.value, 10) || 0) })
          }
          className="w-36 h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:border-slate-900 shadow-xs"
          required
        />
        <p className="text-[11px] text-slate-500">Required for pre-test probability context per ACMG 2023.</p>
      </div>

      {/* Fetal Fraction */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
          <span>Fetal Fraction (%)</span>
          <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          min={1}
          max={50}
          step="0.1"
          placeholder="e.g. 23"
          disabled={disabled}
          value={intake.fetalFraction || ''}
          onChange={(e) =>
            setIntake({ ...intake, fetalFraction: parseFloat(e.target.value) || 0 })
          }
          className="w-36 h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:border-slate-900 shadow-xs"
        />
        <p className="text-[11px] text-slate-500">
          cfDNA validity threshold: ≥ 4.0%. Low FF (&lt; 4%) indicates redraw or diagnostic offer.
        </p>
      </div>

      {/* Ultrasound Soft Markers */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 block">Ultrasound Soft Markers</label>
        <p className="text-[11px] text-slate-500">
          Select all identified on current ultrasound. Leave blank if none present.
        </p>

        <div className="grid sm:grid-cols-2 gap-2 pt-1">
          {SOFT_MARKER_OPTIONS.map((marker) => (
            <label
              key={marker.key}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                intake.softMarkers?.[marker.key]
                  ? 'border-slate-900 bg-slate-50 font-semibold'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={Boolean(intake.softMarkers?.[marker.key])}
                onChange={(e) =>
                  setIntake({
                    ...intake,
                    softMarkers: {
                      ...intake.softMarkers,
                      [marker.key]: e.target.checked,
                      nonePresent: false,
                    },
                  })
                }
                className="mt-0.5 rounded accent-slate-900"
              />
              <div className="flex-1">
                <div>{marker.label}</div>
                {marker.association && (
                  <span className="text-[10px] font-mono font-bold text-slate-500 block mt-0.5">
                    {marker.association}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Explicit "none" confirmation */}
        <label
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition mt-2 ${
            intake.softMarkers?.nonePresent
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={Boolean(intake.softMarkers?.nonePresent)}
            onChange={(e) => {
              if (e.target.checked) {
                setIntake({
                  ...intake,
                  softMarkers: { nonePresent: true },
                })
              } else {
                setIntake({
                  ...intake,
                  softMarkers: { ...intake.softMarkers, nonePresent: false },
                })
              }
            }}
            className="rounded accent-emerald-600"
          />
          <span>No soft markers identified on detailed anatomic ultrasound</span>
        </label>
      </div>

      {/* Structural Anomaly Toggle */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            disabled={disabled}
            checked={Boolean(intake.ultrasoundFindings?.majorStructuralAnomaly)}
            onChange={(e) =>
              setIntake({
                ...intake,
                ultrasoundFindings: {
                  ...intake.ultrasoundFindings,
                  majorStructuralAnomaly: e.target.checked,
                },
              })
            }
            className="rounded accent-slate-900"
          />
          <span>Major structural anomaly identified on ultrasound</span>
        </label>
        {intake.ultrasoundFindings?.majorStructuralAnomaly && (
          <input
            type="text"
            disabled={disabled}
            placeholder="Brief anatomical description (e.g. cardiac AVSD, omphalocele, holoprosencephaly)"
            value={intake.ultrasoundFindings?.anomalyDescription || ''}
            onChange={(e) =>
              setIntake({
                ...intake,
                ultrasoundFindings: {
                  ...intake.ultrasoundFindings,
                  majorStructuralAnomaly: true,
                  anomalyDescription: e.target.value,
                },
              })
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-900 shadow-xs mt-1.5"
          />
        )}
      </div>

      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          Evaluate Referral Urgency →
        </button>
      )}
    </div>
  )
}
