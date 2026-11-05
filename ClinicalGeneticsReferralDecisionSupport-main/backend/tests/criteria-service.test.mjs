// Synthetic fixtures only. Exercises actual TS mapping against the real Python
// engine without node_modules, an HTTP listener, patient data, or clinical seeds.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SourceTextModule, SyntheticModule } from 'node:vm'
import { execFileSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const root = fileURLToPath(new URL('../../', import.meta.url))
const cache = new Map()
async function moduleAt(path) {
  if (cache.has(path)) return cache.get(path)
  let mod
  if (path === 'server-only') {
    // The Next build enforces this marker; there is no browser in this harness.
    mod = new SyntheticModule([], function () {}, { identifier: path })
  } else if (path.startsWith('node:')) {
    const native = await import(path)
    mod = new SyntheticModule(Object.keys(native), function () {
      for (const key of Object.keys(native)) this.setExport(key, native[key])
    }, { identifier: path })
  } else {
    mod = new SourceTextModule(stripTypeScriptTypes(readFileSync(path, 'utf8'), { mode: 'transform' }), { identifier: path })
  }
  cache.set(path, mod)
  return mod
}
async function load(relative) {
  const mod = await moduleAt(resolve(root, relative))
  if (mod.status === 'unlinked') await mod.link((specifier, parent) => moduleAt(
    specifier === 'server-only' || specifier.startsWith('node:') ? specifier
      : specifier.startsWith('@/') ? resolve(root, 'src', `${specifier.slice(2)}.ts`)
        : resolve(dirname(parent.identifier), `${specifier}.ts`),
  ))
  if (mod.status === 'linked') await mod.evaluate()
  return mod.namespace
}
const governance = await load('src/lib/workflow-governance.ts')
const fields = await load('src/lib/form-fields.ts')
const bridge = await load('src/lib/criteria-service.ts')
const { evaluateWorkflow } = await load('src/lib/workflow-evaluation.ts')
const { enforceClinicalWorkflow } = await load('src/hooks/clinical-workflow.ts')
const security = await load('src/lib/workflow-security.ts')
const originalFetch = globalThis.fetch
const originalTimeout = globalThis.setTimeout
const oldUrl = process.env.CRITERIA_SERVICE_URL
const oldKey = process.env.CRITERIA_SERVICE_API_KEY
const KEY = 'software-test-only-criteria-key-00000000000000'
process.env.CRITERIA_SERVICE_URL = 'https://criteria.example.invalid'
process.env.CRITERIA_SERVICE_API_KEY = KEY
const python = process.env.CRITERIA_TEST_PYTHON || 'python'
after(() => {
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalTimeout
  if (oldUrl === undefined) delete process.env.CRITERIA_SERVICE_URL
  else process.env.CRITERIA_SERVICE_URL = oldUrl
  if (oldKey === undefined) delete process.env.CRITERIA_SERVICE_API_KEY
  else process.env.CRITERIA_SERVICE_API_KEY = oldKey
})

const metadata = {
  title: 'Software test source', sourceURL: 'https://example.invalid/test-guideline',
  sourceOrganization: 'Test organization', sourceDocument: 'Test guideline document', sourceVersion: 'test-guide-v1',
  publishedAt: '2025-01-01T00:00:00Z', sourceSection: 'Test section', jurisdiction: 'Test only', population: 'Test only',
  applicability: 'Test only', exclusions: 'Test-only prose; never executable', evidenceLevel: 'Test only',
  recommendationGrade: 'Test only', provenance: 'Software fixture', validationEvidence: 'Software fixture',
  effectiveFrom: '2025-01-01T00:00:00Z', reviewDueAt: '2099-01-01T00:00:00Z', simulated: false, changeReason: 'Software test only',
}
function approveGuideline(guideline) {
  guideline.approvedSnapshot = governance.contentSnapshot(guideline, false)
  guideline.approvalDigest = governance.digest(guideline.approvedSnapshot)
  guideline.governanceHistory = [{ from: 'UNDER_REVIEW', to: 'APPROVED', actor: 'test-guideline-reviewer', at: '2025-01-01T00:00:00Z', contentDigest: guideline.approvalDigest }]
}
function approveCriterion(criterion, guideline) {
  const content = governance.contentSnapshot(criterion, true)
  criterion.approvedSnapshot = { ...content, guidelineSnapshot: { id: guideline.id, approvalDigest: guideline.approvalDigest, content: guideline.approvedSnapshot } }
  criterion.approvalDigest = governance.digest(criterion.approvedSnapshot)
  criterion.governanceHistory = [
    { from: 'UNDER_REVIEW', to: 'APPROVED', actor: 'test-criterion-reviewer', at: '2025-01-02T00:00:00Z', contentDigest: governance.digest(content) },
    { from: 'APPROVED', to: 'ACTIVE', actor: 'not-the-reviewer', at: '2025-01-03T00:00:00Z' },
  ]
}
function fixture(pathway = 'hereditary-cancer-risk', condition = { field: 'hcrKnownFamilialMutation', equals: true }) {
  const guideline = { ...metadata, id: 'test-guideline', lifecycle: 'ACTIVE', updatedAt: '2025-01-01T00:00:00Z' }
  approveGuideline(guideline)
  const criterion = {
    ...metadata, id: 'test-criterion', lifecycle: 'ACTIVE', approvalAttested: true,
    code: 'TEST-ONLY', versionNumber: 'test-rule-v1', pathwaySlug: pathway,
    triggerKey: 'unused-and-deliberately-not-a-real-trigger', conditions: [condition],
    urgencyOutcome: 'routine', referralTarget: 'Synthetic destination, not guidance',
    plainLanguageRationale: 'Synthetic rationale, not guidance', guidelineCitation: 'Synthetic approved citation',
    recommendedWorkup: 'Synthetic approved workup text', jargonTip: 'Synthetic approved explanation', guideline: guideline.id,
  }
  approveCriterion(criterion, guideline)
  const input = Object.fromEntries(fields.FORM_FIELDS[pathway].map((field) => [field.key,
    field.type === 'checkbox' ? false : field.type === 'select' ? field.options[0][0] : field.type === 'text' ? 'TEST-FREE-TEXT-DO-NOT-SEND' : '',
  ]))
  input[condition.field] = condition.equals
  const record = {
    id: 'test-workflow', workflowKey: 'test-workflow', revision: 3, revisionKey: 'test-workflow:3', state: 'SUBMITTED',
    patient: 'test-patient', pathwaySlug: pathway, actor: 'test-provider', createdAt: '2026-01-01T00:00:00Z',
    assessmentInputs: input, intake: { consentToAssessment: true, notes: 'TEST-INTAKE-NOT-TO-SEND' },
    pedigree: { notes: 'TEST-PEDIGREE-NOT-TO-SEND' }, anc: { notes: 'TEST-ANC-NOT-TO-SEND' },
  }
  const documents = [criterion]
  const user = { collection: 'users', id: 'test-provider', role: 'provider', enabled: true, name: 'Test provider' }
  const payload = {
    async find(options) {
      assert.equal(options.overrideAccess, false)
      assert.equal(options.user, user)
      if (options.collection === 'clinical-criteria') return { docs: documents, hasNextPage: false }
      if (options.collection === 'clinical-pathways') return { docs: [{ id: 'test-pathway', slug: pathway, title: 'Software test pathway' }] }
      if (options.collection === 'clinical-workflows') return { docs: [record], hasNextPage: false }
      throw new Error('Unexpected test collection')
    },
    async findByID(options) {
      assert.equal(options.overrideAccess, false)
      assert.equal(options.user, user)
      if (options.collection === 'guideline-references') return guideline
      if (options.collection === 'patients') return { id: 'test-patient', fullName: 'TEST-PATIENT-IDENTIFIER-DO-NOT-SEND', mrn: 'TEST-MRN-DO-NOT-SEND' }
      throw new Error('Unexpected test lookup')
    },
  }
  return { criterion, guideline, record, documents, req: { payload, user }, input }
}
function hookFixture() {
  const f = fixture()
  // Respect the parent's synthetic-only deployment gate and section models.
  Object.assign(f.record, { patient: null, syntheticPatientReference: 'SYN-bridge-test', pedigree: {}, anc: {} })
  return f
}
function requestFor(f) {
  return bridge.prepareCriteriaRequest(f.record.pathwaySlug, f.input, [{ criterion: f.criterion, guideline: f.guideline }], '2026-06-01T12:00:00Z')
}
function pythonEvaluation(payload) {
  return JSON.parse(execFileSync(python, ['-B', '-S', '-c', 'import json,sys; from backend.engine import evaluate; print(json.dumps(evaluate(json.load(sys.stdin))))'], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', timeout: 5000 }))
}
function mockService(change = (result) => result) {
  const sent = []
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://criteria.example.invalid/evaluate')
    assert.equal(options.headers['X-Criteria-API-Key'], KEY)
    assert.equal(options.cache, 'no-store')
    assert.equal(options.redirect, 'error')
    assert.ok(options.signal instanceof AbortSignal)
    const body = JSON.parse(options.body)
    sent.push(body)
    return new Response(JSON.stringify(change(pythonEvaluation(body))), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return sent
}

// Node's default top-level test execution is sequential; no globals are shared
// concurrently while mocking the server environment and fetch.
test('approved conditions map to eq and approval comes from APPROVED, not ACTIVE', () => {
  const f = fixture()
  const request = requestFor(f)
  const rule = request.criteria[0]
  assert.deepEqual(rule.conditions, [{ field: 'hcrKnownFamilialMutation', op: 'eq', value: true }])
  assert.deepEqual(rule.requiredFields, ['hcrKnownFamilialMutation'])
  assert.equal(rule.reviewer, 'test-criterion-reviewer')
  assert.equal(rule.approvedAt, '2025-01-02T00:00:00.000Z')
  assert.deepEqual(rule.sources, [{ title: 'Test guideline document', org: 'Test organization', guidelineVersion: 'test-guide-v1', date: '2025-01-01', page: null, section: 'Test section', url: 'https://example.invalid/test-guideline' }])
  assert.deepEqual(rule.exclusions, [])
  assert.equal(rule.simulated, false)
  assert.ok(!Object.hasOwn(rule, 'triggerKey'))
  assert.equal(pythonEvaluation(request).outcome, 'routine_referral')
})

test('all six pathway catalogs map without clinical trigger branching', () => {
  for (const pathway of Object.keys(fields.FORM_FIELDS)) {
    const field = fields.FORM_FIELDS[pathway].find((item) => item.type === 'select')
    const f = fixture(pathway, { field: field.key, equals: field.options[0][0] })
    const request = requestFor(f)
    assert.equal(request.pathway, pathway)
    assert.equal(pythonEvaluation(request).outcome, 'routine_referral')
  }
})

test('schema number strings normalize on both sides; categorical strings and false stay typed', () => {
  const f = fixture('nipt-results', { field: 'niptGestationalWeeks', equals: '12.0' })
  f.input.niptGestationalWeeks = '12'
  const request = requestFor(f)
  assert.equal(request.criteria[0].conditions[0].value, 12)
  assert.equal(request.facts.niptGestationalWeeks, 12)
  assert.equal(request.facts.niptFinding, 'low_risk')
  assert.equal(request.facts.niptFetalFraction, null)
  assert.equal(pythonEvaluation(request).outcome, 'routine_referral')
  const boolean = fixture(undefined, { field: 'hcrKnownFamilialMutation', equals: false })
  assert.equal(requestFor(boolean).criteria[0].conditions[0].value, false)
})

test('no patient, workflow, free text, intake, ANC, pedigree, or extra fields reach service', async () => {
  const f = fixture()
  f.input.extraPatientIdentifier = 'TEST-EXTRA-PHI-DO-NOT-SEND'
  const sent = mockService()
  const snapshot = await evaluateWorkflow(f.record, f.req)
  assert.equal(sent.length, 1)
  assert.deepEqual(Object.keys(sent[0]).sort(), ['schemaVersion', 'pathway', 'evaluatedAt', 'facts', 'criteria'].sort())
  const wire = JSON.stringify(sent[0])
  for (const marker of ['TEST-FREE-TEXT', 'TEST-PATIENT', 'TEST-MRN', 'TEST-INTAKE', 'TEST-PEDIGREE', 'TEST-ANC', 'TEST-EXTRA-PHI', 'triggerKey']) assert.ok(!wire.includes(marker), marker)
  assert.equal(snapshot.patient.fullName, 'TEST-PATIENT-IDENTIFIER-DO-NOT-SEND')
  assert.ok(!JSON.stringify(snapshot).includes(KEY))
  assert.equal(snapshot.result.decision, 'routine_referral')
  assert.equal(snapshot.result.matchedCriteria[0].code, 'TEST-ONLY')
  assert.equal(snapshot.result.matchedCriteria[0].versionNumber, 'test-rule-v1')
  assert.equal(snapshot.result.matchedCriteria[0].citations[0].guidelineVersion, 'test-guide-v1')
  assert.match(snapshot.result.guidelineCitations, /test-guide-v1/)
  assert.equal(snapshot.result.referralTarget, f.criterion.referralTarget)
  assert.equal(snapshot.result.recommendedTimeframe, '')
  assert.equal(snapshot.result.recommendedWorkup, f.criterion.recommendedWorkup)
})

test('missing condition facts persist insufficient_information without defaults', async () => {
  const f = fixture()
  delete f.input.hcrKnownFamilialMutation
  const sent = mockService()
  const snapshot = await evaluateWorkflow(f.record, f.req)
  assert.equal(sent[0].facts.hcrKnownFamilialMutation, null)
  assert.equal(snapshot.result.decision, 'insufficient_information')
  assert.deepEqual(snapshot.result.missingFields, ['hcrKnownFamilialMutation'])
  assert.equal(snapshot.result.reviewPending, true)
})

test('no match is manual borderline, never a generic negative fallback', async () => {
  const f = fixture()
  f.input.hcrKnownFamilialMutation = false
  mockService()
  const snapshot = await evaluateWorkflow(f.record, f.req)
  assert.equal(snapshot.result.decision, 'borderline_consideration')
  assert.deepEqual(snapshot.result.matchedCriteria, [])
  assert.equal(snapshot.result.recommendedWorkup, '')
})

test('only explicit negative rule can return no_referral_needed', async () => {
  const f = fixture()
  f.criterion.urgencyOutcome = 'none'
  approveCriterion(f.criterion, f.guideline)
  mockService()
  assert.equal((await evaluateWorkflow(f.record, f.req)).result.decision, 'no_referral_needed')
})

test('duplicate legacy trigger keys do not control matching; conflicts are manual', async () => {
  const f = fixture()
  f.criterion.urgencyOutcome = 'urgent'
  approveCriterion(f.criterion, f.guideline)
  const negative = { ...f.criterion, id: 'test-negative', code: 'TEST-NEGATIVE', urgencyOutcome: 'none' }
  approveCriterion(negative, f.guideline)
  f.documents.push(negative)
  mockService()
  const result = (await evaluateWorkflow(f.record, f.req)).result
  assert.equal(result.decision, 'borderline_consideration')
  assert.equal(result.reasonCode, 'conflicting_criteria')
  assert.equal(result.matchedCriteria.length, 2)
  assert.equal(result.recommendedWorkup, '')
})

test('no active criteria returns pending without service configuration or throwing', async () => {
  const f = fixture()
  f.documents.length = 0
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('Must not be called') }
  delete process.env.CRITERIA_SERVICE_API_KEY
  try {
    const snapshot = await evaluateWorkflow(f.record, f.req)
    assert.equal(snapshot.result.decision, 'criteria_pending_approval')
    assert.equal(snapshot.result.reviewPending, true)
    assert.deepEqual(snapshot.result.matchedCriteria, [])
    assert.ok(snapshot.evaluationDigest)
    assert.equal(calls, 0)
  } finally { process.env.CRITERIA_SERVICE_API_KEY = KEY }
})

test('workflow review hook retains pending result for persistence', async () => {
  const f = hookFixture()
  f.documents.length = 0
  f.req.context = security.workflowContext(f.req.user, { kind: 'review', key: f.record.workflowKey, revision: f.record.revision })
  const next = await enforceClinicalWorkflow({ req: f.req, data: {}, operation: 'create' })
  assert.equal(next.state, 'IN_REVIEW')
  assert.equal(next.evaluationSnapshot.result.decision, 'criteria_pending_approval')
  assert.equal(next.signoff, null)
})

test('incomplete approval history, simulated rules and source drift require manual review', async () => {
  for (const mutate of [
    (f) => { f.criterion.governanceHistory = [] },
    (f) => { f.criterion.code = null },
    (f) => { f.guideline.governanceHistory = [] },
    (f) => { f.criterion.governanceHistory[0].actor = null },
    (f) => { f.criterion.governanceHistory[0].contentDigest = 'tampered' },
    (f) => { f.criterion.simulated = true },
    (f) => { f.guideline.simulated = true },
    (f) => { f.criterion.conditions = [{ field: 'hcrKnownFamilialMutation', equals: false }] },
    (f) => { f.guideline.sourceDocument = 'Unapproved live change' },
    (f) => { f.guideline.reviewDueAt = '2025-01-01T00:00:00Z' },
  ]) {
    const f = fixture()
    mutate(f)
    let calls = 0
    globalThis.fetch = async () => { calls++; throw new Error('Must not evaluate incomplete governance') }
    const snapshot = await evaluateWorkflow(f.record, f.req)
    assert.equal(snapshot.result.decision, 'insufficient_information')
    assert.equal(snapshot.result.reviewPending, true)
    assert.equal(calls, 0)
  }
})

test('free-text and unknown-field conditions are not sent to service', async () => {
  for (const field of ['hcrRelativeDetails', 'patientName']) {
    const f = fixture(undefined, { field, equals: 'TEST-PRIVATE-CONDITION-DO-NOT-SEND' })
    let calls = 0
    globalThis.fetch = async () => { calls++; throw new Error('Must not transmit private condition') }
    assert.equal((await evaluateWorkflow(f.record, f.req)).result.decision, 'insufficient_information')
    assert.equal(calls, 0)
  }
})

test('malformed assessment values do not get coerced to matching checkbox/select facts', async () => {
  for (const [field, value] of [['hcrKnownFamilialMutation', 'true'], ['hcrPersonalCancer', 'not-an-option']]) {
    const f = fixture()
    f.input[field] = value
    let calls = 0
    globalThis.fetch = async () => { calls++; throw new Error('Must not evaluate malformed facts') }
    const snapshot = await evaluateWorkflow(f.record, f.req)
    assert.equal(snapshot.result.decision, 'insufficient_information')
    assert.deepEqual(snapshot.result.missingFields, [field])
    assert.equal(calls, 0)
  }
})

test('transport errors and missing integration config never call the old engine', async () => {
  const f = fixture()
  globalThis.fetch = async () => { throw new Error('Network failure must not leak') }
  const failed = await evaluateWorkflow(f.record, f.req)
  assert.equal(failed.result.decision, 'insufficient_information')
  assert.equal(failed.result.reasonCode, 'service_unavailable')
  assert.ok(!JSON.stringify(failed).includes('Network failure must not leak'))
  delete process.env.CRITERIA_SERVICE_URL
  try { assert.equal((await evaluateWorkflow(f.record, f.req)).result.decision, 'insufficient_information') }
  finally { process.env.CRITERIA_SERVICE_URL = 'https://criteria.example.invalid' }
})

test('HTTP failures, redirects, non-JSON and invalid envelopes require manual review', async () => {
  const f = fixture()
  for (const response of [
    () => new Response('unauthorized', { status: 401 }),
    () => new Response('', { status: 307, headers: { Location: 'https://other.invalid' } }),
    () => new Response('not-json', { headers: { 'Content-Type': 'application/json' } }),
    () => new Response('{}', { headers: { 'Content-Type': 'text/plain' } }),
    () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
  ]) {
    globalThis.fetch = async () => response()
    const snapshot = await evaluateWorkflow(f.record, f.req)
    assert.equal(snapshot.result.decision, 'insufficient_information')
    assert.deepEqual(snapshot.result.matchedCriteria, [])
  }
})

test('response criteria/source/version mismatches fail closed', async () => {
  const f = fixture()
  for (const change of [
    (r) => ({ ...r, engineVersion: 'unknown' }),
    (r) => ({ ...r, timestamp: '2020-01-01T00:00:00Z' }),
    (r) => ({ ...r, pathway: 'nipt-results' }),
    (r) => ({ ...r, criteriaVersions: [] }),
    (r) => ({ ...r, sourceCitations: [] }),
    (r) => ({ ...r, matchedCriteria: [{ id: 'unrequested', version: 'v1', outcome: 'routine_referral' }] }),
    (r) => ({ ...r, criteriaSnapshots: [] }),
  ]) {
    mockService(change)
    const snapshot = await evaluateWorkflow(f.record, f.req)
    assert.equal(snapshot.result.decision, 'insufficient_information')
    assert.equal(snapshot.result.reasonCode, 'invalid_service_response')
  }
})

test('timeout aborts in-flight compute and persists a manual result', async () => {
  const f = fixture()
  let signal
  globalThis.setTimeout = (callback, ms, ...args) => originalTimeout(callback, ms === 5000 ? 5 : ms, ...args)
  globalThis.fetch = async (_url, options) => {
    signal = options.signal
    return await new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
  }
  try {
    const snapshot = await evaluateWorkflow(f.record, f.req)
    assert.equal(signal.aborted, true)
    assert.equal(snapshot.result.decision, 'insufficient_information')
  } finally { globalThis.setTimeout = originalTimeout }
})

test('request origin validation prevents credential forwarding to unsafe URL config', async () => {
  const f = fixture()
  for (const url of ['http://untrusted.invalid', 'https://user:password@example.invalid', 'https://example.invalid/?key=query', 'https://example.invalid/other']) {
    process.env.CRITERIA_SERVICE_URL = url
    let calls = 0
    globalThis.fetch = async () => { calls++; throw new Error('Do not forward credentials') }
    assert.equal((await evaluateWorkflow(f.record, f.req)).result.decision, 'insufficient_information')
    assert.equal(calls, 0)
  }
  process.env.CRITERIA_SERVICE_URL = 'https://criteria.example.invalid'
})

test('digest excludes evaluation time but includes clinical inputs, approved criteria and sources', async () => {
  const f = fixture()
  mockService()
  const first = await evaluateWorkflow(f.record, f.req)
  await delay(10)
  const second = await evaluateWorkflow(f.record, f.req)
  assert.notEqual(first.evaluatedAt, second.evaluatedAt)
  assert.notEqual(first.result.timestamp, second.result.timestamp)
  assert.equal(first.evaluationDigest, second.evaluationDigest)
  f.input.hcrKnownFamilialMutation = false
  const changedInput = await evaluateWorkflow(f.record, f.req)
  assert.notEqual(first.evaluationDigest, changedInput.evaluationDigest)
  f.input.hcrKnownFamilialMutation = true
  f.criterion.plainLanguageRationale = 'Changed approved synthetic rationale'
  approveCriterion(f.criterion, f.guideline)
  const changedRule = await evaluateWorkflow(f.record, f.req)
  assert.notEqual(first.evaluationDigest, changedRule.evaluationDigest)
  f.guideline.sourceVersion = 'test-guide-v2'
  approveGuideline(f.guideline)
  approveCriterion(f.criterion, f.guideline)
  const changedSource = await evaluateWorkflow(f.record, f.req)
  assert.notEqual(changedRule.evaluationDigest, changedSource.evaluationDigest)
  assert.equal(changedSource.result.decision, 'routine_referral')
})

test('incidental unknown response clocks are not persisted or hashed', async () => {
  const f = fixture()
  let counter = 0
  mockService((result) => ({
    ...result, generatedAt: `incidental-${counter++}`,
    matchedCriteria: result.matchedCriteria.map((match) => ({ ...match, generatedAt: `incidental-${counter++}` })),
    criteriaSnapshots: result.criteriaSnapshots.map((snapshot) => ({ ...snapshot, generatedAt: `incidental-${counter++}` })),
  }))
  const first = await evaluateWorkflow(f.record, f.req)
  await delay(5)
  const second = await evaluateWorkflow(f.record, f.req)
  assert.equal(first.evaluationDigest, second.evaluationDigest)
  assert.ok(!JSON.stringify(second).includes('incidental-'))
})

test('unchanged review finalizes after reevaluation with a later server timestamp', async () => {
  const f = hookFixture()
  mockService()
  f.req.context = security.workflowContext(f.req.user, { kind: 'review', key: f.record.workflowKey, revision: f.record.revision })
  const reviewed = await enforceClinicalWorkflow({ req: f.req, data: {}, operation: 'create' })
  Object.assign(f.record, reviewed)
  await delay(10)
  f.req.context = security.workflowContext(f.req.user, { kind: 'finalize', key: f.record.workflowKey, revision: f.record.revision, attested: true, expectedEvaluationDigest: f.record.evaluationSnapshot.evaluationDigest })
  const finalized = await enforceClinicalWorkflow({ req: f.req, data: {}, operation: 'create' })
  assert.equal(finalized.state, 'FINALIZED')
  assert.equal(finalized.decision, 'routine_referral')
  assert.equal(finalized.evaluationSnapshot.evaluationDigest, f.record.evaluationSnapshot.evaluationDigest)
  assert.equal(finalized.signoff.attested, true)
})
