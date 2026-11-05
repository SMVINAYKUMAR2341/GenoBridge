export type Sex = 'male' | 'female' | 'unknown'
export type PregnancyOutcome =
  | 'liveborn'
  | 'ongoing'
  | 'miscarriage'
  | 'elective-abortion'
  | 'stillbirth'
export type ConditionStatus = 'affected' | 'carrier'
export interface PedigreeCondition {
  name: string
  status: ConditionStatus
}
export interface PedigreePerson {
  id: string
  name: string
  generation: 1 | 2 | 3
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
/** One or two parents; two parents also represent a partner relationship, even without children. */
export interface PedigreeFamily {
  id: string
  parents: string[]
  children: string[]
  consanguineous: boolean
}
export interface PedigreeModel {
  version: 1
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
]

/** Dependency-free, server-safe parser. Unknown fields are stripped; never trusts JSON casts. */
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
    v.version !== 1 ||
    v.sourceVerification !== 'pending' ||
    !texts(v, ['title']) ||
    !Array.isArray(v.people) ||
    !Array.isArray(v.families)
  )
    return {
      success: false,
      errors: [
        'Expected a version 1 pedigree with pending source verification, title, people and families.',
      ],
    }
  if (v.people.length > 100 || v.families.length > 100)
    return { success: false, errors: ['Maximum 100 people and 100 relationships.'] }
  const errors: string[] = []
  const people: PedigreePerson[] = []
  for (const p of v.people) {
    if (
      !record(p) ||
      !texts(p, ['id', 'name', 'branch', 'age', 'ageAtDeath', 'causeOfDeath', 'notes']) ||
      !p.id ||
      !(p.name as string).trim() ||
      ![1, 2, 3].includes(p.generation as number) ||
      !['male', 'female', 'unknown'].includes(p.sex as string) ||
      !outcomes.includes(p.outcome as PregnancyOutcome) ||
      !['deceased', 'proband', 'consultand'].every((k) => typeof p[k] === 'boolean') ||
      !nullableInt(p.gestationalWeeks, 45) ||
      !nullableInt(p.gestationalDays, 6) ||
      !Array.isArray(p.conditions) ||
      p.conditions.length > 30 ||
      !p.conditions.every(
        (c) =>
          record(c) &&
          texts(c, ['name']) &&
          (c.name as string).trim() &&
          ['affected', 'carrier'].includes(c.status as string),
      )
    ) {
      errors.push(
        'Invalid person: require name, sex, generation 1–3, flags, outcome and valid gestational age (weeks 0–45, days 0–6).',
      )
      continue
    }
    people.push({
      id: p.id as string,
      name: p.name as string,
      branch: p.branch as string,
      age: p.age as string,
      ageAtDeath: p.ageAtDeath as string,
      causeOfDeath: p.causeOfDeath as string,
      notes: p.notes as string,
      generation: p.generation as PedigreePerson['generation'],
      sex: p.sex as Sex,
      outcome: p.outcome as PregnancyOutcome,
      deceased: p.deceased as boolean,
      proband: p.proband as boolean,
      consultand: p.consultand as boolean,
      gestationalWeeks: p.gestationalWeeks as number | null,
      gestationalDays: p.gestationalDays as number | null,
      conditions: p.conditions.map((c) => ({ name: c.name, status: c.status })),
    })
  }
  const ids = new Set(people.map((p) => p.id))
  if (ids.size !== people.length) errors.push('Person IDs must be unique.')
  for (const flag of ['proband', 'consultand'] as const)
    if (people.filter((p) => p[flag]).length > 1) errors.push(`Only one ${flag} is allowed.`)
  const families: PedigreeFamily[] = []
  const familyIds = new Set<string>(),
    pairs = new Set<string>(),
    children = new Set<string>()
  for (const f of v.families) {
    if (
      !record(f) ||
      !texts(f, ['id']) ||
      !f.id ||
      !Array.isArray(f.parents) ||
      ![1, 2].includes(f.parents.length) ||
      !Array.isArray(f.children) ||
      f.children.length > 100 ||
      ![...f.parents, ...f.children].every((id) => typeof id === 'string' && ids.has(id)) ||
      typeof f.consanguineous !== 'boolean'
    ) {
      errors.push('Relationship must reference one or two existing parents and existing children.')
      continue
    }
    const parents = f.parents as string[],
      kids = f.children as string[]
    const pair = JSON.stringify([...parents].sort())
    if (familyIds.has(f.id as string) || pairs.has(pair))
      errors.push(
        'Duplicate relationship ID or parent group; edit the existing relationship instead.',
      )
    familyIds.add(f.id as string)
    pairs.add(pair)
    if (new Set([...parents, ...kids]).size !== parents.length + kids.length)
      errors.push('Relationships cannot repeat a person or include a parent as their own child.')
    const generation = people.find((p) => p.id === parents[0])?.generation
    if (parents.some((id) => people.find((p) => p.id === id)?.generation !== generation))
      errors.push('Partners must be in the same generation.')
    if (parents.some((id) => people.find((p) => p.id === id)?.outcome !== 'liveborn'))
      errors.push('Pregnancy and loss entries cannot be parents or partners.')
    if (f.consanguineous && parents.length !== 2)
      errors.push('Consanguinity requires two partners.')
    for (const id of kids) {
      if (people.find((p) => p.id === id)?.generation !== Number(generation) + 1)
        errors.push(
          'Children must be exactly one generation below their parents (maximum three generations).',
        )
      if (children.has(id))
        errors.push('A child can belong to only one parent group; add siblings to that group.')
      children.add(id)
    }
    families.push({
      id: f.id as string,
      parents: [...parents],
      children: [...kids],
      consanguineous: f.consanguineous,
    })
  }
  return errors.length
    ? { success: false, errors: [...new Set(errors)] }
    : {
        success: true,
        data: {
          version: 1,
          title: v.title as string,
          sourceVerification: 'pending',
          people,
          families,
        },
      }
}
export function createPedigreePerson(id: string, generation: 1 | 2 | 3 = 1): PedigreePerson {
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
  const people = Array.from({ length: 7 }, (_, i) => ({
    ...createPedigreePerson(`demo-${i + 1}`, i < 2 ? 1 : i < 5 ? 2 : 3),
    name: `Synthetic ${i + 1}`,
    sex: (i % 2 ? 'female' : 'male') as Sex,
  }))
  people[2].proband = true
  people[3].consultand = true
  people[5].conditions = [{ name: 'Example condition', status: 'affected' }]
  return {
    ...createEmptyPedigree(),
    title: 'Synthetic three-generation example',
    people,
    families: [
      {
        id: 'demo-family-1',
        parents: ['demo-1', 'demo-2'],
        children: ['demo-3', 'demo-4'],
        consanguineous: false,
      },
      {
        id: 'demo-family-2',
        parents: ['demo-4', 'demo-5'],
        children: ['demo-6', 'demo-7'],
        consanguineous: true,
      },
    ],
  }
}
