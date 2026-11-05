import type { WorkflowRecord } from '@/lib/workflow-store'

/** UI eligibility only, never a clinical evaluator. The server rechecks signoff. */
export function canFinalizeWorkflow(record: WorkflowRecord | null): boolean {
  if (record?.state !== 'IN_REVIEW') return false
  const snapshot = record.evaluationSnapshot
  const result = snapshot?.result
  if (
    !snapshot ||
    typeof snapshot.evaluationDigest !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(snapshot.evaluationDigest) ||
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result)
  )
    return false
  const value = result as Record<string, unknown>
  return (
    ['urgent_referral', 'routine_referral', 'no_referral_needed'].includes(
      String(value.decision),
    ) &&
    value.reviewPending === false &&
    value.containsUnvalidatedCriteria === false &&
    Array.isArray(value.missingFields) &&
    value.missingFields.length === 0 &&
    Array.isArray(value.validationErrors) &&
    value.validationErrors.length === 0 &&
    Array.isArray(value.sourceCitations) &&
    value.sourceCitations.length > 0 &&
    Array.isArray(value.matchedCriteria) &&
    value.matchedCriteria.some(
      (match) => match && typeof match === 'object' && match.outcome === value.decision,
    )
  )
}
