import 'server-only'
import { isDeepStrictEqual } from 'node:util'
import type { PathwaySlug } from './decision-engine'
import { FORM_FIELDS, type InputField } from './form-fields'
import { contentSnapshot, digest } from './workflow-governance'
import type { GovernedCriterion, Guideline } from './workflow-store'

export type ClinicalOutcome = 'urgent_referral' | 'routine_referral' | 'no_referral_needed' | 'borderline_consideration'
export type CriteriaOutcome = ClinicalOutcome | 'insufficient_information' | 'criteria_pending_approval'
type Primitive = string | number | boolean
export type CriteriaSource = {
  title: string; org: string; guidelineVersion: string; date: string
  page: string | null; section: string | null; url: string
}
export type ServiceCriterion = {
  id: string; pathway: PathwaySlug; status: 'ACTIVE'; approvedAt: string; reviewer: string
  effectiveDate: string; reviewDate: string; simulated: false; sources: CriteriaSource[]
  conditions: { field: string; op: 'eq'; value: Primitive }[]; requiredFields: string[]
  exclusions: []; outcome: ClinicalOutcome; destination: string; rationale: string; version: string
}
export type CriteriaRequest = {
  schemaVersion: '1.0'; pathway: PathwaySlug; evaluatedAt: string
  facts: Record<string, Primitive | null>; criteria: ServiceCriterion[]
}
export type CriteriaEvaluation = {
  schemaVersion: '1.0'; engineVersion: string; pathway: PathwaySlug; timestamp: string
  outcome: CriteriaOutcome; reasonCode: string; rationale: string; destinations: string[]
  matchedCriteria: { id: string; version: string; outcome: ClinicalOutcome }[]
  missingFields: string[]
  criteriaSnapshots: {
    index: number; criteria: ServiceCriterion | null; eligible: boolean
    eligibilityReasons: string[]; evaluation: 'not_evaluated' | 'matched' | 'unmatched' | 'unresolved'
    missingFields: string[]
  }[]
  sourceCitations: { criteriaId: string; source: CriteriaSource }[]
  criteriaVersions: { id: string; version: string }[]; reviewPending: boolean
  validationErrors: { path: string; message: string }[]
}
export type ApprovedRule = { criterion: GovernedCriterion; guideline: Guideline }
const CLINICAL_OUTCOMES: ClinicalOutcome[] = ['urgent_referral', 'routine_referral', 'no_referral_needed', 'borderline_consideration']
const SERVICE_REASONS = ['invalid_input', 'no_eligible_criteria', 'conflicting_criteria', 'incomplete_potential_match', 'no_match', 'matched_criteria']
const ELIGIBILITY_REASONS = ['not_active', 'approval_missing', 'approval_in_future', 'not_yet_effective', 'review_due', 'different_pathway', 'invalid_criteria', 'invalid_evaluation_time']
const TIMEOUT_MS = 5000
const MAX_REQUEST_BYTES = 1_048_576
const MAX_RESPONSE_BYTES = 4_194_304

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function text(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim() && value.length <= 8192 && !/[\uD800-\uDFFF]/u.test(value)
}
function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && !/[\uD800-\uDFFF]/u.test(item))
}
export class CriteriaMappingError extends Error {
  constructor(public missingFields: string[] = []) { super('Approved criteria or assessment facts are incomplete.') }
}
function requiredText(value: unknown): string {
  if (!text(value)) throw new CriteriaMappingError()
  return value
}
function instant(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new CriteriaMappingError()
  return new Date(value).toISOString()
}
function day(value: unknown): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value) return value
  return instant(value).slice(0, 10)
}
function approval(doc: GovernedCriterion | Guideline, criterion: boolean) {
  const approved = doc.approvedSnapshot
  if (!object(approved) || doc.lifecycle !== 'ACTIVE' || doc.simulated !== false || !doc.approvalDigest || digest(approved) !== doc.approvalDigest) throw new CriteriaMappingError()
  const content = contentSnapshot(doc as unknown as Record<string, unknown>, criterion)
  if (digest(content) !== digest(contentSnapshot(approved, criterion))) throw new CriteriaMappingError()
  const event = Array.isArray(doc.governanceHistory) ? [...doc.governanceHistory].reverse().find((entry) => entry.to === 'APPROVED') : undefined
  if (!event || event.contentDigest !== digest(content)) throw new CriteriaMappingError()
  return { content: approved, reviewer: requiredText(event.actor), approvedAt: instant(event.at) }
}
function fact(field: InputField, value: unknown): Primitive | null {
  if (value === undefined || value === null || value === '') return null
  if (field.type === 'checkbox' && typeof value === 'boolean') return value
  if (field.type === 'select' && typeof value === 'string' && field.options?.some(([option]) => option === value)) return value
  // The form stores numbers as strings. Normalize only schema-declared number
  // fields, on BOTH sides of eq; never coerce select strings or checkbox values.
  if (field.type === 'number' && (typeof value === 'number' || (typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))) && Number.isFinite(Number(value))) return Number(value)
  throw new CriteriaMappingError([field.key])
}

/** Only approved record data becomes executable conditions; triggerKey is never used. */
export function prepareCriteriaRequest(pathway: string, inputs: Record<string, unknown>, rules: ApprovedRule[], evaluatedAt: string): CriteriaRequest {
  const fields = Object.hasOwn(FORM_FIELDS, pathway) ? FORM_FIELDS[pathway] : undefined
  if (!fields || !object(inputs) || rules.length > 250) throw new CriteriaMappingError()
  const facts: CriteriaRequest['facts'] = {}
  // Free-text fields can contain PHI. They are neither transmitted nor eligible
  // for automated matching; a rule depending on one requires manual review.
  for (const field of fields.filter((item) => ['checkbox', 'select', 'number'].includes(item.type))) facts[field.key] = fact(field, inputs[field.key])
  const ids = new Set<string>()
  const criteria = rules.map(({ criterion, guideline }): ServiceCriterion => {
    const c = approval(criterion, true)
    const g = approval(guideline, false)
    for (const key of ['code', 'title', 'guidelineCitation']) requiredText(c.content[key])
    if (!criterion.approvalAttested || c.content.pathwaySlug !== pathway || ids.has(criterion.id)) throw new CriteriaMappingError()
    ids.add(criterion.id)
    const frozen = c.content.guidelineSnapshot
    const guidelineId = typeof c.content.guideline === 'string' ? c.content.guideline : object(c.content.guideline) ? c.content.guideline.id : null
    if (guidelineId !== guideline.id || !object(frozen) || frozen.id !== guideline.id || frozen.approvalDigest !== guideline.approvalDigest || !isDeepStrictEqual(frozen.content, g.content)) throw new CriteriaMappingError()
    if (Date.parse(g.approvedAt) > Date.parse(c.approvedAt) || Date.parse(c.approvedAt) > Date.parse(evaluatedAt)) throw new CriteriaMappingError()
    if (!Array.isArray(c.content.conditions) || !c.content.conditions.length || c.content.conditions.length > 100) throw new CriteriaMappingError()
    const seen = new Set<string>()
    const conditions = c.content.conditions.map((condition): ServiceCriterion['conditions'][number] => {
      if (!object(condition) || Object.keys(condition).some((key) => !['field', 'equals'].includes(key))) throw new CriteriaMappingError()
      const field = fields.find((item) => item.key === condition.field)
      if (!field || !['checkbox', 'select', 'number'].includes(field.type) || seen.has(field.key)) throw new CriteriaMappingError(field ? [field.key] : [])
      seen.add(field.key)
      const value = fact(field, condition.equals)
      if (value === null) throw new CriteriaMappingError([field.key])
      return { field: field.key, op: 'eq', value }
    })
    const outcomes: Record<string, ClinicalOutcome> = { urgent: 'urgent_referral', routine: 'routine_referral', borderline: 'borderline_consideration', none: 'no_referral_needed' }
    const outcome = outcomes[requiredText(c.content.urgencyOutcome)]
    if (!outcome || !CLINICAL_OUTCOMES.includes(outcome)) throw new CriteriaMappingError()
    const url = new URL(requiredText(g.content.sourceURL))
    if (url.protocol !== 'https:' || url.username || url.password) throw new CriteriaMappingError()
    const effectiveDate = [day(c.content.effectiveFrom), day(g.content.effectiveFrom)].sort().at(-1)!
    const reviewDate = [day(c.content.reviewDueAt), day(g.content.reviewDueAt)].sort()[0]
    if (effectiveDate >= reviewDate) throw new CriteriaMappingError()
    return {
      id: requiredText(criterion.id), pathway: pathway as PathwaySlug, status: 'ACTIVE',
      approvedAt: c.approvedAt, reviewer: c.reviewer, effectiveDate, reviewDate, simulated: false,
      sources: [{ title: requiredText(g.content.sourceDocument), org: requiredText(g.content.sourceOrganization),
        guidelineVersion: requiredText(g.content.sourceVersion), date: day(g.content.publishedAt),
        page: null, section: requiredText(g.content.sourceSection), url: url.href }],
      conditions, requiredFields: [...seen],
      // Governance exclusions are prose, not machine conditions. Never parse them
      // as code or invent a trigger. Their approved text remains in the snapshot.
      exclusions: [], outcome, destination: requiredText(c.content.referralTarget),
      rationale: requiredText(c.content.plainLanguageRationale), version: requiredText(c.content.versionNumber),
    }
  })
  return { schemaVersion: '1.0', pathway: pathway as PathwaySlug, evaluatedAt: instant(evaluatedAt), facts, criteria }
}

/** Operational safety envelope only, never an alternative clinical evaluator. */
export function manualCriteriaResult(request: CriteriaRequest, outcome: 'insufficient_information' | 'criteria_pending_approval', reasonCode: string, missingFields: string[] = []): CriteriaEvaluation {
  return {
    schemaVersion: '1.0', engineVersion: 'not_evaluated', pathway: request.pathway, timestamp: request.evaluatedAt,
    outcome, reasonCode, rationale: outcome === 'criteria_pending_approval'
      ? 'No active approved criteria are available. Manual clinical review is required.'
      : 'A complete approved criteria evaluation is unavailable. Manual clinical review is required; no automated recommendation was made.',
    destinations: [], matchedCriteria: [], missingFields: [...new Set(missingFields)].sort(),
    criteriaSnapshots: request.criteria.map((criterion, index) => ({ index, criteria: criterion, eligible: false, eligibilityReasons: ['not_evaluated'], evaluation: 'not_evaluated', missingFields: [] })),
    sourceCitations: request.criteria.flatMap((criterion) => criterion.sources.map((source) => ({ criteriaId: criterion.id, source }))),
    criteriaVersions: request.criteria.map(({ id, version }) => ({ id, version })),
    reviewPending: true, validationErrors: [{ path: 'evaluation', message: 'Manual clinical review is required.' }],
  }
}

function validateResponse(value: unknown, request: CriteriaRequest): CriteriaEvaluation {
  if (!object(value) || value.schemaVersion !== '1.0' || value.engineVersion !== '1.0.0' || value.pathway !== request.pathway || value.timestamp !== request.evaluatedAt ||
    ![...CLINICAL_OUTCOMES, 'insufficient_information', 'criteria_pending_approval'].includes(value.outcome as ClinicalOutcome) ||
    !SERVICE_REASONS.includes(value.reasonCode as string) || !text(value.rationale) || !stringList(value.destinations) || !stringList(value.missingFields) ||
    !value.missingFields.every((field) => Object.hasOwn(request.facts, field)) || typeof value.reviewPending !== 'boolean' ||
    !Array.isArray(value.matchedCriteria) || !Array.isArray(value.criteriaSnapshots) || !Array.isArray(value.sourceCitations) || !Array.isArray(value.criteriaVersions) || !Array.isArray(value.validationErrors)) throw new Error('Invalid service response')
  for (const error of value.validationErrors) if (!object(error) || !text(error.path) || !text(error.message)) throw new Error('Invalid validation error')
  const expectedVersions = request.criteria.map(({ id, version }) => ({ id, version }))
  const expectedSources = request.criteria.flatMap((criterion) => criterion.sources.map((source) => ({ criteriaId: criterion.id, source })))
  if (!isDeepStrictEqual(value.criteriaVersions, expectedVersions) || !isDeepStrictEqual(value.sourceCitations, expectedSources) || value.criteriaSnapshots.length !== request.criteria.length) throw new Error('Unexpected provenance')
  const matchedIds = new Set<string>()
  for (const match of value.matchedCriteria) {
    if (!object(match)) throw new Error('Invalid match')
    const criterion = request.criteria.find((item) => item.id === match.id)
    if (!criterion || match.version !== criterion.version || match.outcome !== criterion.outcome || matchedIds.has(criterion.id)) throw new Error('Unexpected match')
    matchedIds.add(criterion.id)
  }
  for (const [index, snapshot] of value.criteriaSnapshots.entries()) {
    if (!object(snapshot) || snapshot.index !== index || !isDeepStrictEqual(snapshot.criteria, request.criteria[index]) || typeof snapshot.eligible !== 'boolean' ||
      !stringList(snapshot.eligibilityReasons) || !snapshot.eligibilityReasons.every((reason) => ELIGIBILITY_REASONS.includes(reason)) ||
      !['not_evaluated', 'matched', 'unmatched', 'unresolved'].includes(snapshot.evaluation as string) || !stringList(snapshot.missingFields) ||
      !snapshot.missingFields.every((field) => Object.hasOwn(request.facts, field)) ||
      matchedIds.has(request.criteria[index].id) !== (snapshot.evaluation === 'matched') || (snapshot.evaluation === 'matched' && snapshot.eligible !== true)) throw new Error('Invalid criteria snapshot')
  }
  if (value.validationErrors.length && value.outcome !== 'insufficient_information') throw new Error('Unsafe validation outcome')
  if (value.outcome === 'no_referral_needed' && (value.missingFields.length || !value.matchedCriteria.length)) throw new Error('Incomplete negative outcome')
  if (['urgent_referral', 'routine_referral', 'no_referral_needed'].includes(value.outcome as string) && !value.matchedCriteria.some((match) => object(match) && match.outcome === value.outcome)) throw new Error('Missing outcome evidence')
  if (['insufficient_information', 'criteria_pending_approval', 'borderline_consideration'].includes(value.outcome as string) && value.reviewPending !== true) throw new Error('Missing review flag')
  // Return only the canonical v1 envelope: unknown response fields never enter a
  // persisted snapshot or its digest (including a service's incidental clock).
  return {
    schemaVersion: '1.0', engineVersion: '1.0.0', pathway: request.pathway, timestamp: request.evaluatedAt,
    outcome: value.outcome as CriteriaOutcome, reasonCode: value.reasonCode as string, rationale: value.rationale,
    destinations: value.destinations,
    matchedCriteria: value.matchedCriteria.map((match) => ({ id: match.id, version: match.version, outcome: match.outcome })),
    missingFields: value.missingFields,
    criteriaSnapshots: value.criteriaSnapshots.map((snapshot, index) => ({
      index, criteria: request.criteria[index], eligible: snapshot.eligible,
      eligibilityReasons: snapshot.eligibilityReasons, evaluation: snapshot.evaluation, missingFields: snapshot.missingFields,
    })),
    sourceCitations: expectedSources, criteriaVersions: expectedVersions,
    reviewPending: value.reviewPending, validationErrors: value.validationErrors.map((error) => ({ path: error.path, message: error.message })),
  }
}

export async function evaluateCriteriaService(request: CriteriaRequest): Promise<CriteriaEvaluation> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let reason = 'service_unavailable'
  try {
    const key = process.env.CRITERIA_SERVICE_API_KEY
    const origin = new URL(process.env.CRITERIA_SERVICE_URL ?? '')
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
    if (!key || Buffer.byteLength(key, 'utf8') < 32 || key.trim() !== key || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/' ||
      (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && loopback))) throw new Error('Service configuration unavailable')
    const body = JSON.stringify(request)
    if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) throw new Error('Request exceeds limit')
    const response = await fetch(new URL('/evaluate', origin), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Criteria-API-Key': key },
      body, signal: controller.signal, cache: 'no-store', redirect: 'error',
    })
    if (!response.ok) throw new Error('Service request failed')
    reason = 'invalid_service_response'
    if (response.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' || !response.body) throw new Error('Expected JSON response')
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error('Response exceeds limit') }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
    const raw = Buffer.concat(chunks).toString('utf8')
    return validateResponse(JSON.parse(raw), request)
  } catch {
    // Never log payloads, patient data, credentials, response bodies or errors.
    return manualCriteriaResult(request, 'insufficient_information', reason,
      request.criteria.flatMap((criterion) => criterion.requiredFields.filter((field) => request.facts[field] == null)))
  } finally { clearTimeout(timeout) }
}
