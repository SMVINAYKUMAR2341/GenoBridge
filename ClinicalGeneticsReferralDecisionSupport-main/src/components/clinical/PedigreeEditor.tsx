'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { btnGhost, btnPrimary, card, inputCls } from '@/components/ui/Primitives'
import {
  createDemoPedigree,
  createEmptyPedigree,
  createPedigreePerson,
  parsePedigree,
  type PedigreeFamily,
  type PedigreeModel,
  type PedigreePerson,
} from './pedigree-model'
import { downloadSvg, printClinicalDocument } from './document-print'

export interface PedigreeEditorProps {
  /** Supplying value makes this controlled. Without onChange it is read-only. */
  value?: PedigreeModel
  onChange?: (value: PedigreeModel) => void
  /** Used only on mount, only when value is omitted. */
  initialValue?: PedigreeModel
  /** Opt-in synthetic example; otherwise standalone starts empty. */
  demo?: boolean
}
const uid = () => crypto.randomUUID()
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-hx-ink">
      {label}
      {children}
    </label>
  )
}
const wrap = (text: string) => text.match(/.{1,27}(?:\s|$)|\S{1,27}/g)?.map((s) => s.trim()) ?? []
function details(p: PedigreePerson): string[] {
  return [
    p.name,
    `Age: ${p.age || 'not recorded'}`,
    p.branch && `Branch: ${p.branch}`,
    p.outcome !== 'liveborn' && p.outcome,
    (p.gestationalWeeks !== null || p.gestationalDays !== null) &&
      `GA: ${p.gestationalWeeks ?? '?'}w ${p.gestationalDays ?? '?'}d`,
    p.deceased && `Died: ${p.ageAtDeath || 'age unknown'}; ${p.causeOfDeath || 'cause unknown'}`,
    ...p.conditions.map((c) => `${c.status}: ${c.name}`),
    p.notes && `Note: ${p.notes}`,
  ]
    .filter(Boolean)
    .flatMap((s) => wrap(String(s)))
}

export function PedigreeEditor({
  value,
  onChange,
  initialValue,
  demo = false,
}: PedigreeEditorProps) {
  const [local, setLocal] = useState(
    () => initialValue ?? (demo ? createDemoPedigree() : createEmptyPedigree()),
  )
  const [person, setPerson] = useState<PedigreePerson | null>(null)
  const [family, setFamily] = useState<PedigreeFamily | null>(null)
  const [message, setMessage] = useState('')
  const svg = useRef<SVGSVGElement>(null)
  const heading = useId(),
    description = useId()
  const parsed = parsePedigree(value ?? local)
  const model = parsed.success ? parsed.data : createEmptyPedigree()
  const readOnly = value !== undefined && !onChange
  function commit(next: PedigreeModel): boolean {
    if (readOnly) return false
    const result = parsePedigree(next)
    if (!result.success) {
      setMessage(result.errors.join(' '))
      return false
    }
    if (value === undefined) setLocal(result.data)
    onChange?.(result.data)
    setMessage('Updated in parent state / memory only.')
    return true
  }
  const rowHeight = Math.max(220, ...model.people.map((p) => details(p).length * 15 + 105))
  const rows = [1, 2, 3].map((g) => model.people.filter((p) => p.generation === g))
  const width = Math.max(760, ...rows.map((r) => r.length * 200 + 100))
  const height = rowHeight * 3 + 135
  const points = new Map(
    model.people.map((p) => [
      p.id,
      {
        x: 120 + rows[p.generation - 1].findIndex((q) => q.id === p.id) * 200,
        y: 100 + (p.generation - 1) * rowHeight,
      },
    ]),
  )
  const patchPerson = (patch: Partial<PedigreePerson>) => setPerson((p) => p && { ...p, ...patch })
  return (
    <section className={`${card} space-y-5 p-5`} aria-labelledby={heading}>
      <header>
        <h2 id={heading} className="text-xl font-extrabold text-hx-forest">
          Three-generation pedigree
        </h2>
        <p className="mt-2 text-sm text-hx-muted">
          Clinical preview · source PDFs unavailable; structure pending source verification. Not
          clinically validated. Standalone edits are in memory only; parent controls any
          persistence. Exports may contain sensitive information.
        </p>
      </header>
      {!parsed.success && (
        <p role="alert" className="text-red-800">
          Invalid supplied pedigree: {parsed.errors.join(' ')}
        </p>
      )}
      {readOnly && <p className="text-sm">Read-only: provide onChange to enable editing.</p>}
      <Field label="Pedigree title">
        <input
          className={inputCls}
          value={model.title}
          disabled={readOnly || !parsed.success}
          onChange={(e) => commit({ ...model, title: e.target.value })}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnPrimary}
          disabled={readOnly || !parsed.success}
          onClick={() => {
            setFamily(null)
            setPerson(createPedigreePerson(uid()))
          }}
        >
          Add person / pregnancy
        </button>
        <button
          type="button"
          className={btnGhost}
          disabled={readOnly || !parsed.success || !model.people.length}
          onClick={() => {
            setPerson(null)
            setFamily({ id: uid(), parents: [], children: [], consanguineous: false })
          }}
        >
          Add relationship
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            if (svg.current) downloadSvg(svg.current)
          }}
          disabled={!parsed.success}
        >
          Download SVG
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            if (svg.current && !printClinicalDocument(model.title, svg.current))
              setMessage('Print window blocked. Allow popups and try again.')
          }}
          disabled={!parsed.success}
        >
          Print / Save as PDF…
        </button>
      </div>
      <p id={description} className="text-sm text-hx-muted">
        Select a symbol with a click, Enter or Space to edit. Tab navigates symbols. Squares: male;
        circles: female; diamonds: unknown. Filled: affected; central dot: carrier; slash: deceased;
        arrow: proband; C: consultand. Triangle: pregnancy loss; P: ongoing; SB: stillbirth; EA:
        elective abortion. Double partner line: consanguinity. Shared descent bar: siblings.
        Conditions are listed individually beneath each symbol. Use Move left / right to arrange
        branches and adjacent partners. Review connector crossings before clinical interpretation or
        export.
      </p>
      <div className="overflow-auto rounded-xl border border-hx-border bg-hx-mint/30">
        <svg
          ref={svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="group"
          aria-labelledby={`${heading}-svg`}
          aria-describedby={description}
        >
          <title id={`${heading}-svg`}>{model.title}</title>
          <desc>
            Three generations. Symbols are keyboard-selectable; all people and relationships also
            have text editing controls below.
          </desc>
          <rect width={width} height={height} fill="white" />
          <g fontFamily="system-ui, sans-serif" fontSize="12" fill="#0b1220">
            <text x="20" y="25" fontSize="18" fontWeight="bold">
              {model.title}
            </text>
            <text x="20" y="47">
              Clinical preview · pending source verification · not clinically validated
            </text>
            {['I', 'II', 'III'].map((n, i) => (
              <text key={n} x="20" y={100 + i * rowHeight}>
                {n}
              </text>
            ))}
            {model.families.map((f) => {
              const a = points.get(f.parents[0])!,
                b = points.get(f.parents[1]) ?? a
              const mid = (a.x + b.x) / 2,
                barY = a.y + rowHeight - 50
              const kids = f.children.map((id) => points.get(id)!)
              const xs = [mid, ...kids.map((k) => k.x)]
              return (
                <g
                  key={f.id}
                  fill="none"
                  stroke="#075a26"
                  strokeWidth="2"
                  aria-label={`Relationship: ${f.parents.map((id) => model.people.find((p) => p.id === id)?.name).join(' and ')}; ${f.children.length} children${f.consanguineous ? '; consanguineous' : ''}`}
                >
                  {f.parents.length === 2 && (
                    <>
                      <path d={`M${a.x} ${a.y} H${b.x}`} />
                      {f.consanguineous && <path d={`M${a.x} ${a.y + 6} H${b.x}`} />}
                    </>
                  )}
                  {!!kids.length && (
                    <>
                      <path
                        d={`M${mid} ${a.y} V${barY} M${Math.min(...xs)} ${barY} H${Math.max(...xs)}`}
                      />
                      {kids.map((k, i) => (
                        <path key={f.children[i]} d={`M${k.x} ${barY} V${k.y - 20}`} />
                      ))}
                    </>
                  )}
                </g>
              )
            })}
            {model.people.map((p) => {
              const { x, y } = points.get(p.id)!
              const affected = p.conditions.some((c) => c.status === 'affected'),
                carrier = p.conditions.some((c) => c.status === 'carrier')
              const loss = p.outcome === 'miscarriage' || p.outcome === 'elective-abortion'
              const fill = affected ? '#137a2c' : '#ffffff'
              return (
                <g
                  key={p.id}
                  transform={`translate(${x} ${y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${p.name}, ${p.sex}, generation ${p.generation}. ${details(p).slice(1).join('. ')}${p.proband ? '. Proband' : ''}${p.consultand ? '. Consultand' : ''}`}
                  aria-pressed={person?.id === p.id}
                  onClick={() => {
                    setPerson(structuredClone(p))
                    setFamily(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setPerson(structuredClone(p))
                      setFamily(null)
                    }
                  }}
                >
                  <title>{details(p).join('; ')}</title>
                  {person?.id === p.id && (
                    <rect
                      x="-29"
                      y="-29"
                      width="58"
                      height="58"
                      rx="6"
                      fill="#e8f8ec"
                      stroke="#137a2c"
                      strokeDasharray="4 3"
                    />
                  )}
                  {loss ? (
                    <path d="M0 -20 L-20 18 H20 Z" fill={fill} stroke="#075a26" strokeWidth="2" />
                  ) : p.sex === 'male' ? (
                    <rect
                      x="-20"
                      y="-20"
                      width="40"
                      height="40"
                      fill={fill}
                      stroke="#075a26"
                      strokeWidth="2"
                    />
                  ) : p.sex === 'female' ? (
                    <circle r="20" fill={fill} stroke="#075a26" strokeWidth="2" />
                  ) : (
                    <path
                      d="M0 -22 L22 0 L0 22 L-22 0 Z"
                      fill={fill}
                      stroke="#075a26"
                      strokeWidth="2"
                    />
                  )}
                  {carrier && <circle r="5" fill={affected ? '#ffffff' : '#075a26'} />}
                  {(p.deceased || p.outcome === 'stillbirth' || loss) && (
                    <path d="M-26 26 L26 -26" stroke="#0b1220" strokeWidth="2" />
                  )}
                  {p.proband && (
                    <path
                      d="M-43 38 L-23 21 M-34 24 L-23 21 L-26 32"
                      fill="none"
                      stroke="#0b1220"
                      strokeWidth="2"
                    />
                  )}
                  {p.consultand && (
                    <text x="28" y="-15" fontWeight="bold">
                      C
                    </text>
                  )}
                  {p.outcome !== 'liveborn' && (
                    <text textAnchor="middle" y="5" fill={affected ? 'white' : '#0b1220'}>
                      {p.outcome === 'ongoing'
                        ? 'P'
                        : p.outcome === 'stillbirth'
                          ? 'SB'
                          : p.outcome === 'elective-abortion'
                            ? 'EA'
                            : ''}
                    </text>
                  )}
                  {details(p).map((line, i) => (
                    <text key={i} x="0" y={45 + i * 15} textAnchor="middle">
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}
            <text x="20" y={height - 55}>
              Square male · circle female · diamond unknown · fill affected · dot carrier · slash
              deceased/loss
            </text>
            <text x="20" y={height - 35}>
              Arrow proband · C consultand · triangle loss · P ongoing · SB stillbirth · EA elective
              abortion
            </text>
            <text x="20" y={height - 15}>
              Double line consanguinity · shared descent bar siblings · condition status is
              explicitly labelled
            </text>
          </g>
        </svg>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="People list">
        {model.people.map((p) => (
          <button
            key={p.id}
            type="button"
            className={btnGhost}
            aria-pressed={person?.id === p.id}
            onClick={() => {
              setPerson(structuredClone(p))
              setFamily(null)
            }}
          >
            {p.name} · generation {p.generation}
          </button>
        ))}
      </div>
      {person && (
        <form
          className="space-y-4 rounded-xl border border-hx-border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            const exists = model.people.some((p) => p.id === person.id)
            if (
              commit({
                ...model,
                people: exists
                  ? model.people.map((p) => (p.id === person.id ? person : p))
                  : [...model.people, person],
              })
            )
              setPerson(null)
          }}
        >
          <h3 className="font-bold">Person / pregnancy details</h3>
          <fieldset disabled={readOnly || !parsed.success} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Name / identifier">
                <input
                  required
                  maxLength={200}
                  className={inputCls}
                  value={person.name}
                  onChange={(e) => patchPerson({ name: e.target.value })}
                />
              </Field>
              <Field label="Sex">
                <select
                  className={inputCls}
                  value={person.sex}
                  onChange={(e) => patchPerson({ sex: e.target.value as PedigreePerson['sex'] })}
                >
                  {['male', 'female', 'unknown'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Generation">
                <select
                  className={inputCls}
                  value={person.generation}
                  onChange={(e) => patchPerson({ generation: Number(e.target.value) as 1 | 2 | 3 })}
                >
                  {[1, 2, 3].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </Field>
              {(['branch', 'age', 'ageAtDeath', 'causeOfDeath'] as const).map((k) => (
                <Field
                  key={k}
                  label={
                    {
                      branch: 'Family branch / side',
                      age: 'Age (include units)',
                      ageAtDeath: 'Age at death (include units)',
                      causeOfDeath: 'Cause of death',
                    }[k]
                  }
                >
                  <input
                    className={inputCls}
                    maxLength={2000}
                    value={person[k]}
                    onChange={(e) => patchPerson({ [k]: e.target.value })}
                  />
                </Field>
              ))}
              <Field label="Pregnancy / outcome">
                <select
                  className={inputCls}
                  value={person.outcome}
                  onChange={(e) =>
                    patchPerson({ outcome: e.target.value as PedigreePerson['outcome'] })
                  }
                >
                  {['liveborn', 'ongoing', 'miscarriage', 'elective-abortion', 'stillbirth'].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </Field>
              {(['gestationalWeeks', 'gestationalDays'] as const).map((k) => (
                <Field
                  key={k}
                  label={k === 'gestationalWeeks' ? 'Gestational weeks' : 'Gestational days'}
                >
                  <input
                    type="number"
                    min="0"
                    max={k === 'gestationalWeeks' ? 45 : 6}
                    className={inputCls}
                    value={person[k] ?? ''}
                    onChange={(e) =>
                      patchPerson({ [k]: e.target.value === '' ? null : Number(e.target.value) })
                    }
                  />
                </Field>
              ))}
            </div>
            <div className="flex flex-wrap gap-5">
              {(['deceased', 'proband', 'consultand'] as const).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={person[k]}
                    onChange={(e) => patchPerson({ [k]: e.target.checked })}
                  />
                  {k}
                </label>
              ))}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">
                Conditions (each independently affected / carrier)
              </legend>
              {person.conditions.map((c, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <Field label={`Condition ${i + 1}`}>
                    <input
                      required
                      className={inputCls}
                      value={c.name}
                      maxLength={2000}
                      onChange={(e) =>
                        patchPerson({
                          conditions: person.conditions.map((q, j) =>
                            j === i ? { ...q, name: e.target.value } : q,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label={`Condition ${i + 1} status`}>
                    <select
                      className={inputCls}
                      value={c.status}
                      onChange={(e) =>
                        patchPerson({
                          conditions: person.conditions.map((q, j) =>
                            j === i
                              ? { ...q, status: e.target.value as 'affected' | 'carrier' }
                              : q,
                          ),
                        })
                      }
                    >
                      <option>affected</option>
                      <option>carrier</option>
                    </select>
                  </Field>
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() =>
                      patchPerson({ conditions: person.conditions.filter((_, j) => j !== i) })
                    }
                  >
                    Remove condition {i + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={btnGhost}
                onClick={() =>
                  patchPerson({
                    conditions: [...person.conditions, { name: '', status: 'affected' }],
                  })
                }
              >
                Add condition
              </button>
            </fieldset>
            <Field label="Notes">
              <textarea
                className={inputCls}
                maxLength={2000}
                value={person.notes}
                onChange={(e) => patchPerson({ notes: e.target.value })}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button className={btnPrimary} type="submit">
                Apply person
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  const linked = model.families.some((f) =>
                    [...f.parents, ...f.children].includes(person.id),
                  )
                  if (linked) {
                    setMessage(
                      'Remove this person from all relationships first; no relationships are silently deleted.',
                    )
                    return
                  }
                  if (commit({ ...model, people: model.people.filter((p) => p.id !== person.id) }))
                    setPerson(null)
                }}
              >
                Delete person
              </button>
              {[-1, 1].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    const list = [...model.people],
                      i = list.findIndex((p) => p.id === person.id)
                    const other = list
                      .map((p, index) => ({ p, index }))
                      .filter((q) => q.p.generation === person.generation)
                    const j = other.findIndex((q) => q.p.id === person.id)
                    const target = other[j + d]?.index
                    if (i >= 0 && target !== undefined) {
                      ;[list[i], list[target]] = [list[target], list[i]]
                      commit({ ...model, people: list })
                    }
                  }}
                >
                  Move {d < 0 ? 'left' : 'right'}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" className={btnGhost} onClick={() => setPerson(null)}>
            Close / discard unapplied edits
          </button>
        </form>
      )}
      <div className="space-y-2" aria-label="Relationships">
        {model.families.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span>
              {f.parents.map((id) => model.people.find((p) => p.id === id)?.name).join(' + ')} →{' '}
              {f.children.map((id) => model.people.find((p) => p.id === id)?.name).join(', ') ||
                'No children'}
              {f.consanguineous ? ' (consanguineous)' : ''}
            </span>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setFamily(structuredClone(f))
                setPerson(null)
              }}
            >
              Edit relationship
            </button>
          </div>
        ))}
      </div>
      {family && (
        <form
          className="space-y-3 rounded-xl border border-hx-border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (
              commit({
                ...model,
                families: [...model.families.filter((f) => f.id !== family.id), family],
              })
            )
              setFamily(null)
          }}
        >
          <h3 className="font-bold">Partner / descent relationship</h3>
          <p className="text-sm">
            Choose one or two parents and their children. One group defines siblings. Partners must
            share a generation; children must be in the next generation. Multiple partner groups
            support branches.
          </p>
          <fieldset disabled={readOnly || !parsed.success} className="space-y-3">
            {(['parents', 'children'] as const).map((k) => (
              <fieldset key={k} className="flex flex-wrap gap-3">
                <legend className="text-sm font-bold">
                  {k === 'parents' ? 'Parent(s) / partners (maximum two)' : 'Children / siblings'}
                </legend>
                {model.people.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={family[k].includes(p.id)}
                      onChange={(e) =>
                        setFamily({
                          ...family,
                          [k]: e.target.checked
                            ? [...family[k], p.id]
                            : family[k].filter((id) => id !== p.id),
                        })
                      }
                    />
                    {p.name} (gen {p.generation})
                  </label>
                ))}
              </fieldset>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={family.consanguineous}
                onChange={(e) => setFamily({ ...family, consanguineous: e.target.checked })}
              />
              Consanguineous partners (double line)
            </label>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>
                Apply relationship
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  if (
                    commit({ ...model, families: model.families.filter((f) => f.id !== family.id) })
                  )
                    setFamily(null)
                }}
              >
                Delete relationship only
              </button>
            </div>
          </fieldset>
          <button type="button" className={btnGhost} onClick={() => setFamily(null)}>
            Close / discard unapplied edits
          </button>
        </form>
      )}
      <p role="status" aria-live="polite" className="text-sm font-semibold text-hx-forest">
        {message}
      </p>
    </section>
  )
}
export default PedigreeEditor
