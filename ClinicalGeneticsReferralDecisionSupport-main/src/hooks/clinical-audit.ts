import type { CollectionAfterReadHook, CollectionAfterChangeHook, PayloadRequest } from 'payload'
import { workflowStore, type ClinicalAuditAction } from '../lib/workflow-store'
import { workflowContext } from '../lib/workflow-security'

export async function appendClinicalAudit(req: PayloadRequest, actionType: ClinicalAuditAction, resourceRef: string, details: string) {
  if (!req.user) throw new Error('Audit actor required.')
  const role = req.user.collection === 'users' ? req.user.role as string : 'cms'
  const previousContext = { ...req.context }
  try {
    await workflowStore(req.payload).create({
    collection: 'audit-logs', overrideAccess: false, user: req.user, req,
    context: workflowContext(req.user, { kind: 'audit' }),
    data: {
      eventCode: `AUD-${crypto.randomUUID()}`,
      actorName: req.user.collection === 'users' ? req.user.name : req.user.email || 'CMS administrator',
      actorRole: role === 'provider' ? 'OB/GYN Provider' : role === 'nurse' ? 'Nurse / MA' : role === 'admin' ? 'Clinic Administrator' : 'Specialist Admin',
      actionType, resourceRef, details, encryptionVerified: false,
    },
    })
  } finally {
    // Nested Local API calls may merge context onto the shared request.
    req.context = previousContext
  }
}
export const logStaffAccessChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const changed = ['role', 'enabled', 'clinicalQualification', 'reviewerAuthorized', 'reviewerQualification', 'reviewerAuthorizationExpiresAt']
    .filter((key) => JSON.stringify(doc[key]) !== JSON.stringify(previousDoc?.[key]))
  if (req.user && changed.length) await appendClinicalAudit(req, 'STAFF_ACCESS_CHANGED', `users:${doc.id}`, `Staff access fields changed: ${changed.join(', ')}.`)
  return doc
}
export const logRecordRead: CollectionAfterReadHook = async ({ doc, req, collection }) => {
  if (!req.user) return doc
  await appendClinicalAudit(req, 'PHI_ACCESS', `${collection.slug}:${doc.id}`, 'Authenticated clinical record read.')
  return doc
}
export const logWorkflowChange: CollectionAfterChangeHook = async ({ doc, req, collection }) => {
  if (!req.user) return doc
  const workflow = collection.slug === 'clinical-workflows' || (collection.slug as string) === 'clinical-workflows'
  await appendClinicalAudit(req,
    workflow || collection.slug === 'assessments' ? 'ASSESSMENT_SAVED' : doc.lifecycle === 'APPROVED' ? 'CRITERIA_VALIDATED' : 'CRITERIA_UPDATED',
    `${collection.slug}:${doc.id}`,
    workflow ? `Immutable workflow revision ${doc.revision}; state ${doc.state}.` : `Clinical governance lifecycle ${doc.lifecycle ?? 'legacy'}.`,
  )
  return doc
}
