import type { Payload, PayloadRequest, Where } from 'payload'
import type { AuditLog, ClinicalCriterion, User } from '../payload-types'
import type { PedigreeModel } from '../components/clinical/pedigree-model'
import type { RoutineAncData } from './anc-model'

// Keep the runtime nurse role expressible while Make's generated User type is stale.
export type WorkflowUser = Omit<User, 'role'> & {
  collection: 'users'
  role: 'provider' | 'admin' | 'nurse'
  clinicalQualification?: string | null
  reviewerAuthorized?: boolean | null
  reviewerQualification?: string | null
  reviewerAuthorizationExpiresAt?: string | null
}
export type ClinicalWorkspaceUser = Pick<WorkflowUser, 'id' | 'name' | 'role'> & {
  enabled: true
  reviewerAuthorized: boolean
  canReviewCriteria: boolean
  clinicalQualification: string | null
  reviewerQualification: string | null
  reviewerAuthorizationExpiresAt: string | null
}
export type EmptyWorkflowSection = Record<string, never>
export type WorkflowIntake = {
  presentingConcern?: string
  pregnancyStatus?: string
  gestationalAgeWeeks?: number | ''
  gravida?: number | ''
  para?: number | ''
  consentToAssessment?: boolean | ''
  notes?: string
}
export type WorkflowDraftInput = {
  patient?: null | ''
  syntheticPatientReference: string
  pathwaySlug: string
  intake?: WorkflowIntake
  pedigree?: PedigreeModel | EmptyWorkflowSection
  anc?: RoutineAncData | EmptyWorkflowSection
  assessmentInputs?: Record<string, string | number | boolean | undefined>
}
export type SaveWorkflowDraftInput = {
  workflowKey?: string
  expectedRevision: number
  draft: WorkflowDraftInput
}
export type SaveWorkflowSectionsInput = {
  workflowKey: string
  expectedRevision: number
  sections: Pick<WorkflowDraftInput, 'intake' | 'pedigree' | 'anc' | 'assessmentInputs'>
}
export type ClinicalWorkspaceScan = {
  queried: boolean
  recordsScanned: number
  totalRevisions: number | null
  workflowsReturned: number
  maxRevisions: number
  complete: boolean
  truncated: boolean
  note: string
}

export type ClinicalAuditAction = AuditLog['actionType'] | 'STAFF_ACCESS_CHANGED'
export type Lifecycle = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED' | 'RETIRED'
export type Governance = {
  lifecycle?: Lifecycle | null
  sourceURL?: string | null
  sourceOrganization?: string | null
  sourceDocument?: string | null
  sourceVersion?: string | null
  publishedAt?: string | null
  sourceSection?: string | null
  jurisdiction?: string | null
  population?: string | null
  applicability?: string | null
  exclusions?: string | null
  evidenceLevel?: string | null
  recommendationGrade?: string | null
  provenance?: string | null
  validationEvidence?: string | null
  effectiveFrom?: string | null
  reviewDueAt?: string | null
  simulated?: boolean | null
  changeReason?: string | null
  guideline?: string | { id: string } | null
  revisionOf?: string | { id: string } | null
  authoredBy?: User['id'] | null
  approvedSnapshot?: Record<string, unknown> | null
  approvalDigest?: string | null
  governanceHistory?: Record<string, unknown>[] | null
}
export type GovernedCriterion = ClinicalCriterion & Governance
export type Guideline = Governance & { id: string; title?: string | null; updatedAt: string }
export type WorkflowRecord = {
  id: string
  workflowKey: string
  revision: number
  revisionKey: string
  state: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'FINALIZED'
  patient?: string | null
  syntheticPatientReference?: string | null
  pathwaySlug: string
  intake: Record<string, unknown>
  pedigree: PedigreeModel | EmptyWorkflowSection
  anc: RoutineAncData | EmptyWorkflowSection
  assessmentInputs: Record<string, unknown>
  evaluationSnapshot?: Record<string, unknown> | null
  decision?: string | null
  actor: User['id']
  signoff?: Record<string, unknown> | null
  reviewNote?: string | null
  createdAt: string
}
export type ClinicalWorkspaceResult = {
  ok: true
  user: ClinicalWorkspaceUser | null
  patients: []
  workflows: WorkflowRecord[]
  scan: ClinicalWorkspaceScan
} | {
  ok: false
  error: string
  fieldErrors: Record<string, string>
}

type Documents = {
  'clinical-workflows': WorkflowRecord
  users: WorkflowUser
  'guideline-references': Guideline
  'clinical-criteria': GovernedCriterion
  'governance-commands': { id: string; commandKey: string; target: string; actor: User['id'] }
  'audit-logs': Omit<AuditLog, 'actionType'> & { actionType: ClinicalAuditAction }
}
type Options<K extends keyof Documents> = {
  collection: K
  overrideAccess: false
  user: PayloadRequest['user'] | WorkflowUser
  req?: PayloadRequest
  context?: Record<string, unknown>
  depth?: number
}
interface WorkflowStore {
  find<K extends keyof Documents>(options: Options<K> & { where?: Where; limit?: number; page?: number; sort?: string | string[] }): Promise<{ docs: Documents[K][]; totalDocs: number; hasNextPage: boolean }>
  findByID<K extends keyof Documents>(options: Options<K> & { id: string }): Promise<Documents[K]>
  create<K extends keyof Documents>(options: Options<K> & { data: Partial<Documents[K]> }): Promise<Documents[K]>
  update<K extends keyof Documents>(options: Options<K> & { id: string; data: Partial<Documents[K]> }): Promise<Documents[K]>
  count<K extends keyof Documents>(options: Options<K> & { where?: Where }): Promise<{ totalDocs: number }>
}
// Only a type bridge for existing Payload APIs; this does not grant permission,
// change roles or create a session. Runtime identity stays the same object.
export function payloadWorkflowUser(user: WorkflowUser): NonNullable<PayloadRequest['user']> {
  return user as unknown as NonNullable<PayloadRequest['user']>
}

// Transitional typed facade only: runtime operations still use the registered
// Payload collections. Remove when Make automatically refreshes generated types.
// No generated file edits, alternative persistence, or access overrides.
export function workflowStore(payload: Payload): WorkflowStore {
  return payload as unknown as WorkflowStore
}
