export const WORKFLOW_DECISIONS = ['urgent_referral', 'routine_referral', 'borderline_consideration', 'no_referral_needed'] as const
export const MINIMUM_CELL_SIZE = 5

// One fixed, exhaustive partition only. No caller-controlled cohorts, dates,
// cross-tabs, record identifiers, or independently published margins.
export function suppressWorkflowCounts(counts: Record<string, number>) {
  const values = WORKFLOW_DECISIONS.map((key) => counts[key])
  if (values.some((n) => !Number.isSafeInteger(n) || n < 0)) throw new Error('Invalid aggregate counts.')
  const hidden = new Set(WORKFLOW_DECISIONS.filter((key) => counts[key] < MINIMUM_CELL_SIZE))
  if (hidden.size === 1) {
    const complement = WORKFLOW_DECISIONS.filter((key) => !hidden.has(key)).sort((a, b) => counts[b] - counts[a])[0]
    hidden.add(complement)
  }
  return {
    minimumCellSize: MINIMUM_CELL_SIZE,
    counts: Object.fromEntries(WORKFLOW_DECISIONS.map((key) => [key, hidden.has(key) ? null : counts[key]])) as Record<typeof WORKFLOW_DECISIONS[number], number | null>,
    total: hidden.size ? null : values.reduce((sum, n) => sum + n, 0),
    suppressed: hidden.size > 0,
  }
}
