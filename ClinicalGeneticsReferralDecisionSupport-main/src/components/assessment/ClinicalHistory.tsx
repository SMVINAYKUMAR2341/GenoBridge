'use client'

import React from 'react'
import {
  type InputField,
  visibleIntakeFields,
} from '@/lib/form-fields'
import type { WorkflowIntake } from '@/lib/workflow-store'

export function ClinicalHistory({
  slug,
  inputs,
  intake,
  syntheticReference,
  errors,
  onInput,
  onIntake,
  onReference,
}: {
  slug: string
  inputs: Record<string, any>
  intake: WorkflowIntake
  syntheticReference: string
  errors: Record<string, string>
  onInput: (key: string, value: any) => void
  onIntake: (value: WorkflowIntake) => void
  onReference: (value: string) => void
}) {
  const fields = visibleIntakeFields(slug, inputs)

  return (
    <div className="space-y-6 text-white">
      {/* Guidance Note */}
      <div className="rounded-xl border border-[#0e5c3e] bg-[#033424] p-4 text-xs text-[#a7f3d0] flex items-center justify-between shadow-xs">
        <span className="font-medium">
          Fill in only what applies. Fields left blank are treated as negative / not present.
        </span>
        <span className="font-mono text-[11px] text-[#34d399] font-bold tracking-wider">
          POINT-OF-CARE OPD
        </span>
      </div>

      {/* Main Intake Form Fields */}
      <div className="space-y-3.5">
        {fields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={inputs[field.key]}
            error={errors[`assessmentInputs.${field.key}`] ?? errors[field.key]}
            onChange={(val) => onInput(field.key, val)}
          />
        ))}
      </div>
    </div>
  )
}

function SwitchToggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#10b981] ${
        checked ? 'bg-[#10b981]' : 'bg-[#0b291e] border border-[#0e4331]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: InputField
  value: any
  error?: string
  onChange: (val: any) => void
}) {
  const id = `f-${field.key}`

  // Boolean Toggle
  if (field.type === 'bool' || field.type === 'checkbox') {
    const isChecked = Boolean(value === true || value === 'true')
    return (
      <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-[#0e4331] bg-[#021f17] hover:border-[#10b981]/50 transition-colors">
        <label htmlFor={id} className="text-sm font-medium text-white cursor-pointer select-none max-w-[80%]">
          {field.label}
          {field.hint && <span className="block text-xs text-slate-300 font-normal mt-0.5">{field.hint}</span>}
        </label>
        <SwitchToggle id={id} checked={isChecked} onChange={onChange} />
      </div>
    )
  }

  // Multi-Select Checkboxes (Ancestries, Soft Markers)
  if (field.type === 'multi') {
    const currentList: string[] = Array.isArray(value)
      ? value
      : typeof value === 'string' && value.trim()
        ? value.split(',').map((s) => s.trim())
        : []

    const toggleOption = (optVal: string) => {
      if (currentList.includes(optVal)) {
        onChange(currentList.filter((item) => item !== optVal))
      } else {
        onChange([...currentList, optVal])
      }
    }

    return (
      <div className="space-y-2 pt-2">
        <label className="block text-sm font-semibold text-white">
          {field.label}
          {field.hint && <span className="block text-xs text-slate-300 font-normal">{field.hint}</span>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {field.options?.map(([optVal, optLabel]) => {
            const isSelected = currentList.includes(optVal)
            return (
              <label
                key={optVal}
                onClick={() => toggleOption(optVal)}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 cursor-pointer text-xs font-semibold transition-all select-none ${
                  isSelected
                    ? 'border-[#10b981] bg-[#033424] text-[#a7f3d0] shadow-sm'
                    : 'border-[#0e4331] bg-[#021f17] text-slate-200 hover:border-[#10b981]/40 hover:bg-[#03261c]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#10b981] bg-[#10b981]' : 'border-[#0e5c3e] bg-[#032a1f]'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L4.8 8.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span>{optLabel}</span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // Number input
  if (field.type === 'number') {
    return (
      <div className="space-y-1.5 py-1">
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="text-sm font-semibold text-white">
            {field.label}
          </label>
          {field.hint && <span className="text-xs text-slate-300">{field.hint}</span>}
        </div>
        <input
          id={id}
          type="number"
          step={field.step || 1}
          min={field.min ?? 0}
          value={value ?? ''}
          placeholder="0"
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-11 px-3.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white placeholder-slate-400 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 text-sm"
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // Select dropdown
  if (field.type === 'select') {
    return (
      <div className="space-y-1.5 py-1">
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="text-sm font-semibold text-white">
            {field.label}
          </label>
          {field.hint && <span className="text-xs text-slate-300">{field.hint}</span>}
        </div>
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 text-sm [&>option]:bg-[#032a1f] [&>option]:text-white"
        >
          <option value="">Select option...</option>
          {field.options?.map(([optVal, optLabel]) => (
            <option key={optVal} value={optVal}>
              {optLabel}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // Text / Textarea
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-semibold text-white">
          {field.label}
        </label>
        {field.hint && <span className="text-xs text-slate-300">{field.hint}</span>}
      </div>
      {field.type === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white placeholder-slate-400 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 text-sm"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-white placeholder-slate-400 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 text-sm"
        />
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
