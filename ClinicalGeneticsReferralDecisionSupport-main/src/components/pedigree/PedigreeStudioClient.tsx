'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Dna,
  Download,
  Info,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'

export interface PedigreeMember {
  id: string
  relation: string
  sex: 'M' | 'F' | 'U'
  label: string
  age: number | null
  deceased: boolean
  age_at_death: number | null
  affected: boolean
  conditions: string[]
  age_at_diagnosis: number | null
  notes: string
}

export interface PedigreeData {
  ashkenazi_ancestry: boolean
  consanguinity: boolean
  ancestries: string[]
  members: PedigreeMember[]
}

export const CONDITION_OPTIONS = [
  { value: 'breast_cancer', label: 'Breast cancer' },
  { value: 'ovarian_cancer', label: 'Ovarian cancer' },
  { value: 'colorectal_cancer', label: 'Colorectal cancer' },
  { value: 'endometrial_cancer', label: 'Endometrial cancer' },
  { value: 'pancreatic_cancer', label: 'Pancreatic cancer' },
  { value: 'prostate_cancer', label: 'Prostate cancer' },
  { value: 'recessive_condition', label: 'Recessive disorder' },
  { value: 'other', label: 'Other genetic condition' },
]

export const ANCESTRIES_OPTIONS = [
  { value: 'ashkenazi', label: 'Ashkenazi Jewish' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'southeast_asian', label: 'Southeast Asian' },
  { value: 'african', label: 'African / African-American' },
  { value: 'european', label: 'European (non-AJ)' },
  { value: 'latino', label: 'Latino / Hispanic' },
  { value: 'other', label: 'Other' },
]

const FIXED_RELATIONS: { key: string; label: string; sex: 'M' | 'F' | 'U' }[] = [
  { key: 'paternal_grandfather', label: 'Paternal grandfather', sex: 'M' },
  { key: 'paternal_grandmother', label: 'Paternal grandmother', sex: 'F' },
  { key: 'maternal_grandfather', label: 'Maternal grandfather', sex: 'M' },
  { key: 'maternal_grandmother', label: 'Maternal grandmother', sex: 'F' },
  { key: 'father', label: 'Father', sex: 'M' },
  { key: 'mother', label: 'Mother', sex: 'F' },
  { key: 'proband', label: 'Proband (Patient)', sex: 'F' },
]

function newMember(relation: string, sex: 'M' | 'F' | 'U' = 'U'): PedigreeMember {
  return {
    id: `${relation}_${Math.random().toString(36).slice(2, 8)}`,
    relation,
    sex,
    label: '',
    age: null,
    deceased: false,
    age_at_death: null,
    affected: false,
    conditions: [],
    age_at_diagnosis: null,
    notes: '',
  }
}

function ensureFixed(members: PedigreeMember[]): PedigreeMember[] {
  const map = new Map(members.map((m) => [m.relation, m]))
  for (const f of FIXED_RELATIONS) {
    if (!map.has(f.key)) {
      const m = newMember(f.key, f.sex)
      m.id = f.key
      map.set(f.key, m)
    }
  }
  const out = FIXED_RELATIONS.map((f) => map.get(f.key)!)
  const variables = members.filter((m) => !FIXED_RELATIONS.some((f) => f.key === m.relation))
  return [...out, ...variables]
}

const FIRST_DEGREE = new Set(['father', 'mother', 'sibling', 'child'])
const SECOND_DEGREE = new Set([
  'paternal_grandfather',
  'paternal_grandmother',
  'maternal_grandfather',
  'maternal_grandmother',
  'paternal_uncle_aunt',
  'maternal_uncle_aunt',
  'half_sibling',
])

function hasCondition(member: PedigreeMember, condition: string): boolean {
  return Boolean(member.affected) && (member.conditions || []).includes(condition)
}

/** Exact derivation logic from Histone backend/pedigree.py */
export function deriveFeatures(pedigree: PedigreeData | null) {
  if (!pedigree) return {}
  const members = pedigree.members || []
  const nonProband = members.filter((m) => m.relation !== 'proband')
  const firstDegree = members.filter((m) => FIRST_DEGREE.has(m.relation))
  const secondDegree = members.filter((m) => SECOND_DEGREE.has(m.relation))

  const breastFirst = firstDegree.filter((m) => hasCondition(m, 'breast_cancer')).length
  const ovarianAny = nonProband.filter((m) => hasCondition(m, 'ovarian_cancer')).length
  const colonAny = nonProband.filter((m) => hasCondition(m, 'colorectal_cancer')).length
  const maleBreast = nonProband.some((m) => m.sex === 'M' && hasCondition(m, 'breast_cancer'))
  const familyRecessive = nonProband.some((m) => hasCondition(m, 'recessive_condition'))

  const firstDegreeAffected = firstDegree.filter((m) => m.affected)
  const secondDegreeAffected = secondDegree.filter((m) => m.affected)
  const totalAffected = nonProband.filter((m) => m.affected).length

  let closest: 'first' | 'second' | null = null
  if (firstDegreeAffected.length > 0) closest = 'first'
  else if (secondDegreeAffected.length > 0) closest = 'second'

  const ancestries = [...(pedigree.ancestries || [])]
  if (pedigree.ashkenazi_ancestry && !ancestries.includes('ashkenazi')) {
    ancestries.push('ashkenazi')
  }

  return {
    family_breast_cancer_first_degree_count: breastFirst,
    family_ovarian_cancer_count: ovarianAny,
    family_colon_cancer_count: colonAny,
    male_breast_cancer_family: maleBreast,
    ashkenazi_ancestry: Boolean(pedigree.ashkenazi_ancestry),
    consanguinity: Boolean(pedigree.consanguinity),
    ancestries,
    family_history_recessive_condition: familyRecessive,
    multiple_affected: totalAffected >= 2,
    closest_affected_degree: closest,
    total_affected: totalAffected,
  }
}

export default function PedigreeStudioClient({
  userName,
  userRole,
}: {
  userName: string
  userRole: string
}) {
  const [pedigree, setPedigree] = useState<PedigreeData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('histone_active_pedigree')
        if (saved) {
          const parsed = JSON.parse(saved)
          return {
            ...parsed,
            members: ensureFixed(parsed.members || []),
          }
        }
      } catch {}
    }
    return {
      ashkenazi_ancestry: false,
      consanguinity: false,
      ancestries: [],
      members: ensureFixed([]),
    }
  })

  const [savedNotice, setSavedNotice] = useState(false)

  const updateMember = (id: string, patch: Partial<PedigreeMember>) => {
    setPedigree((p) => ({
      ...p,
      members: p.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }

  const addMember = (relation: string, sex: 'M' | 'F' | 'U' = 'U') => {
    setPedigree((p) => ({
      ...p,
      members: [...p.members, newMember(relation, sex)],
    }))
  }

  const removeMember = (id: string) => {
    setPedigree((p) => ({
      ...p,
      members: p.members.filter((m) => m.id !== id),
    }))
  }

  const savePedigree = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('histone_active_pedigree', JSON.stringify(pedigree))
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 3000)
    }
  }

  const derived = useMemo(() => deriveFeatures(pedigree), [pedigree])

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-mono tracking-[0.22em] uppercase font-bold text-[#b8125d] mb-1">
            MULTIGENERATIONAL PEDIGREE STUDIO
          </div>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-slate-900">
            Family History &amp; Pedigree Chart
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Fills family history for all six clinical pathways automatically. Fixed slots exist for 4 grandparents, both parents, and proband. Add siblings, children, aunts, and uncles as needed.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={savePedigree}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-[#b8125d] text-white hover:bg-[#9d0f4e] shadow-sm transition"
          >
            <Save size={16} />
            <span>{savedNotice ? 'Pedigree Saved!' : 'Save Pedigree'}</span>
          </button>
        </div>
      </div>

      {/* Live SVG Pedigree Canvas (Histone Visualization) */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="text-xs font-bold tracking-wider text-slate-900 uppercase">
            Pedigree · Live Canvas
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border border-slate-700 inline-block bg-white" /> Male
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border border-slate-700 inline-block rounded-full bg-white" /> Female
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#b8125d] inline-block" /> Affected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-[#b8125d]">P</span> Proband
            </span>
          </div>
        </div>

        <LivePedigreeCanvas pedigree={pedigree} />
      </div>

      {/* Automated Features Derived for the Decision Engine */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#b8125d] flex items-center gap-2">
            <Dna size={16} />
            <span>Engine Features Auto-Derived from Pedigree</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">decision_engine.py integration</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">1st-Deg Breast Cancer</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{derived.family_breast_cancer_first_degree_count}</div>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">Ovarian Cancer (Any)</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{derived.family_ovarian_cancer_count}</div>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">Colorectal Cancer (Any)</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{derived.family_colon_cancer_count}</div>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">Male Breast Cancer</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{derived.male_breast_cancer_family ? 'Yes' : 'No'}</div>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">Closest Affected Relative</div>
            <div className="text-base font-bold text-slate-900 mt-0.5 capitalize">{derived.closest_affected_degree || 'None'}</div>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">Multiple Relatives Affected</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{derived.multiple_affected ? 'Yes (>= 2)' : 'No'}</div>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">Consanguinity</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{derived.consanguinity ? 'Yes' : 'No'}</div>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-slate-500">Recessive Condition Hx</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{derived.family_history_recessive_condition ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Pedigree-Level Factors */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Pedigree-Level Factors
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <span className="text-sm font-semibold text-slate-800">Ashkenazi Jewish ancestry</span>
            <input
              type="checkbox"
              checked={pedigree.ashkenazi_ancestry}
              onChange={(e) => setPedigree((p) => ({ ...p, ashkenazi_ancestry: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#b8125d] focus:ring-[#b8125d]"
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <span className="text-sm font-semibold text-slate-800">Consanguineous partnership</span>
            <input
              type="checkbox"
              checked={pedigree.consanguinity}
              onChange={(e) => setPedigree((p) => ({ ...p, consanguinity: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#b8125d] focus:ring-[#b8125d]"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reported Ancestries
          </label>
          <div className="flex flex-wrap gap-2">
            {ANCESTRIES_OPTIONS.map((a) => {
              const active = pedigree.ancestries.includes(a.value)
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => {
                    const set = new Set(pedigree.ancestries)
                    set.has(a.value) ? set.delete(a.value) : set.add(a.value)
                    setPedigree((p) => ({ ...p, ancestries: Array.from(set) }))
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                    active
                      ? 'bg-[#b8125d] text-white border-[#b8125d]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {a.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Member Management Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Family Members ({pedigree.members.length})
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addMember('sibling', 'U')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              + Add Sibling
            </button>
            <button
              type="button"
              onClick={() => addMember('child', 'U')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              + Add Child
            </button>
            <button
              type="button"
              onClick={() => addMember('paternal_uncle_aunt', 'U')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              + Paternal Aunt/Uncle
            </button>
            <button
              type="button"
              onClick={() => addMember('maternal_uncle_aunt', 'U')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              + Maternal Aunt/Uncle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pedigree.members.map((m) => {
            const isFixed = FIXED_RELATIONS.some((f) => f.key === m.relation)
            return (
              <div
                key={m.id}
                className={`rounded-lg border p-4 transition ${
                  m.affected
                    ? 'border-[#b8125d] bg-[#fdf2f8]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 capitalize">
                      {m.relation.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {m.label || m.relation} · {m.sex === 'M' ? 'Male' : m.sex === 'F' ? 'Female' : 'Unknown sex'}
                    </div>
                  </div>

                  {!isFixed && (
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                      title="Remove member"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select
                    value={m.sex}
                    onChange={(e) => updateMember(m.id, { sex: e.target.value as any })}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="M">Male (Square)</option>
                    <option value="F">Female (Circle)</option>
                    <option value="U">Unknown (Diamond)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Age"
                    value={m.age ?? ''}
                    onChange={(e) =>
                      updateMember(m.id, {
                        age: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.affected}
                        onChange={(e) => updateMember(m.id, { affected: e.target.checked })}
                        className="rounded border-slate-300 text-[#b8125d]"
                      />
                      <span>Affected</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.deceased}
                        onChange={(e) => updateMember(m.id, { deceased: e.target.checked })}
                        className="rounded border-slate-300 text-slate-600"
                      />
                      <span>Deceased</span>
                    </label>
                  </div>
                </div>

                {m.affected && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Reported Conditions
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CONDITION_OPTIONS.map((c) => {
                        const active = (m.conditions || []).includes(c.value)
                        return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => {
                              const set = new Set(m.conditions || [])
                              set.has(c.value) ? set.delete(c.value) : set.add(c.value)
                              updateMember(m.id, { conditions: Array.from(set) })
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                              active
                                ? 'bg-[#b8125d] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-600">Age at dx:</span>
                      <input
                        type="number"
                        placeholder="Age"
                        value={m.age_at_diagnosis ?? ''}
                        onChange={(e) =>
                          updateMember(m.id, {
                            age_at_diagnosis:
                              e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="h-7 w-20 rounded-md border border-slate-200 bg-white px-2 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="sticky bottom-6 flex justify-end">
        <button
          type="button"
          onClick={savePedigree}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-base font-semibold bg-[#b8125d] text-white hover:bg-[#9d0f4e] shadow-lg transition"
        >
          <Save size={18} />
          <span>Save Pedigree &amp; Link to Decision Support</span>
        </button>
      </div>
    </div>
  )
}

/** Live SVG Canvas implementation matching Histone buildLayout */
function LivePedigreeCanvas({ pedigree }: { pedigree: PedigreeData }) {
  const layout = useMemo(() => {
    const W = 900
    const H = 400
    const rowY = { g1: 50, g2: 150, g3: 250, g4: 350 }
    const nodes: any[] = []
    const lines: any[] = []

    const get = (rel: string) => pedigree.members.find((m) => m.relation === rel)
    const many = (rel: string) => pedigree.members.filter((m) => m.relation === rel)

    const put = (m: PedigreeMember | undefined, x: number, y: number) => {
      if (!m) return null
      const n = {
        x,
        y,
        sex: m.sex,
        affected: m.affected,
        deceased: m.deceased,
        proband: m.relation === 'proband',
        short: (m.label || m.relation.replace(/_/g, ' ').slice(0, 10)) + (m.age ? ` (${m.age})` : ''),
      }
      nodes.push(n)
      return n
    }

    // Gen 1: Grandparents
    const pgf = put(get('paternal_grandfather'), 200, rowY.g1)
    const pgm = put(get('paternal_grandmother'), 280, rowY.g1)
    const mgf = put(get('maternal_grandfather'), 620, rowY.g1)
    const mgm = put(get('maternal_grandmother'), 700, rowY.g1)
    if (pgf && pgm) lines.push({ x1: pgf.x + 16, y1: pgf.y, x2: pgm.x - 16, y2: pgm.y })
    if (mgf && mgm) lines.push({ x1: mgf.x + 16, y1: mgf.y, x2: mgm.x - 16, y2: mgm.y })

    // Gen 2: Parents & Aunts/Uncles
    const patAunts = many('paternal_uncle_aunt')
    const matAunts = many('maternal_uncle_aunt')
    const father = put(get('father'), 340, rowY.g2)
    const mother = put(get('mother'), 560, rowY.g2)
    patAunts.forEach((m, i) => put(m, 100 + i * 45, rowY.g2))
    matAunts.forEach((m, i) => put(m, 760 + i * 45, rowY.g2))

    if (father && pgf && pgm) {
      const mid = (pgf.x + pgm.x) / 2
      lines.push({ x1: mid, y1: pgf.y + 8, x2: mid, y2: rowY.g2 - 30 })
      lines.push({ x1: mid, y1: rowY.g2 - 30, x2: father.x, y2: rowY.g2 - 30 })
      lines.push({ x1: father.x, y1: rowY.g2 - 30, x2: father.x, y2: father.y - 16 })
    }
    if (mother && mgf && mgm) {
      const mid = (mgf.x + mgm.x) / 2
      lines.push({ x1: mid, y1: mgf.y + 8, x2: mid, y2: rowY.g2 - 30 })
      lines.push({ x1: mid, y1: rowY.g2 - 30, x2: mother.x, y2: rowY.g2 - 30 })
      lines.push({ x1: mother.x, y1: rowY.g2 - 30, x2: mother.x, y2: mother.y - 16 })
    }
    if (father && mother) {
      lines.push({ x1: father.x + 16, y1: father.y, x2: mother.x - 16, y2: mother.y })
    }

    // Gen 3: Proband & Siblings
    const siblings = many('sibling')
    const total = 1 + siblings.length
    const startX = 450 - ((total - 1) * 60) / 2
    const proband = put(get('proband'), startX, rowY.g3)
    const sibNodes = siblings.map((s, i) => put(s, startX + (i + 1) * 60, rowY.g3))

    if (proband && father && mother) {
      const midParent = (father.x + mother.x) / 2
      const busY = rowY.g3 - 30
      lines.push({ x1: midParent, y1: father.y + 16, x2: midParent, y2: busY })
      const xs = [proband, ...sibNodes].filter(Boolean).map((n) => n!.x)
      xs.forEach((x) => {
        lines.push({ x1: x, y1: busY, x2: x, y2: rowY.g3 - 16 })
      })
      if (xs.length > 1) {
        lines.push({ x1: Math.min(...xs), y1: busY, x2: Math.max(...xs), y2: busY })
      }
    }

    // Gen 4: Children
    const children = many('child')
    if (proband && children.length) {
      const startCX = proband.x - ((children.length - 1) * 60) / 2
      const busY = rowY.g4 - 30
      lines.push({ x1: proband.x, y1: proband.y + 16, x2: proband.x, y2: busY })
      children.forEach((c, i) => {
        const cx = startCX + i * 60
        put(c, cx, rowY.g4)
        lines.push({ x1: cx, y1: busY, x2: cx, y2: rowY.g4 - 16 })
      })
      if (children.length > 1) {
        const xs = children.map((_, i) => startCX + i * 60)
        lines.push({ x1: Math.min(...xs), y1: busY, x2: Math.max(...xs), y2: busY })
      }
    }

    return { width: W, height: H, nodes, lines }
  }, [pedigree])

  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full h-[290px] bg-slate-50 rounded-md">
      {layout.lines.map((l: any, i: number) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#64748b" strokeWidth="1.5" />
      ))}
      {layout.nodes.map((n: any, i: number) => (
        <g key={i} transform={`translate(${n.x}, ${n.y})`}>
          {n.sex === 'M' ? (
            <rect
              x={-16}
              y={-16}
              width={32}
              height={32}
              fill={n.affected ? '#b8125d' : '#ffffff'}
              stroke="#334155"
              strokeWidth="1.5"
            />
          ) : n.sex === 'F' ? (
            <circle
              r={16}
              fill={n.affected ? '#b8125d' : '#ffffff'}
              stroke="#334155"
              strokeWidth="1.5"
            />
          ) : (
            <polygon
              points="0,-18 18,0 0,18 -18,0"
              fill={n.affected ? '#b8125d' : '#ffffff'}
              stroke="#334155"
              strokeWidth="1.5"
            />
          )}
          {n.deceased && (
            <line x1={-18} y1={-18} x2={18} y2={18} stroke="#334155" strokeWidth="1.5" />
          )}
          {n.proband && (
            <text x={0} y={30} textAnchor="middle" fontSize="11" fill="#b8125d" fontWeight="bold">
              P
            </text>
          )}
          <text x={0} y={-22} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
            {n.short}
          </text>
        </g>
      ))}
    </svg>
  )
}
