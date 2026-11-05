'use client'

import { useEffect, useId, useState } from 'react'
import { btnGhost, btnPrimary, card, inputCls } from '@/components/ui/Primitives'
import { printClinicalDocument } from './document-print'

import {
  createEmptyRoutineAnc,
  parseRoutineAnc,
  estimateEddFromLmp,
  singular,
  repeated,
  specs,
  emptySection,
  type Section,
  type Repeated,
  type RoutineAncData,
  type RoutineAncProps,
} from '@/lib/anc-model'

export { createEmptyRoutineAnc, parseRoutineAnc, estimateEddFromLmp } from '@/lib/anc-model'
export type {
  AncBooking,
  AncPregnancy,
  AncPreviousOutcome,
  AncHistories,
  AncConsanguinity,
  AncThalassaemia,
  AncCbc,
  AncUltrasound,
  AncRisk,
  AncAllergy,
  AncVisit,
  AncDocument,
  RoutineAncData,
  RoutineAncProps,
} from '@/lib/anc-model'

const labels: Record<Section, string> = {
  booking: 'Booking & G/P/L/A',
  pregnancy: 'Current pregnancy & dating',
  histories: 'Histories',
  consanguinity: 'Consanguinity',
  thalassaemia: 'Thalassaemia screening',
  previousOutcomes: 'Previous pregnancy outcomes',
  cbc: 'CBC results',
  ultrasounds: 'Ultrasound reports',
  risks: 'Recorded risks — no referral triggers',
  allergies: 'Allergies',
  visits: 'Antenatal visits',
  documents: 'Supporting document metadata',
}

export function RoutineAnc({ value, initialValue, onChange, onSave }: RoutineAncProps) {
  const [draft, setDraft] = useState<RoutineAncData>(
    () => value ?? initialValue ?? createEmptyRoutineAnc(),
  )
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const id = useId()
  useEffect(() => {
    if (value !== undefined) {
      setDraft(value)
      setMessage('External record loaded; any previous unsaved draft was replaced.')
    }
  }, [value])
  const validation = parseRoutineAnc(draft)
  const data = validation.success ? validation.data : draft
  // Malformed parent input is reported rather than rendering unchecked nested data.
  const shape = parseRoutineAnc(value ?? initialValue ?? createEmptyRoutineAnc())
  if (!shape.success)
    return (
      <section className={`${card} p-5`}>
        <h2 className="font-bold">Routine antenatal record</h2>
        <p role="alert">Invalid supplied record: {shape.errors.join(' ')}</p>
      </section>
    )
  function update(next: RoutineAncData) {
    setDraft(next)
    onChange?.(next)
    setMessage('Draft changed in memory only; not saved.')
  }
  const object = (key: Section) => data[key] as unknown as Record<string, unknown>
  function fields(
    key: Section,
    item: Record<string, unknown>,
    edit: (next: Record<string, unknown>) => void,
    suffix: string,
  ) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {specs(key).map((f) => {
          const fieldId = `${id}-${key}-${suffix}-${f.key}`
          const val = item[f.key] ?? ''
          const change = (s: string) =>
            edit({ ...item, [f.key]: f.type === 'number' ? (s === '' ? null : Number(s)) : s })
          return (
            <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <label htmlFor={fieldId} className="mb-1 block text-sm font-semibold text-hx-ink">
                {f.label}
              </label>
              {f.options ? (
                <select
                  id={fieldId}
                  className={inputCls}
                  value={String(val)}
                  onChange={(e) => change(e.target.value)}
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o.replaceAll('-', ' ')}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  id={fieldId}
                  rows={2}
                  className={inputCls}
                  maxLength={5000}
                  value={String(val)}
                  onChange={(e) => change(e.target.value)}
                />
              ) : (
                <input
                  id={fieldId}
                  className={inputCls}
                  type={f.type ?? 'text'}
                  min={f.min ?? (f.type === 'number' ? 0 : undefined)}
                  max={f.max}
                  step={f.type === 'number' ? (f.integer ? 1 : 'any') : undefined}
                  maxLength={5000}
                  value={String(val)}
                  onChange={(e) => change(e.target.value)}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }
  function rows(key: Repeated): Record<string, unknown>[] {
    return data[key] as unknown as Record<string, unknown>[]
  }
  function updateRows(key: Repeated, items: Record<string, unknown>[]) {
    update({ ...draft, [key]: items } as RoutineAncData)
  }
  const estimate = estimateEddFromLmp(data.pregnancy.lmp)
  return (
    <section className={`${card} space-y-5 p-5`} aria-labelledby={`${id}-title`}>
      <header>
        <h2 id={`${id}-title`} className="text-xl font-extrabold text-hx-forest">
          Routine antenatal care record
        </h2>
        <p className="mt-2 text-sm text-hx-muted">
          Clinical preview · source PDFs unavailable; structure pending source verification.
          Simulated inputs only until specialist approval. This module records care; it never
          generates referral triggers, risk scores or clinical recommendations. Blank is not
          equivalent to normal or negative.
        </p>
      </header>
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault()
          const result = parseRoutineAnc(draft)
          if (!result.success) {
            setMessage(result.errors.join(' '))
            return
          }
          if (!onSave || saving) return
          setSaving(true)
          setMessage('Passing validated record to parent…')
          try {
            await onSave(result.data)
            setMessage(
              'Parent onSave callback completed. This module does not verify durable storage.',
            )
          } catch {
            setMessage('Parent save callback failed. Draft retained; review and try again.')
          } finally {
            setSaving(false)
          }
        }}
      >
        <fieldset disabled={saving} className="space-y-5">
          {singular.map((k) => (
            <fieldset key={k} className="space-y-3 rounded-xl border border-hx-border p-4">
              <legend className="px-2 font-bold text-hx-forest">{labels[k]}</legend>
              {fields(
                k,
                object(k),
                (next) => update({ ...draft, [k]: next } as RoutineAncData),
                'main',
              )}
              {k === 'booking' && (
                <p className="text-xs text-hx-muted">
                  G/P/L/A are entered independently using local definitions; not inferred from
                  outcome rows.
                </p>
              )}
              {k === 'pregnancy' && (
                <div className="space-y-2 text-sm">
                  <p>
                    Optional arithmetic estimate (LMP + 280 days, no cycle correction):{' '}
                    {estimate ?? 'enter a valid LMP'}. Not a verified EDD; clinical dating takes
                    precedence.
                  </p>
                  <button
                    type="button"
                    className={btnGhost}
                    disabled={!estimate}
                    onClick={() => {
                      if (estimate)
                        update({
                          ...draft,
                          pregnancy: { ...draft.pregnancy, edd: estimate, datingBasis: 'lmp' },
                        })
                    }}
                  >
                    Use LMP arithmetic estimate as EDD
                  </button>
                </div>
              )}
            </fieldset>
          ))}
          {repeated.map((k) => (
            <fieldset key={k} className="space-y-4 rounded-xl border border-hx-border p-4">
              <legend className="px-2 font-bold text-hx-forest">{labels[k]}</legend>
              {k === 'allergies' && (
                <label className="grid max-w-sm gap-1 text-sm font-semibold">
                  Allergies status
                  <select
                    className={inputCls}
                    value={data.allergiesStatus}
                    onChange={(e) =>
                      update({
                        ...draft,
                        allergiesStatus: e.target.value as RoutineAncData['allergiesStatus'],
                      })
                    }
                  >
                    <option value="unknown">Unknown / not assessed</option>
                    <option value="none-known">None known (explicitly assessed)</option>
                    <option value="recorded">Allergies recorded below</option>
                  </select>
                </label>
              )}
              {k === 'documents' && (
                <p className="text-sm text-hx-muted">
                  Metadata only; no file upload or PDF reading. All source verification remains
                  pending. Do not enter secret or signed URLs.
                </p>
              )}
              {!rows(k).length && (
                <p className="text-sm text-hx-muted">
                  No entries recorded. This does not establish a negative history.
                </p>
              )}
              {rows(k).map((item, i) => (
                <fieldset key={String(item.id)} className="space-y-3 rounded-xl bg-hx-mint/40 p-3">
                  <legend className="px-1 text-sm font-bold">Entry {i + 1}</legend>
                  {fields(
                    k,
                    item,
                    (next) =>
                      updateRows(
                        k,
                        rows(k).map((r) => (r.id === item.id ? next : r)),
                      ),
                    String(item.id),
                  )}
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() =>
                      updateRows(
                        k,
                        rows(k).filter((r) => r.id !== item.id),
                      )
                    }
                  >
                    Remove {labels[k].toLowerCase()} entry {i + 1}
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                className={btnGhost}
                disabled={rows(k).length >= 100}
                onClick={() => {
                  const next = {
                    ...draft,
                    [k]: [...rows(k), { id: crypto.randomUUID(), ...emptySection(k) }],
                    ...(k === 'allergies' ? { allergiesStatus: 'recorded' } : {}),
                  } as RoutineAncData
                  update(next)
                }}
              >
                Add {labels[k].toLowerCase()} entry
              </button>
            </fieldset>
          ))}
        </fieldset>
        {!validation.success && (
          <div role="alert" className="rounded-xl border border-red-200 p-3 text-sm text-red-800">
            <p className="font-bold">Resolve before submitting:</p>
            <ul className="list-disc pl-5">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            className={btnPrimary}
            type="submit"
            disabled={!onSave || saving || !validation.success}
          >
            {saving ? 'Saving via parent…' : 'Save via parent callback'}
          </button>
          <button
            className={btnGhost}
            type="button"
            disabled={!validation.success || saving}
            onClick={() => {
              const result = parseRoutineAnc(draft)
              if (
                result.success &&
                !printClinicalDocument(
                  'Routine antenatal care record',
                  JSON.stringify(result.data, null, 2),
                )
              )
                setMessage('Print window blocked. Allow popups and try again.')
            }}
          >
            Print / Save as PDF…
          </button>
        </div>
        <p className="text-sm text-hx-muted">
          {onSave
            ? 'Save delegates to the parent callback; this module performs no backend writes.'
            : 'No save callback provided. Edits remain in memory and are lost when unmounted or reloaded.'}{' '}
          Print opens a browser print view; choose Save as PDF in the browser. Exports may contain
          sensitive information.
        </p>
      </form>
      <p role="status" aria-live="polite" className="text-sm font-semibold text-hx-forest">
        {message}
      </p>
    </section>
  )
}
export default RoutineAnc
