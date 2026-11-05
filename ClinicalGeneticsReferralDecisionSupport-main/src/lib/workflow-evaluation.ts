import type { PayloadRequest } from 'payload'
import type { PathwaySlug } from './decision-engine'
import {
  CriteriaMappingError, evaluateCriteriaService, manualCriteriaResult, prepareCriteriaRequest,
  type CriteriaEvaluation, type CriteriaRequest,
} from './criteria-service'
import { assertActiveCriterion, contentSnapshot, digest } from './workflow-governance'
import { workflowStore, type Guideline, type WorkflowRecord } from './workflow-store'

const ENGINE_VERSION = 'criteria-service/governed-workflow-v2'

export async function evaluateWorkflow(record: WorkflowRecord, req: PayloadRequest) {
  const payload = req.payload
  // Patient data is retained only in the authorized local workflow snapshot. It
  // is never passed to the stateless service, including in failure diagnostics.
  const patient = record.patient ? await payload.findByID({
    collection: 'patients', id: record.patient, overrideAccess: false, user: req.user, req, depth: 0,
  }) : undefined
  const pathways = await payload.find({
    collection: 'clinical-pathways', overrideAccess: false, user: req.user, req,
    where: { slug: { equals: record.pathwaySlug } }, limit: 2, depth: 0,
  })
  const found = await workflowStore(payload).find({
    collection: 'clinical-criteria', overrideAccess: false, user: req.user, req, depth: 0,
    where: { and: [{ pathwaySlug: { equals: record.pathwaySlug } }, { lifecycle: { equals: 'ACTIVE' } }] },
    limit: 251, sort: 'code',
  })
  const criteria = [...found.docs].sort((a, b) => String(a.code ?? '').localeCompare(String(b.code ?? '')) || a.id.localeCompare(b.id))
  const sources = await Promise.all(criteria.map(async (criterion): Promise<Guideline | null> => {
    try { return await assertActiveCriterion(criterion, req) }
    catch { return null }
  }))
  const evaluatedAt = new Date().toISOString()
  let request: CriteriaRequest = {
    schemaVersion: '1.0', pathway: record.pathwaySlug as PathwaySlug, evaluatedAt, facts: {}, criteria: [],
  }
  let evaluation: CriteriaEvaluation
  if (pathways.docs.length !== 1) {
    evaluation = manualCriteriaResult(request, 'insufficient_information', 'pathway_unavailable')
  } else if (found.hasNextPage || criteria.length > 250) {
    evaluation = manualCriteriaResult(request, 'insufficient_information', 'incomplete_rule_set')
  } else if (!criteria.length) {
    // Persist the pending state through the existing workflow hook even if the
    // integration is not configured; absence of rules is not a transport error.
    evaluation = manualCriteriaResult(request, 'criteria_pending_approval', 'no_active_criteria')
  } else if (sources.some((source) => source === null)) {
    evaluation = manualCriteriaResult(request, 'insufficient_information', 'invalid_governed_criteria')
  } else {
    try {
      request = prepareCriteriaRequest(record.pathwaySlug, record.assessmentInputs,
        criteria.map((criterion, index) => ({ criterion, guideline: sources[index]! })), evaluatedAt)
      evaluation = await evaluateCriteriaService(request)
    } catch (error) {
      evaluation = manualCriteriaResult(request, 'insufficient_information',
        error instanceof CriteriaMappingError && error.missingFields.length ? 'incomplete_input' : 'invalid_governed_criteria',
        error instanceof CriteriaMappingError ? error.missingFields : [])
    }
  }

  const matchedCriteria = evaluation.matchedCriteria.map((match) => {
    const criterion = criteria.find((item) => item.id === match.id)!
    const approved = criterion.approvedSnapshot!
    const citations = evaluation.sourceCitations.filter((citation) => citation.criteriaId === match.id).map(({ source }) => source)
    return {
      id: match.id, code: String(approved.code), title: String(approved.title),
      versionNumber: match.version, version: match.version, outcome: match.outcome,
      guidelineCitation: String(approved.guidelineCitation), citations,
    }
  })
  const winning = evaluation.reasonCode === 'matched_criteria'
    ? matchedCriteria.filter((match) => match.outcome === evaluation.outcome) : []
  const approvedText = (key: string) => [...new Set(winning.map((match) => criteria.find((criterion) => criterion.id === match.id)?.approvedSnapshot?.[key]).filter((value): value is string => typeof value === 'string' && !!value.trim()))].join('\n')
  const labels = {
    urgent_referral: 'Urgent referral', routine_referral: 'Routine referral', no_referral_needed: 'No referral needed',
    borderline_consideration: 'Manual clinical review', insufficient_information: 'Insufficient information — manual review',
    criteria_pending_approval: 'Criteria pending approval — manual review',
  }
  const guidelineCitations = [...new Set(matchedCriteria.flatMap((match) => [match.guidelineCitation, ...match.citations.map((source) =>
    `${source.org}: ${source.title} (${source.guidelineVersion}, ${source.date})${source.page ? `, p. ${source.page}` : ''}${source.section ? `, ${source.section}` : ''}. ${source.url}`)]))].join('\n')
  const result = {
    decision: evaluation.outcome,
    rationale: evaluation.rationale,
    headline: labels[evaluation.outcome],
    urgencyBadgeLabel: labels[evaluation.outcome],
    // No hardcoded timeframes or workup suggestions: only approved criteria text.
    recommendedTimeframe: '',
    referralTarget: evaluation.destinations.join('; ') || (evaluation.reviewPending ? 'Manual clinical review required' : ''),
    guidelineCitations,
    jargonTip: approvedText('jargonTip'), recommendedWorkup: approvedText('recommendedWorkup'),
    matchedCriteria,
    missingFields: evaluation.missingFields,
    containsUnvalidatedCriteria: evaluation.reviewPending,
    clinicalInputsSummary: Object.entries(request.facts).map(([field, value]) => `${field}: ${value === null ? 'not supplied' : value}`).join('; '),
    schemaVersion: evaluation.schemaVersion, engineVersion: evaluation.engineVersion,
    reasonCode: evaluation.reasonCode, timestamp: evaluation.timestamp, reviewPending: evaluation.reviewPending,
    criteriaSnapshots: evaluation.criteriaSnapshots, sourceCitations: evaluation.sourceCitations,
    criteriaVersions: evaluation.criteriaVersions, validationErrors: evaluation.validationErrors,
  }
  const { evaluatedAt: _requestTime, ...criteriaRequest } = request
  const snapshot = {
    engineVersion: ENGINE_VERSION,
    inputs: record.assessmentInputs, intake: record.intake, pedigree: record.pedigree, anc: record.anc,
    patient: patient ?? { syntheticPatientReference: record.syntheticPatientReference },
    pathway: pathways.docs.length === 1 ? pathways.docs[0] : null,
    criteria: criteria.map((criterion, index) => ({
      id: criterion.id, code: criterion.code, version: criterion.versionNumber,
      lifecycle: criterion.lifecycle, approvalAttested: criterion.approvalAttested,
      approvalDigest: criterion.approvalDigest, approvedSnapshot: criterion.approvedSnapshot,
      content: contentSnapshot(criterion as unknown as Record<string, unknown>, true),
      governanceHistory: criterion.governanceHistory,
      guideline: sources[index] ? {
        id: sources[index]!.id, lifecycle: sources[index]!.lifecycle,
        approvalDigest: sources[index]!.approvalDigest, approvedSnapshot: sources[index]!.approvedSnapshot,
        content: contentSnapshot(sources[index] as unknown as Record<string, unknown>, false),
        governanceHistory: sources[index]!.governanceHistory,
      } : null,
    })),
    criteriaRequest,
    result,
  }
  // Exclude only evaluation wall-clock timestamps, not approval/source dates.
  // Eligibility/outcome changes still invalidate signoff when rules expire.
  const { timestamp: _responseTime, ...stableResult } = result
  return { ...snapshot, evaluationDigest: digest({ ...snapshot, result: stableResult }), evaluatedAt }
}
