'use server'

import { randomUUID } from 'node:crypto'
import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'
import { digest, contentSnapshot, validateGovernancePatch, LIFECYCLES } from '@/lib/workflow-governance'
import { WORKFLOW_DECISIONS, suppressWorkflowCounts } from '@/lib/workflow-privacy'
import {
  workflowStore, payloadWorkflowUser, type Lifecycle, type WorkflowUser,
  type ClinicalWorkspaceUser, type ClinicalWorkspaceScan, type ClinicalWorkspaceResult, type WorkflowRecord,
} from '@/lib/workflow-store'
import { validateDraft } from '@/lib/workflow-validation'
import {
  workflowContext as signedWorkflowContext, identifier, object, revision, text, resultError, WorkflowError,
  isClinicalStaff, isProvider, isReviewer, isAppAdmin, type WorkflowCommand,
} from '@/lib/workflow-security'

async function currentActor() {
  const session = await appAuth.currentUser()
  if (!session) return null
  const payload = await getPayloadClient()
  const store = workflowStore(payload)
  // Read current permissions, not role/permission claims retained in an old JWT.
  const current = await store.findByID({ collection: 'users', id: session.id, overrideAccess: false, user: session, depth: 0 })
  if (current.enabled === false) return null
  if (!['provider', 'admin', 'nurse'].includes(current.role)) throw new WorkflowError('Staff account has no supported role.', 'auth')
  const user: WorkflowUser = { ...current, collection: 'users' }
  return { user, payload, store }
}
async function actor() {
  const current = await currentActor()
  if (!current) throw new WorkflowError('Sign in with an authorized staff account.', 'auth')
  return current
}
function workflowContext(user: WorkflowUser, command: WorkflowCommand) {
  return signedWorkflowContext(payloadWorkflowUser(user), command)
}
function workspaceUser(user: WorkflowUser): ClinicalWorkspaceUser {
  return {
    id: user.id, name: user.name, role: user.role, enabled: true,
    reviewerAuthorized: user.reviewerAuthorized === true,
    canReviewCriteria: isReviewer(user),
    clinicalQualification: user.clinicalQualification ?? null,
    reviewerQualification: user.reviewerQualification ?? null,
    reviewerAuthorizationExpiresAt: user.reviewerAuthorizationExpiresAt ?? null,
  }
}
const WORKSPACE_PAGE_SIZE = 100
const WORKSPACE_MAX_REVISIONS = 1000
function unqueriedScan(note: string): ClinicalWorkspaceScan {
  return { queried: false, recordsScanned: 0, totalRevisions: null, workflowsReturned: 0,
    maxRevisions: WORKSPACE_MAX_REVISIONS, complete: false, truncated: false, note }
}
function syntheticRecord(record: WorkflowRecord) {
  return !record.patient && typeof record.syntheticPatientReference === 'string' && /^SYN-[A-Za-z0-9_-]{1,90}$/.test(record.syntheticPatientReference)
}

/** No arguments. Read-only application data; existing collection audit hooks still apply.
 * Anonymous/disabled users get user:null and empty lists. ADMIN gets only its safe
 * staff profile, no patient/workflow queries. Clinical staff get at most 1,000 scanned
 * revisions (100/page), grouped by workflowKey, with only synthetic records returned.
 * scan.totalRevisions counts revisions, NOT workflows; scan is not an atomic snapshot.
 */
export async function loadClinicalWorkspaceAction(): Promise<ClinicalWorkspaceResult> {
  try {
    const current = await currentActor()
    if (!current) return { ok: true as const, user: null, patients: [], workflows: [] as WorkflowRecord[],
      scan: unqueriedScan('No active signed-in staff account; records were not queried.') }
    const { user, store } = current
    const safeUser = workspaceUser(user)
    if (isAppAdmin(user)) return { ok: true as const, user: safeUser, patients: [], workflows: [] as WorkflowRecord[],
      scan: unqueriedScan('ADMIN has aggregate-only clinical access; patient and workflow records were not queried.') }
    clinical(user)
    const latest = new Map<string, WorkflowRecord>()
    let recordsScanned = 0
    let totalRevisions = 0
    let hasMore = false
    for (let page = 1; recordsScanned < WORKSPACE_MAX_REVISIONS; page++) {
      const result = await store.find({ collection: 'clinical-workflows', overrideAccess: false, user, depth: 0,
        limit: Math.min(WORKSPACE_PAGE_SIZE, WORKSPACE_MAX_REVISIONS - recordsScanned), page,
        sort: ['-revision', '-id'] })
      if (page === 1) totalRevisions = result.totalDocs
      for (const record of result.docs) {
        const previous = latest.get(record.workflowKey)
        if (!previous || record.revision > previous.revision) latest.set(record.workflowKey, record)
      }
      recordsScanned += result.docs.length
      hasMore = result.hasNextPage
      if (!hasMore || !result.docs.length) break
    }
    const workflows = [...latest.values()].filter(syntheticRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.workflowKey.localeCompare(b.workflowKey))
    const scan: ClinicalWorkspaceScan = {
      queried: true, recordsScanned, totalRevisions, workflowsReturned: workflows.length,
      maxRevisions: WORKSPACE_MAX_REVISIONS, complete: !hasMore, truncated: hasMore,
      note: `${recordsScanned} revision rows scanned of ${totalRevisions} observed on the first page; totals count revisions, not distinct workflows. Only the latest observed synthetic revision per workflow is returned. ${hasMore ? 'The scan is bounded and incomplete. ' : ''}Concurrent writes can change paginated results; this is not an atomic snapshot.`,
    }
    return { ok: true as const, user: safeUser, patients: [], workflows, scan }
  } catch (error) { return resultError(error) }
}
function key(value: unknown) {
  const result = text(value, 'workflowKey', 36)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result)) throw new WorkflowError('Invalid workflow key.', 'workflowKey')
  return result
}
function clinical(user: unknown) {
  if (!isClinicalStaff(user)) throw new WorkflowError('Clinical staff access is required.', 'auth')
}
function reviewer(user: unknown) {
  if (!isReviewer(user)) throw new WorkflowError('A qualified provider with current explicit reviewer authorization is required.', 'auth')
}
function target(value: unknown) {
  if (value === 'criterion') return 'clinical-criteria' as const
  if (value === 'guideline') return 'guideline-references' as const
  throw new WorkflowError('Select criterion or guideline.', 'kind')
}

/** Full replacement of draft sections. Missing sections become empty, never demo defaults.
 * {workflowKey?: UUID, expectedRevision: 0|latest, draft: {patient?: null,
 * syntheticPatientReference: SYN-..., pathwaySlug, intake?, pedigree?, anc?, assessmentInputs?}}
 * Real patient links are disabled. pedigree/anc are {} or full parsed version 1 models.
 * Returns the saved immutable revision; retain workflowKey and revision for subsequent calls.
 */
export async function saveWorkflowDraftAction(input: unknown) {
  try {
    const data = object(input, ['workflowKey', 'expectedRevision', 'draft'])
    const { user, store } = await actor()
    clinical(user)
    const expected = revision(data.expectedRevision)
    if (!data.workflowKey && expected !== 0) throw new WorkflowError('A new draft starts at revision zero.', 'expectedRevision')
    const workflowKey = data.workflowKey ? key(data.workflowKey) : randomUUID()
    const draft = validateDraft(data.draft)
    const record = await store.create({ collection: 'clinical-workflows', overrideAccess: false, user,
      context: workflowContext(user, { kind: 'draft', key: workflowKey, revision: expected }), data: draft })
    return { ok: true as const, record }
  } catch (error) { return resultError(error) }
}

/** {workflowKey, expectedRevision, sections:{intake?, pedigree?, anc?, assessmentInputs?}}.
 * Replaces only supplied sections in the SAME workflow; omitted sections persist.
 * Useful for separate ANC/pedigree editors. A section itself is a full replacement.
 */
export async function saveWorkflowSectionsAction(input: unknown) {
  try {
    const data = object(input, ['workflowKey', 'expectedRevision', 'sections'])
    const sections = object(data.sections, ['intake', 'pedigree', 'anc', 'assessmentInputs'], 'sections')
    if (!Object.keys(sections).length) throw new WorkflowError('Supply at least one section.', 'sections')
    const workflowKey = key(data.workflowKey)
    const expected = revision(data.expectedRevision)
    const { user, store } = await actor()
    clinical(user)
    const latest = await store.find({ collection: 'clinical-workflows', overrideAccess: false, user, depth: 0,
      where: { workflowKey: { equals: workflowKey } }, sort: '-revision', limit: 1 })
    const current = latest.docs[0]
    if (!current || current.revision !== expected || current.state !== 'DRAFT') throw new WorkflowError('Load the current editable draft before saving sections.', 'expectedRevision')
    const draft = validateDraft({
      patient: current.patient, syntheticPatientReference: current.syntheticPatientReference, pathwaySlug: current.pathwaySlug,
      intake: current.intake, pedigree: current.pedigree, anc: current.anc, assessmentInputs: current.assessmentInputs,
      ...sections,
    })
    const record = await store.create({ collection: 'clinical-workflows', overrideAccess: false, user,
      context: workflowContext(user, { kind: 'draft', key: workflowKey, revision: expected }), data: draft })
    return { ok: true as const, record }
  } catch (error) { return resultError(error) }
}

/** {workflowKey, page?:1}; descending synthetic history (20 revisions/page).
 * Anonymous/disabled users get user:null and records:[]; ADMIN gets no records.
 */
export async function loadWorkflowAction(input: unknown) {
  try {
    const data = object(input, ['workflowKey', 'page'])
    const workflowKey = key(data.workflowKey)
    const page = data.page === undefined ? 1 : revision(data.page)
    if (page < 1 || page > 10000) throw new WorkflowError('Invalid history page.', 'page')
    const current = await currentActor()
    if (!current) return { ok: true as const, user: null, records: [] as WorkflowRecord[], page, hasNextPage: false }
    const { user, store } = current
    if (isAppAdmin(user)) return { ok: true as const, user: workspaceUser(user), records: [] as WorkflowRecord[], page, hasNextPage: false }
    clinical(user)
    const records = await store.find({ collection: 'clinical-workflows', overrideAccess: false, user, depth: 0,
      where: { workflowKey: { equals: workflowKey } }, sort: ['-revision', '-id'], limit: 20, page })
    if (!records.totalDocs || records.docs.some((record) => !syntheticRecord(record))) throw new WorkflowError('Synthetic workflow not found.', 'workflowKey')
    return { ok: true as const, user: workspaceUser(user), records: records.docs, page, hasNextPage: records.hasNextPage }
  } catch (error) { return resultError(error) }
}
async function appendWorkflow(input: unknown, kind: WorkflowCommand['kind']) {
  const fields = ['workflowKey', 'expectedRevision', 'reviewNote', ...(kind === 'finalize' ? ['attest', 'expectedEvaluationDigest'] : [])]
  const data = object(input, fields)
  const { user, store } = await actor()
  clinical(user)
  if (['review', 'finalize', 'return'].includes(kind) && !isProvider(user)) throw new WorkflowError('Only a gynecologist can clinically review or sign off.', 'auth')
  const reviewNote = text(data.reviewNote, 'reviewNote', 4000, true)
  if (kind === 'return' && !reviewNote) throw new WorkflowError('Explain what must be corrected.', 'reviewNote')
  if (kind === 'finalize' && data.attest !== true) throw new WorkflowError('Attest that you reviewed the persisted clinical data and server evaluation.', 'attest')
  const command: WorkflowCommand = {
    kind, key: key(data.workflowKey), revision: revision(data.expectedRevision),
    ...(kind === 'finalize' ? { attested: true, expectedEvaluationDigest: text(data.expectedEvaluationDigest, 'expectedEvaluationDigest', 64) } : {}),
  }
  const record = await store.create({ collection: 'clinical-workflows', overrideAccess: false, user,
    context: workflowContext(user, command), data: { reviewNote } })
  return { ok: true as const, record }
}
/** {workflowKey, expectedRevision}; nurses and providers only. */
export async function submitWorkflowAction(input: unknown) {
  try { return await appendWorkflow(input, 'submit') } catch (error) { return resultError(error) }
}
/** {workflowKey, expectedRevision, reviewNote?}; evaluates persisted data server-side. */
export async function reviewWorkflowAction(input: unknown) {
  try { return await appendWorkflow(input, 'review') } catch (error) { return resultError(error) }
}
/** {workflowKey, expectedRevision, reviewNote}; provider returns submitted work for correction. */
export async function returnWorkflowToDraftAction(input: unknown) {
  try { return await appendWorkflow(input, 'return') } catch (error) { return resultError(error) }
}
/** {workflowKey, expectedRevision, attest:true, expectedEvaluationDigest, reviewNote?}.
 * Does not accept an outcome, snapshot, signature, actor, or client engine result.
 * Re-evaluates and rejects changes since the last persisted review.
 */
export async function finalizeWorkflowAction(input: unknown) {
  try { return await appendWorkflow(input, 'finalize') } catch (error) { return resultError(error) }
}

/** {kind:'criterion'|'guideline', page?}; governance catalog, never patient data. */
export async function listGovernanceAction(input: unknown) {
  try {
    const data = object(input, ['kind', 'page'])
    const collection = target(data.kind)
    const page = data.page === undefined ? 1 : revision(data.page)
    if (page < 1 || page > 10000) throw new WorkflowError('Invalid page.', 'page')
    const current = await currentActor()
    if (!current) return { ok: true as const, user: null, records: [], hasNextPage: false, page }
    const { user, store } = current
    if (!isClinicalStaff(user) && !isAppAdmin(user)) throw new WorkflowError('Staff access required.', 'auth')
    const records = await store.find({ collection, overrideAccess: false, user, depth: 0, limit: 50, page, sort: '-updatedAt' })
    return { ok: true as const, user: workspaceUser(user), records: records.docs, hasNextPage: records.hasNextPage, page }
  } catch (error) { return resultError(error) }
}

/** {kind, id?, expectedUpdatedAt? (required when editing), patch}.
 * Fields are listed in CRITERION_EDIT_FIELDS / GUIDELINE_EDIT_FIELDS.
 * Lifecycle and approval data cannot be included in patch.
 */
export async function saveGovernanceDraftAction(input: unknown) {
  try {
    const data = object(input, ['kind', 'id', 'expectedUpdatedAt', 'patch'])
    const collection = target(data.kind)
    const patch = validateGovernancePatch(data.patch, collection === 'clinical-criteria')
    const { user, store } = await actor()
    reviewer(user)
    const id = data.id == null ? null : identifier(data.id)
    if (id) {
      const current = await store.findByID({ collection, id, overrideAccess: false, user, depth: 0 })
      if (text(data.expectedUpdatedAt, 'expectedUpdatedAt', 40) !== current.updatedAt) throw new WorkflowError('Record changed. Reload it.', 'expectedUpdatedAt')
      if (current.lifecycle && current.lifecycle !== 'DRAFT') throw new WorkflowError('Create a new revision to edit locked content.')
      const record = await store.update({ collection, id, overrideAccess: false, user,
        context: workflowContext(user, { kind: 'governance', target: `${collection}:${id}`, expectedDigest: digest({ id, updatedAt: current.updatedAt }) }), data: patch })
      return { ok: true as const, record }
    }
    const record = await store.create({ collection, overrideAccess: false, user,
      context: workflowContext(user, { kind: 'governance', target: `${collection}:new` }), data: { ...patch, lifecycle: 'DRAFT' } })
    return { ok: true as const, record }
  } catch (error) { return resultError(error) }
}

/** {kind, id, expectedUpdatedAt, to: Lifecycle}; no implicit approve-and-publish. */
export async function transitionGovernanceAction(input: unknown) {
  try {
    const data = object(input, ['kind', 'id', 'expectedUpdatedAt', 'to'])
    const collection = target(data.kind)
    const id = identifier(data.id)
    const to = text(data.to, 'to', 20) as Lifecycle
    if (!LIFECYCLES.includes(to)) throw new WorkflowError('Invalid lifecycle.', 'to')
    const { user, store } = await actor()
    reviewer(user)
    const current = await store.findByID({ collection, id, overrideAccess: false, user, depth: 0 })
    if (text(data.expectedUpdatedAt, 'expectedUpdatedAt', 40) !== current.updatedAt) throw new WorkflowError('Record changed. Reload it.', 'expectedUpdatedAt')
    const record = await store.update({ collection, id, overrideAccess: false, user,
      context: workflowContext(user, { kind: 'governance', target: `${collection}:${id}`, expectedDigest: digest({ id, updatedAt: current.updatedAt }) }), data: { lifecycle: to } })
    return { ok: true as const, record }
  } catch (error) { return resultError(error) }
}

/** {kind, id, patch}; clone into a NEW DRAFT. Criteria need a new unique code and versionNumber.
 * The source record and its approval snapshot remain intact.
 */
export async function createGovernanceRevisionAction(input: unknown) {
  try {
    const data = object(input, ['kind', 'id', 'patch'])
    const collection = target(data.kind)
    const id = identifier(data.id)
    const patch = validateGovernancePatch(data.patch, collection === 'clinical-criteria')
    const { user, store } = await actor()
    reviewer(user)
    const current = await store.findByID({ collection, id, overrideAccess: false, user, depth: 0 })
    if (collection === 'clinical-criteria') {
      const source = current as import('@/lib/workflow-store').GovernedCriterion
      if (!patch.code || patch.code === source.code || !patch.versionNumber || patch.versionNumber === source.versionNumber) throw new WorkflowError('Supply a new code and version for the revision.', 'patch')
    }
    const content = contentSnapshot(current as unknown as Record<string, unknown>, collection === 'clinical-criteria')
    const record = await store.create({ collection, overrideAccess: false, user,
      context: workflowContext(user, { kind: 'governance', target: `${collection}:new` }),
      data: { ...content, ...patch, revisionOf: id, lifecycle: 'DRAFT' } })
    return { ok: true as const, record }
  } catch (error) { return resultError(error) }
}

/** Fixed, clinic-wide, real-patient FINALIZED decision partition. No arbitrary filters.
 * null means suppressed (including complementary cells); never render as zero.
 */
export async function getWorkflowAggregatesAction() {
  try {
    const { user, payload, store } = await actor()
    if (!isAppAdmin(user)) throw new WorkflowError('ADMIN permission is required.', 'auth')
    const counts: Record<string, number> = {}
    for (const decision of WORKFLOW_DECISIONS) {
      counts[decision] = (await store.count({ collection: 'clinical-workflows', overrideAccess: false, user,
        context: workflowContext(user, { kind: 'metrics' }),
        where: { and: [{ state: { equals: 'FINALIZED' } }, { patient: { exists: true } }, { decision: { equals: decision } }] },
      })).totalDocs
    }
    const metrics = suppressWorkflowCounts(counts)
    await payload.create({ collection: 'audit-logs', overrideAccess: false, user: payloadWorkflowUser(user),
      context: workflowContext(user, { kind: 'audit' }), data: {
        eventCode: `AUD-${randomUUID()}`, actorName: user.name, actorRole: 'Clinic Administrator',
        actionType: 'METRICS_EXPORT', resourceRef: 'fixed-workflow-aggregates',
        details: 'Suppressed, fixed-cohort workflow metrics viewed.', encryptionVerified: false,
      } })
    return { ok: true as const, metrics }
  } catch (error) { return resultError(error) }
}
