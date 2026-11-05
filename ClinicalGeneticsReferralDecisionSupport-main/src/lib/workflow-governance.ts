import { createHash } from 'node:crypto'
import type { Field, PayloadRequest } from 'payload'
import { serverOwned } from '../access/clinical'
import { FORM_FIELDS } from './form-fields'
import { WorkflowError, object, text } from './workflow-security'
import { workflowStore, type Governance, type Guideline, type GovernedCriterion, type Lifecycle } from './workflow-store'

export const LIFECYCLES: Lifecycle[] = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'RETIRED']
export const GOVERNANCE_EDIT_FIELDS = [
  'sourceURL', 'sourceOrganization', 'sourceDocument', 'sourceVersion', 'publishedAt',
  'sourceSection', 'jurisdiction', 'population', 'applicability', 'exclusions', 'evidenceLevel',
  'recommendationGrade', 'provenance', 'validationEvidence', 'effectiveFrom', 'reviewDueAt',
  'simulated', 'changeReason',
] as const
export const CRITERION_EDIT_FIELDS = [
  'title', 'code', 'pathwaySlug', 'triggerKey', 'urgencyOutcome', 'referralTarget',
  'plainLanguageRationale', 'guidelineCitation', 'jargonTip', 'recommendedWorkup',
  'versionNumber', 'versionNotes', 'conditions', 'guideline',
  ...GOVERNANCE_EDIT_FIELDS,
] as const
export const GUIDELINE_EDIT_FIELDS = ['title', ...GOVERNANCE_EDIT_FIELDS] as const
const dates = ['publishedAt', 'effectiveFrom', 'reviewDueAt']
export const governanceFields: Field[] = [
  { name: 'lifecycle', type: 'select', options: LIFECYCLES, access: { create: serverOwned, update: serverOwned } },
  ...GOVERNANCE_EDIT_FIELDS.map((name): Field => name === 'simulated'
    ? { name, type: 'checkbox' }
    : { name, type: dates.includes(name) ? 'date' : 'textarea' }),
  { name: 'authoredBy', type: 'relationship', relationTo: 'users', access: { create: serverOwned, update: serverOwned } },
  ...['approvedSnapshot', 'governanceHistory'].map((name): Field => ({ name, type: 'json', access: { create: serverOwned, update: serverOwned } })),
  { name: 'approvalDigest', type: 'text', access: { create: serverOwned, update: serverOwned } },
]

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}
export function digest(value: unknown) { return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex') }
export function contentSnapshot(doc: Record<string, unknown>, criterion: boolean) {
  return Object.fromEntries((criterion ? CRITERION_EDIT_FIELDS : GUIDELINE_EDIT_FIELDS).map((key) => [key, doc[key] ?? null]))
}
export function validateGovernancePatch(input: unknown, criterion: boolean) {
  const data = object(input, criterion ? CRITERION_EDIT_FIELDS : GUIDELINE_EDIT_FIELDS, 'patch')
  for (const [key, value] of Object.entries(data)) {
    if (key === 'conditions') continue
    if (key === 'simulated') {
      if (typeof value !== 'boolean') throw new WorkflowError('Select whether this is simulated content.', key)
    } else if (value !== null && (typeof value !== 'string' || value.length > 8000)) {
      throw new WorkflowError('Invalid text field.', key)
    }
    if (dates.includes(key) && value && !Number.isFinite(Date.parse(value as string))) throw new WorkflowError('Invalid date.', key)
    if (key === 'sourceURL' && value) {
      let url: URL
      try { url = new URL(value as string) } catch { throw new WorkflowError('Enter an HTTPS source URL.', key) }
      if (url.protocol !== 'https:' || url.username || url.password) throw new WorkflowError('Enter an HTTPS source URL.', key)
    }
  }
  return { ...data }
}
export function validateConditions(doc: Record<string, unknown>, complete: boolean) {
  const fields = FORM_FIELDS[String(doc.pathwaySlug)]
  if (!fields) throw new WorkflowError('Select a supported pathway.', 'pathwaySlug')
  if (!Array.isArray(doc.conditions) || doc.conditions.length > 20 || (complete && !doc.conditions.length)) {
    if (!complete && doc.conditions == null) return
    throw new WorkflowError('Supply 1–20 explicit, validated trigger conditions before approval.', 'conditions')
  }
  const seen = new Set<string>()
  for (const value of doc.conditions) {
    const condition = object(value, ['field', 'equals'], 'conditions')
    const field = fields.find((f) => f.key === condition.field)
    if (!field || seen.has(field.key) || (field.type === 'checkbox'
      ? typeof condition.equals !== 'boolean'
      : typeof condition.equals !== 'string' || condition.equals.length > 2000 ||
        (field.options && !field.options.some(([key]) => key === condition.equals)) ||
        (field.type === 'number' && condition.equals !== '' && (!Number.isFinite(Number(condition.equals)) || Number(condition.equals) < 0 || Number(condition.equals) > 100)))) {
      throw new WorkflowError('Invalid or duplicate pathway condition.', 'conditions')
    }
    seen.add(field.key)
  }
}
export function assertComplete(doc: Governance & Record<string, unknown>, criterion: boolean) {
  const required = ['title', 'sourceSection', 'jurisdiction', 'population', 'applicability', 'exclusions', 'evidenceLevel',
    'recommendationGrade', 'provenance', 'validationEvidence', 'effectiveFrom', 'reviewDueAt', 'changeReason',
    ...(criterion ? ['guideline', 'versionNumber', 'referralTarget', 'plainLanguageRationale', 'guidelineCitation'] :
      ['sourceURL', 'sourceOrganization', 'sourceDocument', 'sourceVersion', 'publishedAt'])]
  for (const key of required) text(key === 'guideline' && typeof doc[key] === 'object' ? (doc[key] as { id?: string })?.id : doc[key], key, 8000)
  if (doc.simulated !== false) throw new WorkflowError('Simulated or unclassified content cannot be approved or activated.', 'simulated')
  if (!Number.isFinite(Date.parse(doc.effectiveFrom!)) || !Number.isFinite(Date.parse(doc.reviewDueAt!)) ||
      Date.parse(doc.effectiveFrom!) >= Date.parse(doc.reviewDueAt!) || Date.parse(doc.reviewDueAt!) <= Date.now()) {
    throw new WorkflowError('Set a valid effective date and a future review deadline.', 'reviewDueAt')
  }
  if (criterion) validateConditions(doc, true)
}
export function isActive(doc: Governance): boolean {
  return doc.lifecycle === 'ACTIVE' && doc.simulated === false && !!doc.approvedSnapshot &&
    !!doc.approvalDigest && digest(doc.approvedSnapshot) === doc.approvalDigest &&
    !!doc.effectiveFrom && Date.parse(doc.effectiveFrom) <= Date.now() &&
    !!doc.reviewDueAt && Date.parse(doc.reviewDueAt) > Date.now()
}
export async function activeGuideline(id: string, req: Pick<PayloadRequest, 'payload' | 'user'> & { context?: PayloadRequest['context'] }) {
  const guideline = await workflowStore(req.payload).findByID({
    collection: 'guideline-references', id, overrideAccess: false, user: req.user, depth: 0,
  })
  if (!isActive(guideline)) throw new WorkflowError('The referenced guideline is not active, approved and current.', 'guideline')
  return guideline
}
export async function assertActiveCriterion(criterion: GovernedCriterion, req: Pick<PayloadRequest, 'payload' | 'user'>) {
  if (!isActive(criterion) || !criterion.approvalAttested) throw new WorkflowError('Criteria are unapproved, expired or inactive.', 'criteria')
  assertComplete(criterion as unknown as Governance & Record<string, unknown>, true)
  const reference = typeof criterion.guideline === 'string' ? criterion.guideline : criterion.guideline?.id
  if (!reference) throw new WorkflowError('Missing guideline reference.', 'guideline')
  const guideline: Guideline = await activeGuideline(reference, req)
  const source = criterion.approvedSnapshot?.guidelineSnapshot as Record<string, unknown> | undefined
  if (!source || source.approvalDigest !== guideline.approvalDigest) throw new WorkflowError('The guideline no longer matches the approved source snapshot.', 'guideline')
  return guideline
}
