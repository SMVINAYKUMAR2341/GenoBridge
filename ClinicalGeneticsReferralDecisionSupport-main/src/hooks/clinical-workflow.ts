import type { CollectionBeforeValidateHook } from 'payload'
import { randomUUID } from 'node:crypto'
import { commandFor, isClinicalStaff, isProvider, WorkflowError } from '../lib/workflow-security'
import { assertSubmission, validateDraft } from '../lib/workflow-validation'
import { workflowStore, type WorkflowRecord } from '../lib/workflow-store'
import { evaluateWorkflow } from '../lib/workflow-evaluation'

export const enforceClinicalWorkflow: CollectionBeforeValidateHook = async ({ req, data = {}, operation }) => {
  const command = commandFor(req)
  if (operation !== 'create' || !isClinicalStaff(req.user) || !command?.key || command.revision === undefined ||
    !['draft', 'submit', 'review', 'finalize', 'return'].includes(command.kind)) throw new WorkflowError('Use an authenticated workflow action.')
  const latest = await workflowStore(req.payload).find({
    collection: 'clinical-workflows', overrideAccess: false, user: req.user, req, depth: 0,
    where: { workflowKey: { equals: command.key } }, sort: '-revision', limit: 1,
  })
  const previous = latest.docs[0]
  if ((previous?.revision ?? 0) !== command.revision) throw new WorkflowError('A newer revision exists. Reload before saving.', 'expectedRevision')
  if (previous?.state === 'FINALIZED') throw new WorkflowError('Finalized workflows are immutable. Start a new workflow.')
  if (!previous && command.kind !== 'draft') throw new WorkflowError('Save a draft first.')
  const source = command.kind === 'draft' ? data : previous!
  if (command.kind === 'draft' && previous && previous.state !== 'DRAFT') throw new WorkflowError('Submitted records must be returned to draft by a provider.')
  const draft = validateDraft(Object.fromEntries(['patient', 'syntheticPatientReference', 'pathwaySlug', 'intake', 'pedigree', 'anc', 'assessmentInputs'].map((key) => [key, source[key as keyof typeof source]])))
  if (draft.patient) await req.payload.findByID({ collection: 'patients', id: draft.patient, overrideAccess: false, user: req.user, req, depth: 0 })
  let state: WorkflowRecord['state'] = 'DRAFT'
  if (command.kind !== 'draft' && command.kind !== 'return') {
    assertSubmission(draft)
    if (command.kind === 'submit') {
      if (previous.state !== 'DRAFT') throw new WorkflowError('Only drafts can be submitted.')
      state = 'SUBMITTED'
    } else {
      if (!isProvider(req.user)) throw new WorkflowError('Only a gynecologist may review or finalize.')
      if (!['SUBMITTED', 'IN_REVIEW'].includes(previous.state)) throw new WorkflowError('Submit this draft before clinical review.')
      state = command.kind === 'finalize' ? 'FINALIZED' : 'IN_REVIEW'
    }
  }
  if (command.kind === 'return' && (!isProvider(req.user) || !['SUBMITTED', 'IN_REVIEW'].includes(previous.state))) throw new WorkflowError('Only a provider can return a submitted workflow to draft.')
  const next = {
    ...draft, workflowKey: command.key, revision: command.revision + 1,
    revisionKey: `${command.key}:${command.revision + 1}`, state, actor: req.user.id,
    reviewNote: typeof data.reviewNote === 'string' ? data.reviewNote : null,
    evaluationSnapshot: null, signoff: null, decision: null,
  } as unknown as WorkflowRecord
  if (command.kind === 'review' || command.kind === 'finalize') {
    const evaluated = await evaluateWorkflow(next, req)
    next.evaluationSnapshot = evaluated
    if (command.kind === 'finalize') {
      if (previous.state !== 'IN_REVIEW' || !previous.evaluationSnapshot ||
        previous.evaluationSnapshot.evaluationDigest !== evaluated.evaluationDigest ||
        command.expectedEvaluationDigest !== evaluated.evaluationDigest || command.attested !== true) {
        throw new WorkflowError('Review the current server evaluation and attest before signing. Sources or inputs may have changed.', 'expectedEvaluationDigest')
      }
      next.decision = evaluated.result.decision
      next.signoff = {
        signatureId: randomUUID(), actor: req.user.id, name: req.user.name,
        role: 'provider', at: new Date().toISOString(), evaluationDigest: evaluated.evaluationDigest,
        attested: true, synthetic: !!draft.syntheticPatientReference, note: next.reviewNote,
      }
    }
  }
  // All identity, state, evaluation and signoff fields are reconstructed here.
  return next
}
