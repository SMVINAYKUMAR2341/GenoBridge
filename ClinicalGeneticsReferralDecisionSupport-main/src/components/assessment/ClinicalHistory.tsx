'use client'

import React from 'react'
import {
  FORM_FIELDS,
  type InputField,
  visibleIntakeFields,
  type WorkflowIntake,
} from '@/lib/form-fields'

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
    <div className="space-y-6 text-slate-900">
      {/* OPD Guidance Note */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-center justify-between">
        <span>Fill in only what applies. Fields left blank are treated as negative / not present.</span>
        <span className="font-mono text-[11px] text-[#b8125d] font-bold">POINT-OF-CARE OPD</span>
      </div>

      {/* Main Intake Form Fields matching Histone */}
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#b8125d] ${
        checked ? 'bg-[#b8125d]' : 'bg-slate-200 hover:bg-slate-300'
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
      <div className="flex items-center justify-between py-2.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors">
        <label htmlFor={id} className="text-sm font-medium text-slate-800 cursor-pointer select-none max-w-[80%]">
          {field.label}
          {field.hint && <span className="block text-xs text-slate-500 font-normal mt-0.5">{field.hint}</span>}
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
        <label className="block text-sm font-semibold text-slate-900">
          {field.label}
          {field.hint && <span className="block text-xs text-slate-500 font-normal">{field.hint}</span>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {field.options?.map(([optVal, optLabel]) => {
            const isSelected = currentList.includes(optVal)
            return (
              <label
                key={optVal}
                onClick={() => toggleOption(optVal)}
                className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 cursor-pointer text-xs font-semibold transition-all select-none ${
                  isSelected
                    ? 'border-[#b8125d] bg-[#fdf2f8] text-[#b8125d] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#b8125d] bg-[#b8125d]' : 'border-slate-300 bg-white'
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
          <label htmlFor={id} className="text-sm font-semibold text-slate-800">
            {field.label}
          </label>
          {field.hint && <span className="text-xs text-slate-500">{field.hint}</span>}
        </div>
        <input
          id={id}
          type="number"
          step={field.step || 1}
          min={field.min ?? 0}
          value={value ?? ''}
          placeholder="0"
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#b8125d] text-sm"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    )
  }

  // Select dropdown
  if (field.type === 'select') {
    return (
      <div className="space-y-1.5 py-1">
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="text-sm font-semibold text-slate-800">
            {field.label}
          </label>
          {field.hint && <span className="text-xs text-slate-500">{field.hint}</span>}
        </div>
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#b8125d] text-sm"
        >
          <option value="">Select...</option>
          {field.options?.map(([optVal, optLabel]) => (
            <option key={optVal} value={optVal}>
              {optLabel}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    )
  }

  // Text / Textarea
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {field.label}
        </label>
        {field.hint && <span className="text-xs text-slate-500">{field.hint}</span>}
      </div>
      {field.type === 'textarea' ? (
        <textarea
          id={id}
          rows={3}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#b8125d] text-sm"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#b8125d] text-sm"
        />
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
