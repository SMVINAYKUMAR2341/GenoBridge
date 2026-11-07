import { randomUUID } from 'node:crypto'
import type { PayloadRequest } from 'payload'
import type { User } from '../payload-types'

export type StaffUser = User & {
  clinicalQualification?: string | null
  reviewerAuthorized?: boolean | null
  reviewerQualification?: string | null
  reviewerAuthorizationExpiresAt?: string | null
}
export type WorkflowCommand = {
  kind: 'draft' | 'submit' | 'review' | 'finalize' | 'return' | 'governance' | 'metrics' | 'audit'
  key?: string
  revision?: number
  target?: string
  expectedDigest?: string
  expectedEvaluationDigest?: string
  attested?: boolean
}
const capabilities = new WeakMap<object, { actor: string; command: WorkflowCommand }>()

// Object identity never survives REST/GraphQL/Server Action serialization. Do not
// replace this with a boolean context flag or accept context from a caller.
export function workflowContext(user: NonNullable<PayloadRequest['user']>, command: WorkflowCommand) {
  const capability = { nonce: randomUUID() }
  capabilities.set(capability, { actor: `${user.collection}:${user.id}`, command })
  return { clinicalCapability: capability, disableRevalidate: command.kind !== 'governance' }
}
export function commandFor(req: Pick<PayloadRequest, 'user' | 'context'>) {
  const token = req.context?.clinicalCapability
  if (!token || typeof token !== 'object' || !req.user) return undefined
  const entry = capabilities.get(token)
  return entry?.actor === `${req.user.collection}:${req.user.id}` ? entry.command : undefined
}
export function isClinicalStaff(user: unknown): user is StaffUser & { collection: 'users' } {
  const u = user as (StaffUser & { collection?: string }) | null
  return !!u && u.collection === 'users' && u.enabled !== false && ['provider', 'nurse'].includes(u.role ?? '')
}
export function isProvider(user: unknown): user is StaffUser & { collection: 'users' } {
  return isClinicalStaff(user) && user.role === 'provider'
}
export function isReviewer(user: unknown): user is StaffUser & { collection: 'users' } {
  const u = user as StaffUser | null
  return isProvider(user) && u?.reviewerAuthorized === true &&
    !!u.clinicalQualification?.trim() && !!u.reviewerQualification?.trim() &&
    !!u.reviewerAuthorizationExpiresAt && Date.parse(u.reviewerAuthorizationExpiresAt) > Date.now()
}
export function isAppAdmin(user: unknown): boolean {
  const u = user as (StaffUser & { collection?: string }) | null
  return !!u && u.collection === 'users' && u.enabled !== false && u.role === 'admin'
}

export class WorkflowError extends Error {
  field: string
  constructor(message: string, field = 'workflow') {
    super(message)
    this.name = 'WorkflowError'
    this.field = field
  }
}
export function object(value: unknown, allowed: readonly string[], field = 'input'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WorkflowError('Expected an object.', field)
  const record = value as Record<string, unknown>
  if (Object.keys(record).some((key) => !allowed.includes(key))) throw new WorkflowError('Unexpected or server-owned field.', field)
  return record
}
export function text(value: unknown, field: string, max = 2000, optional = false): string {
  if (optional && (value === undefined || value === null || value === '')) return ''
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new WorkflowError('Enter a valid value.', field)
  return value.trim()
}
export function identifier(value: unknown, field = 'id'): User['id'] {
  // This project's generated ID type is string. Never coerce it to a number.
  return text(value, field, 100)
}
export function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new WorkflowError('Invalid revision.', 'expectedRevision')
  return value as number
}
export function resultError(error: unknown) {
  if (
    error instanceof WorkflowError ||
    (error && typeof error === 'object' && ('field' in error || (error as any).name === 'WorkflowError'))
  ) {
    const err = error as any
    return { ok: false as const, error: err.message, fieldErrors: { [err.field || 'workflow']: err.message } }
  }
  console.warn('[workflow-actions] Handled error in action:', error)
  return { ok: false as const, error: 'Operation failed. Reload the latest revision and retry, or contact your administrator.', fieldErrors: {} }
}
