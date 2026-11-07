export type Sex = 'male' | 'female' | 'unknown'

export type GeneticStatus =
  | 'unaffected'
  | 'affected'
  | 'carrier'
  | 'suspected_carrier'
  | 'unknown'
  | 'not_assessed'

export type PregnancyOutcome =
  | 'liveborn'
  | 'ongoing'
  | 'miscarriage'
  | 'elective-abortion'
  | 'stillbirth'
  | 'pregnancy'

export type ConditionStatus = 'affected' | 'carrier' | 'unknown'

export interface PedigreeConditionItem {
  id?: string
  name: string
  status: ConditionStatus
  ageAtDiagnosis?: number | null
  notes?: string
}

export type PedigreeCondition = PedigreeConditionItem

export interface FamilyMember {
  id: string
  name: string
  relation: string
  generation: number
  sex: 'M' | 'F' | 'U'
  age: number | null
  dob?: string | null
  deceased: boolean
  ageAtDeath: number | null
  causeOfDeath?: string
  geneticStatus: GeneticStatus
  isProband: boolean
  isConsultand: boolean
  notes: string
  conditions: PedigreeConditionItem[]
  parentIds: string[]
  partnerIds: string[]
  childrenIds: string[]
  twinGroupId?: string | null
  twinType?: 'identical' | 'fraternal' | null
  adopted?: 'in' | 'out' | null
  pregnancyOutcome?: PregnancyOutcome | null
  canvasX?: number | null
  canvasY?: number | null
}

export interface FamilyRelationship {
  id: string
  type: 'partner' | 'parent_child' | 'twin'
  members: string[]
  consanguineous?: boolean
  notes?: string
}

export interface PedigreeDataModel {
  id: string
  title: string
  version: 2
  consanguinity: boolean
  ancestries: string[]
  notes: string
  members: FamilyMember[]
  relationships: FamilyRelationship[]
  canvasLayout?: {
    zoom: number
    panX: number
    panY: number
  }
  summary?: {
    totalMembers: number
    numGenerations: number
    affectedCount: number
    carrierCount: number
    unknownCount: number
  }
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------------------------------------------------
// Backward-Compatibility Interfaces for Legacy Assessment Flows
// ---------------------------------------------------------------------------
export interface PedigreePerson {
  id: string
  name: string
  generation: 1 | 2 | 3 | number
  sex: Sex
  branch: string
  age: string
  deceased: boolean
  ageAtDeath: string
  causeOfDeath: string
  proband: boolean
  consultand: boolean
  outcome: PregnancyOutcome
  gestationalWeeks: number | null
  gestationalDays: number | null
  conditions: PedigreeCondition[]
  notes: string
}

export interface PedigreeFamily {
  id: string
  parents: string[]
  children: string[]
  consanguineous: boolean
}

export interface PedigreeModel {
  version: 1 | 2
  title: string
  sourceVerification: 'pending'
  people: PedigreePerson[]
  families: PedigreeFamily[]
}

export type ParseResult<T> = { success: true; data: T } | { success: false; errors: string[] }

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

const texts = (v: Record<string, unknown>, keys: string[]) =>
  keys.every((k) => typeof v[k] === 'string' && (v[k] as string).length <= 2000)

const nullableInt = (v: unknown, max: number) =>
  v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max)

const outcomes: PregnancyOutcome[] = [
  'liveborn',
  'ongoing',
  'miscarriage',
  'elective-abortion',
  'stillbirth',
  'pregnancy',
]

/** Dependency-free, server-safe parser for legacy PedigreeModel */
export function parsePedigree(input: unknown): ParseResult<PedigreeModel> {
  let v: unknown = input
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v)
    } catch {
      return { success: false, errors: ['Invalid JSON.'] }
    }
  }
  if (
    !record(v) ||
    !texts(v, ['title']) ||
    !Array.isArray(v.people) ||
    !Array.isArray(v.families)
  )
    return {
      success: false,
      errors: ['Expected a pedigree model with title, people and families.'],
    }

  const people: PedigreePerson[] = []
  for (const p of v.people as any[]) {
    if (!record(p)) continue
    people.push({
      id: String(p.id || crypto.randomUUID()),
      name: String(p.name || 'Family Member'),
      branch: String(p.branch || ''),
      age: String(p.age || ''),
      ageAtDeath: String(p.ageAtDeath || ''),
      causeOfDeath: String(p.causeOfDeath || ''),
      notes: String(p.notes || ''),
      generation: Number(p.generation || 1),
      sex: (['male', 'female', 'unknown'].includes(String(p.sex)) ? String(p.sex) : 'unknown') as Sex,
      outcome: (outcomes.includes(String(p.outcome) as PregnancyOutcome) ? String(p.outcome) : 'liveborn') as PregnancyOutcome,
      deceased: Boolean(p.deceased),
      proband: Boolean(p.proband),
      consultand: Boolean(p.consultand),
      gestationalWeeks: typeof p.gestationalWeeks === 'number' ? p.gestationalWeeks : null,
      gestationalDays: typeof p.gestationalDays === 'number' ? p.gestationalDays : null,
      conditions: Array.isArray(p.conditions)
        ? p.conditions.map((c: any) => ({
            id: String(c.id || Math.random()),
            name: String(c.name || ''),
            status: c.status === 'carrier' ? 'carrier' : 'affected',
          }))
        : [],
    })
  }

  const families: PedigreeFamily[] = (v.families as any[]).map((f) => ({
    id: String(f.id || crypto.randomUUID()),
    parents: Array.isArray(f.parents) ? f.parents.map(String) : [],
    children: Array.isArray(f.children) ? f.children.map(String) : [],
    consanguineous: Boolean(f.consanguineous),
  }))

  return {
    success: true,
    data: {
      version: 1,
      title: String(v.title || 'Three-Generation Pedigree'),
      sourceVerification: 'pending',
      people,
      families,
    },
  }
}

export function createPedigreePerson(id: string, generation = 1): PedigreePerson {
  return {
    id,
    name: 'Unnamed person',
    generation,
    sex: 'unknown',
    branch: '',
    age: '',
    deceased: false,
    ageAtDeath: '',
    causeOfDeath: '',
    proband: false,
    consultand: false,
    outcome: 'liveborn',
    gestationalWeeks: null,
    gestationalDays: null,
    conditions: [],
    notes: '',
  }
}

export function createEmptyPedigree(): PedigreeModel {
  return {
    version: 1,
    title: 'Family pedigree',
    sourceVerification: 'pending',
    people: [],
    families: [],
  }
}

export function createDemoPedigree(): PedigreeModel {
  const people: PedigreePerson[] = [
    { ...createPedigreePerson('pgf', 1), name: 'Paternal Grandfather', sex: 'male' },
    { ...createPedigreePerson('pgm', 1), name: 'Paternal Grandmother', sex: 'female' },
    { ...createPedigreePerson('mgf', 1), name: 'Maternal Grandfather', sex: 'male' },
    { ...createPedigreePerson('mgm', 1), name: 'Maternal Grandmother', sex: 'female' },
    { ...createPedigreePerson('father', 2), name: 'Father', sex: 'male' },
    { ...createPedigreePerson('mother', 2), name: 'Mother', sex: 'female' },
    { ...createPedigreePerson('proband', 3), name: 'Proband (Patient)', sex: 'female', proband: true, consultand: true },
  ]
  return {
    version: 1,
    title: 'Synthetic three-generation example',
    sourceVerification: 'pending',
    people,
    families: [
      { id: 'f-pat', parents: ['pgf', 'pgm'], children: ['father'], consanguineous: false },
      { id: 'f-mat', parents: ['mgf', 'mgm'], children: ['mother'], consanguineous: false },
      { id: 'f-parents', parents: ['father', 'mother'], children: ['proband'], consanguineous: false },
    ],
  }
}

// ---------------------------------------------------------------------------
// Model Converters between FamilyMember and PedigreePerson
// ---------------------------------------------------------------------------
export function familyMembersToPedigreeModel(members: FamilyMember[], title = 'Three-Generation Clinical Pedigree'): PedigreeModel {
  const people: PedigreePerson[] = members.map((m) => ({
    id: m.id,
    name: m.name || m.relation.replace(/_/g, ' '),
    generation: m.generation,
    sex: m.sex === 'M' ? 'male' : m.sex === 'F' ? 'female' : 'unknown',
    branch: m.relation.startsWith('paternal') ? 'paternal' : m.relation.startsWith('maternal') ? 'maternal' : '',
    age: m.age ? String(m.age) : '',
    deceased: Boolean(m.deceased),
    ageAtDeath: m.ageAtDeath ? String(m.ageAtDeath) : '',
    causeOfDeath: m.causeOfDeath || '',
    proband: Boolean(m.isProband),
    consultand: Boolean(m.isConsultand),
    outcome: m.pregnancyOutcome || 'liveborn',
    gestationalWeeks: null,
    gestationalDays: null,
    conditions: m.conditions.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status === 'carrier' ? 'carrier' : 'affected',
    })),
    notes: m.notes || '',
  }))

  const families: PedigreeFamily[] = []
  // Form families based on parentIds and childrenIds
  const partnerPairs = new Map<string, { parents: string[]; children: Set<string> }>()
  for (const m of members) {
    if (m.partnerIds && m.partnerIds.length > 0) {
      for (const partnerId of m.partnerIds) {
        const key = [m.id, partnerId].sort().join('--')
        if (!partnerPairs.has(key)) {
          partnerPairs.set(key, { parents: [m.id, partnerId], children: new Set() })
        }
      }
    }
  }

  // Assign children to partner pairs or single parent
  for (const m of members) {
    if (m.parentIds && m.parentIds.length === 2) {
      const key = [...m.parentIds].sort().join('--')
      if (partnerPairs.has(key)) {
        partnerPairs.get(key)!.children.add(m.id)
      } else {
        partnerPairs.set(key, { parents: [...m.parentIds], children: new Set([m.id]) })
      }
    } else if (m.parentIds && m.parentIds.length === 1) {
      const key = `single--${m.parentIds[0]}`
      if (partnerPairs.has(key)) {
        partnerPairs.get(key)!.children.add(m.id)
      } else {
        partnerPairs.set(key, { parents: [m.parentIds[0]], children: new Set([m.id]) })
      }
    }
  }

  let famIdx = 1
  for (const [, group] of partnerPairs) {
    families.push({
      id: `fam_${famIdx++}`,
      parents: group.parents,
      children: Array.from(group.children),
      consanguineous: false,
    })
  }

  return {
    version: 1,
    title,
    sourceVerification: 'pending',
    people,
    families,
  }
}
