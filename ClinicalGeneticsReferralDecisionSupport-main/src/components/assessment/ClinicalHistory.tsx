'use client'

import React from 'react'
import { visibleIntakeFields, type InputField } from '@/lib/form-fields'
import type { PathwaySlug, StructuredFormState } from '@/lib/decision-engine'
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
  slug: PathwaySlug
  inputs: StructuredFormState
  intake: WorkflowIntake
  syntheticReference: string
  errors: Record<string, string>
  onInput: (key: string, value: any) => void
  onIntake: (value: WorkflowIntake) => void
  onReference: (value: string) => void
}) {
  const fields = visibleIntakeFields(slug, inputs)

  return (
    <div className="space-y-6">
      {/* OPD Guidance Note */}
      <div className="rounded-xl border border-[#164C60]/70 bg-[#08243B]/60 p-4 text-xs text-[#A9BDCA] flex items-center justify-between">
        <span>Fill in only what applies. Fields left blank are treated as negative / not present.</span>
        <span className="font-mono text-[11px] text-[#00D8C3] font-semibold">2-MIN OPD INTAKE</span>
      </div>

      {/* Main Intake Form Fields matching Histone */}
      <div className="space-y-4">
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00D8C3] focus:ring-offset-2 focus:ring-offset-[#031525] ${
        checked ? 'bg-[#00D8C3]' : 'bg-[#164C60]/80 hover:bg-[#164C60]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
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
      <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-[#164C60]/50 bg-[#08243B]/40 hover:border-[#00D8C3]/40 transition-colors">
        <label htmlFor={id} className="text-sm font-medium text-white cursor-pointer select-none max-w-[80%]">
          {field.label}
          {field.hint && <span className="block text-xs text-[#A9BDCA] font-normal mt-0.5">{field.hint}</span>}
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
          {field.hint && <span className="block text-xs text-[#A9BDCA] font-normal">{field.hint}</span>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {field.options?.map(([optVal, optLabel]) => {
            const isSelected = currentList.includes(optVal)
            return (
              <label
                key={optVal}
                onClick={() => toggleOption(optVal)}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer text-sm transition-all select-none ${
                  isSelected
                    ? 'border-[#00D8C3] bg-[#00D8C3]/10 text-white font-medium shadow-sm shadow-[#00D8C3]/20'
                    : 'border-[#164C60]/60 bg-[#08243B]/40 text-[#A9BDCA] hover:border-[#164C60] hover:text-white'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#00D8C3] bg-[#00D8C3]' : 'border-[#164C60] bg-transparent'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-[#031525]" viewBox="0 0 12 12" fill="none">
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
          {field.hint && <span className="text-xs text-[#A9BDCA]">{field.hint}</span>}
        </div>
        <input
          id={id}
          type="number"
          step={field.step || 1}
          min={field.min ?? 0}
          value={value ?? ''}
          placeholder="0"
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-11 px-3.5 rounded-xl border border-[#164C60]/70 bg-[#08243B]/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00D8C3] focus:border-transparent transition-all text-sm"
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
          {field.hint && <span className="text-xs text-[#A9BDCA]">{field.hint}</span>}
        </div>
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl border border-[#164C60]/70 bg-[#08243B] text-white focus:outline-none focus:ring-2 focus:ring-[#00D8C3] focus:border-transparent transition-all text-sm"
        >
          <option value="">Select...</option>
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
        {field.hint && <span className="text-xs text-[#A9BDCA]">{field.hint}</span>}
      </div>
      {field.type === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#164C60]/70 bg-[#08243B]/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00D8C3] focus:border-transparent transition-all text-sm"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl border border-[#164C60]/70 bg-[#08243B]/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00D8C3] focus:border-transparent transition-all text-sm"
        />
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
