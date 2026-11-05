import type { CollectionBeforeChangeHook, CollectionAfterReadHook } from 'payload'
import { commandFor, isReviewer, WorkflowError } from '../lib/workflow-security'
import { activeGuideline, assertActiveCriterion, assertComplete, contentSnapshot, digest, isActive, validateConditions, validateGovernancePatch } from '../lib/workflow-governance'
import { workflowStore, type Governance, type Lifecycle } from '../lib/workflow-store'

const transitions: Record<Lifecycle, Lifecycle[]> = {
  DRAFT: ['UNDER_REVIEW'], UNDER_REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['ACTIVE', 'RETIRED'], ACTIVE: ['SUPERSEDED', 'RETIRED'], SUPERSEDED: [], RETIRED: [],
}
export const governClinicalContent: CollectionBeforeChangeHook = async ({ data, originalDoc, req, collection, operation }) => {
  const command = commandFor(req)
  if (!isReviewer(req.user) || command?.kind !== 'governance' || command.target !== `${collection.slug}:${originalDoc?.id ?? 'new'}`) {
    throw new WorkflowError('Use the authorized clinical governance actions.')
  }
  const criterion = collection.slug === 'clinical-criteria'
  const previous = (originalDoc?.lifecycle ?? 'DRAFT') as Lifecycle
  const next = (data.lifecycle ?? previous) as Lifecycle
  if (operation === 'create' && next !== 'DRAFT') throw new WorkflowError('New revisions must start as drafts.')
  if (!transitions[previous] || !transitions[next] || (next !== previous && !transitions[previous].includes(next))) throw new WorkflowError('Invalid lifecycle transition.', 'lifecycle')
  const before = originalDoc ? contentSnapshot(originalDoc, criterion) : null
  const merged = { ...originalDoc, ...data }
  const snapshot = contentSnapshot(merged, criterion)
  validateGovernancePatch(Object.fromEntries(Object.entries(snapshot).filter(([, value]) => value !== null)), criterion)
  if (criterion) validateConditions(merged, false)
  const changed = before && digest(before) !== digest(snapshot)
  if (originalDoc && (changed && (previous !== 'DRAFT' || next !== 'DRAFT'))) throw new WorkflowError('Only drafts can be edited. Create a new revision to change approved content.')
  if (originalDoc && next === previous && !changed) throw new WorkflowError('No content or lifecycle change.')
  if (originalDoc && command.expectedDigest !== digest({ id: originalDoc.id, updatedAt: originalDoc.updatedAt })) throw new WorkflowError('This record changed. Reload before saving.', 'expectedUpdatedAt')


  if (next === 'APPROVED' || next === 'ACTIVE') {
    assertComplete(merged, criterion)
    let source: unknown
    if (criterion) {
      const id = typeof merged.guideline === 'string' ? merged.guideline : merged.guideline?.id
      const guideline = await activeGuideline(id, req)
      source = { id: guideline.id, approvalDigest: guideline.approvalDigest, content: guideline.approvedSnapshot }
    }
    if (next === 'ACTIVE' && Date.parse(merged.effectiveFrom) > Date.now()) throw new WorkflowError('The effective date has not arrived.', 'effectiveFrom')
    if (previous === 'UNDER_REVIEW' && next === 'APPROVED') {
      data.approvedSnapshot = { ...snapshot, ...(criterion ? { guidelineSnapshot: source } : {}) }
      data.approvalDigest = digest(data.approvedSnapshot)
    } else if (!originalDoc?.approvedSnapshot || digest(originalDoc.approvedSnapshot) !== originalDoc.approvalDigest) {
      throw new WorkflowError('Missing or invalid immutable approval snapshot.')
    }
    if (criterion && next === 'ACTIVE') {
      const frozen = (data.approvedSnapshot ?? originalDoc.approvedSnapshot).guidelineSnapshot
      if (digest(frozen) !== digest(source)) throw new WorkflowError('Source changed since approval; create a new revision.', 'guideline')
    }
  }
  if (operation === 'create') {
    data.authoredBy = req.user!.id
    data.approvedSnapshot = null
    data.approvalDigest = null
  } else if (!(previous === 'UNDER_REVIEW' && next === 'APPROVED')) {
    data.approvedSnapshot = originalDoc.approvedSnapshot ?? null
    data.approvalDigest = originalDoc.approvalDigest ?? null
    data.authoredBy = originalDoc.authoredBy ?? null
  }
  data.lifecycle = next
  data.governanceHistory = [...(originalDoc?.governanceHistory ?? []), {
    from: operation === 'create' ? null : previous, to: next, actor: req.user!.id,
    at: new Date().toISOString(), contentDigest: digest(snapshot), reason: merged.changeReason ?? '',
  }]
  if (criterion) {
    data.approvalAttested = next === 'ACTIVE'
    data.validationStatus = next === 'ACTIVE' ? 'validated' : next === 'UNDER_REVIEW' ? 'under_review' : 'unvalidated_placeholder'
    data.reviewedBySpecialist = next === 'APPROVED' ? req.user!.name : originalDoc?.reviewedBySpecialist ?? null
    data.lastReviewedAt = next === 'APPROVED' ? new Date().toISOString() : originalDoc?.lastReviewedAt ?? null
  }
  // Claim only after validation. A unique immutable receipt prevents concurrent
  // edits consuming one stored version; req shares Payload's transaction.
  if (originalDoc) await workflowStore(req.payload).create({
    collection: 'governance-commands', overrideAccess: false, user: req.user, req,
    data: { commandKey: `${collection.slug}:${originalDoc.id}:${originalDoc.updatedAt}`, target: `${collection.slug}:${originalDoc.id}`, actor: req.user!.id },
  })
  return data
}

export const maskUntrustedCriterion: CollectionAfterReadHook = async ({ doc, req }) => {
  // Read-time checks also close the expiry window without requiring a scheduler.
  try { await assertActiveCriterion(doc, req) } catch {
    doc.approvalAttested = false
    doc.validationStatus = 'unvalidated_placeholder'
    doc.reviewedBySpecialist = null
  }
  return doc
}
export const maskInactiveGuideline: CollectionAfterReadHook = ({ doc }) => {
  // Retain lifecycle for governance UI; consumers must explicitly call isActive.
  return { ...doc, eligibleForClinicalUse: isActive(doc as Governance) }
}
