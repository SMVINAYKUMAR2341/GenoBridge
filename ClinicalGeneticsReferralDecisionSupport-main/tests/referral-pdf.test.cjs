const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

function loadTS(path, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', 'require', code)(module, module.exports,
    (name) => Object.hasOwn(imports, name) ? imports[name] : require(name))
  return module.exports
}
const security = loadTS('src/lib/workflow-security.ts')
const engine = loadTS('src/lib/decision-engine.ts')
const fields = loadTS('src/lib/form-fields.ts', { './decision-engine': engine })
const governance = loadTS('src/lib/workflow-governance.ts', {
  '../access/clinical': {}, './form-fields': fields, './workflow-security': security,
  './workflow-store': {},
})
const pedigree = loadTS('src/components/clinical/pedigree-model.ts')
const anc = loadTS('src/lib/anc-model.ts')
const pdf = loadTS('src/lib/referral-pdf.ts', {
  './workflow-governance': governance, './form-fields': fields, './anc-model': anc,
  '../components/clinical/pedigree-model': pedigree,
})
const key = '12345678-1234-4234-8234-123456789abc'
const at = '2026-11-04T12:00:00.000Z'
function seal(workflow) {
  const snapshot = workflow.evaluationSnapshot
  const { evaluationDigest: _old, evaluatedAt: _time, ...stable } = snapshot
  const { timestamp: _stamp, ...result } = snapshot.result
  snapshot.evaluationDigest = governance.digest({ ...stable, result })
  workflow.signoff.evaluationDigest = snapshot.evaluationDigest
  return workflow
}
function fixture(decision = 'urgent_referral') {
  const model = pedigree.createDemoPedigree()
  model.people[0].deceased = true
  model.people[0].ageAtDeath = '78'
  model.people[0].causeOfDeath = 'Synthetic cause'
  model.people[2].conditions = [
    { name: 'Synthetic condition A', status: 'affected' },
    { name: 'Synthetic condition B', status: 'carrier' },
  ]
  model.people[5].outcome = 'miscarriage'
  model.people[5].gestationalWeeks = 9
  model.people[6].outcome = 'stillbirth'
  const antenatal = anc.createEmptyRoutineAnc()
  antenatal.histories.medical = 'Synthetic medical history'
  antenatal.histories.family = 'Synthetic family history'
  antenatal.histories.genetic = 'Synthetic genetic tests'
  antenatal.cbc = [{ ...anc.emptySection('cbc'), id: 'cbc-1', haemoglobin: 11.2, laboratory: 'Synthetic lab' }]
  antenatal.documents = [{ ...anc.emptySection('documents'), id: 'doc-1', title: 'Synthetic report', fileName: 'synthetic-report.pdf', externalReference: 'DO NOT FETCH', sizeBytes: 100 }]
  const workflow = {
    id: 'workflow-1', workflowKey: key, revision: 4, revisionKey: `${key}:4`,
    state: 'FINALIZED', patient: null, syntheticPatientReference: 'SYN-export', pathwaySlug: 'nipt-results',
    actor: 'provider-1', createdAt: at,
    intake: { presentingConcern: 'Synthetic concern', consentToAssessment: true, gravida: 0, notes: 'Synthetic intake history' },
    assessmentInputs: { niptFinding: 'high_risk_common_trisomy', niptFetalFraction: 0, niptEstimatedPpv: '', niptGestationalWeeks: 12 },
    pedigree: model, anc: antenatal, reviewNote: 'Synthetic reviewer note',
    signoff: { signatureId: 'signature-1', actor: 'provider-1', name: 'Synthetic Reviewer', role: 'provider', at, attested: true, synthetic: true },
  }
  workflow.evaluationSnapshot = {
    engineVersion: 'governed-workflow-v2', evaluatedAt: at,
    inputs: structuredClone(workflow.assessmentInputs), intake: structuredClone(workflow.intake),
    pedigree: structuredClone(model), anc: structuredClone(antenatal),
    patient: { syntheticPatientReference: workflow.syntheticPatientReference },
    criteria: [{ id: 'rule-1', version: 'v2', guideline: { content: { sourceVersion: '2026', sourceURL: 'https://example.org/synthetic' } } }],
    result: {
      decision, reviewPending: false, containsUnvalidatedCriteria: false,
      referralTarget: 'Synthetic genetics service', rationale: 'Synthetic matched criterion reasoning',
      engineVersion: 'test-engine', reasonCode: 'matched_criteria', timestamp: at,
      guidelineCitations: 'Synthetic guideline v2026, section 3', criteriaVersions: { 'rule-1': 'v2' },
      matchedCriteria: [{ code: 'SYN-rule', title: 'Synthetic criterion', version: 'v2', outcome: decision, guidelineCitation: 'Synthetic citation' }],
      sourceCitations: [{ criteriaId: 'rule-1', source: { org: 'Synthetic org', title: 'Synthetic guideline', guidelineVersion: '2026', date: '2026-01-01', page: '10', section: '3', url: 'https://example.org/synthetic' } }],
    },
  }
  workflow.decision = decision
  return seal(workflow)
}
function verifyBytes(bytes) {
  assert.ok(Buffer.isBuffer(bytes))
  const text = bytes.toString('latin1')
  assert.equal(text.slice(0, 8), '%PDF-1.4')
  assert.ok(text.endsWith('%%EOF\n'))
  const xrefOffset = Number(/startxref\n(\d+)\n%%EOF/.exec(text)[1])
  assert.equal(bytes.subarray(xrefOffset, xrefOffset + 5).toString(), 'xref\n')
  const xref = /^xref\n0 (\d+)\n([\s\S]*?)trailer\n/.exec(text.slice(xrefOffset))
  const lines = xref[2].slice(0, -1).split('\n')
  assert.equal(lines.length, Number(xref[1]))
  assert.match(lines[0], /^0000000000 65535 f/)
  lines.slice(1).forEach((line, index) => {
    assert.match(line, /^\d{10} 00000 n /)
    const offset = Number(line.slice(0, 10))
    const expected = `${index + 1} 0 obj\n`
    assert.equal(bytes.subarray(offset, offset + expected.length).toString(), expected)
  })
  const streamMatches = [...text.matchAll(/<< \/Length (\d+) >>\nstream\n/g)]
  for (const match of streamMatches) {
    const offset = match.index + match[0].length
    assert.equal(bytes.subarray(offset + Number(match[1]), offset + Number(match[1]) + 9).toString(), 'endstream')
  }
  const count = Number(/\/Type \/Pages \/Kids \[[^\]]*\] \/Count (\d+)/.exec(text)[1])
  assert.equal(count, streamMatches.length)
  assert.equal(count, [...text.matchAll(/\/Type \/Page /g)].length)
  assert.ok(count > 1)
  return text
}

test('valid PDF objects, byte offsets, streams, page tree and important summary sections for all primary outcomes', () => {
  for (const decision of ['urgent_referral', 'routine_referral', 'no_referral_needed']) {
    const workflow = fixture(decision)
    const text = verifyBytes(pdf.generateReferralPdf(workflow, new Date(at)))
    for (const expected of [
      'Clinical genetics referral decision summary', 'SYNTHETIC DATA ONLY', 'Generated at',
      'Synthetic reference', 'SYN-export', 'FINALIZED', 'Clinical intake and history',
      'Synthetic intake history', 'Clinical assessment inputs', 'Cell-free DNA screening result',
      'high_risk_common_trisomy', 'Matched criteria', 'Synthetic matched criterion reasoning',
      'Synthetic citation', 'Synthetic guideline v2026', 'Source citations', 'Guideline Version',
      'Reviewer signoff and attestation', 'Synthetic Reviewer', 'Attested: Yes', 'Evaluation digest',
      'Routine ANC', 'Medical history', 'Synthetic medical history', 'Synthetic genetic tests',
      'Haemoglobin', 'Synthetic lab', 'File name', 'synthetic-report.pdf', 'metadata only',
      'Vector pedigree', 'Square: male', 'Double partner line', 'Family panel',
      'Synthetic condition A', 'Synthetic condition B', '[affected]', '[carrier]', 'miscarriage', 'stillbirth',
      'Appendix A', 'Appendix B', 'Appendix C', 'Synthetic reviewer note', 'Source verification: pending',
    ]) assert.ok(text.includes(expected), `Missing ${expected} for ${decision}`)
    assert.ok(text.includes(workflow.evaluationSnapshot.evaluationDigest))
    assert.ok(/ c h f/.test(text)) // carrier dot
    assert.match(text, / m .* c .* c .* c .* c h B/) // circle
    assert.match(text, / 20 20 re B/) // square
    assert.match(text, /\(C\) Tj/)
    assert.match(text, / m .* l h B/) // diamond/triangle
    assert.ok(text.includes('230 650 m 360 650 l S\n230 654 m 360 654 l S'))
  }
})

test('empty sections, explicit false/zero, escaped PDF injection, Unicode, long words and pagination are preserved', () => {
  const workflow = fixture()
  workflow.pedigree = pedigree.createEmptyPedigree()
  workflow.anc = {}
  workflow.intake.notes = 'Escaped (test) \\ endstream\nBT /F1 99 Tf (INJECT) Tj ET ' + 'A'.repeat(12000) + ' \u03b1 \u{1F9EC}'
  workflow.intake.consentToAssessment = false
  Object.assign(workflow.evaluationSnapshot, { pedigree: workflow.pedigree, anc: workflow.anc, intake: workflow.intake })
  seal(workflow)
  const text = verifyBytes(pdf.generateReferralPdf(workflow))
  assert.ok(text.includes('Consent To Assessment: No'))
  assert.ok(text.includes('Fetal fraction \\(%\\) [niptFetalFraction]: 0'))
  assert.ok(text.includes('\\\\u{3B1}'))
  assert.ok(text.includes('\\\\u{1F9EC}'))
  assert.ok(text.includes('Escaped \\(test\\) \\\\ endstream'))
  assert.ok(text.includes('Not supplied'))
  assert.ok(text.includes('None recorded'))
  const pages = Number(/\/Count (\d+)/.exec(text)[1])
  assert.ok(pages > 8)
})

test('dense pedigrees paginate every sibling without discarding conditions or structured relationships', () => {
  const workflow = fixture()
  const model = pedigree.createEmptyPedigree()
  model.people = [
    { ...pedigree.createPedigreePerson('parent-1'), name: 'Synthetic parent one', sex: 'male' },
    { ...pedigree.createPedigreePerson('parent-2'), name: 'Synthetic parent two', sex: 'female' },
    ...Array.from({ length: 30 }, (_, i) => ({ ...pedigree.createPedigreePerson(`child-${i}`, 2),
      name: `Synthetic child ${i}`, outcome: ['ongoing', 'elective-abortion', 'miscarriage', 'stillbirth', 'liveborn'][i % 5],
      conditions: [{ name: `Unique-condition-${i}`, status: i % 2 ? 'carrier' : 'affected' }] })),
  ]
  model.families = [{ id: 'dense-family', parents: ['parent-1', 'parent-2'], children: model.people.slice(2).map((p) => p.id), consanguineous: true }]
  workflow.pedigree = model; workflow.evaluationSnapshot.pedigree = model; seal(workflow)
  const text = verifyBytes(pdf.generateReferralPdf(workflow))
  assert.ok(text.includes('part 6/6'))
  for (let i = 0; i < 30; i++) assert.ok(text.includes(`Unique-condition-${i}`))
  assert.match(text, /\(P\) Tj/)
  assert.match(text, /\(SB\) Tj/)
  assert.ok(text.includes('Parents [1]: parent-1'))
  assert.ok(text.includes('Children [30]: child-29'))
})

test('unsigned, stale, pending, altered and real-patient workflows fail closed', () => {
  const mutations = [
    (w) => { w.state = 'IN_REVIEW' }, (w) => { w.signoff = null },
    (w) => { w.signoff.attested = false }, (w) => { w.signoff.synthetic = false },
    (w) => { w.signoff.name = ' ' }, (w) => { w.signoff.actor = 'other' },
    (w) => { w.signoff.role = 'admin' }, (w) => { w.signoff.signatureId = '' },
    (w) => { w.signoff.at = 'invalid' }, (w) => { w.signoff.evaluationDigest = '0'.repeat(64) },
    (w) => { w.evaluationSnapshot.result.rationale = 'tampered' },
    (w) => { w.assessmentInputs.niptFetalFraction = 99 },
    (w) => { w.pedigree.people[0].notes = 'changed since signing' },
    (w) => { w.patient = 'real-patient' }, (w) => { w.syntheticPatientReference = 'real' },
    (w) => { w.decision = 'routine_referral' },
    ...['borderline_consideration', 'criteria_pending_approval', 'insufficient_information'].map((outcome) => (w) => {
      w.decision = outcome; w.evaluationSnapshot.result.decision = outcome; seal(w)
    }),
    (w) => { w.evaluationSnapshot.result.reviewPending = true; seal(w) },
    (w) => { w.evaluationSnapshot.result.containsUnvalidatedCriteria = true; seal(w) },
  ]
  for (const mutate of mutations) {
    const workflow = fixture(); mutate(workflow)
    assert.throws(() => pdf.generateReferralPdf(workflow))
  }
})

function routeHarness(options = {}) {
  const calls = []
  const user = { id: 'provider-1', collection: 'users', name: 'Synthetic Provider', enabled: true, role: 'provider', ...options.user }
  const workflows = options.workflows ?? [fixture()]
  const store = {
    async findByID(args) { calls.push(['findByID', args]); if (options.lookupError) throw Error('SECRET token=private'); return user },
    async find(args) {
      calls.push(['find', args])
      if (options.findError) throw Error('SECRET patient detail')
      return { docs: [...workflows].sort((a, b) => b.revision - a.revision).slice(0, args.limit) }
    },
    async create(args) {
      calls.push(['create', args])
      assert.equal(args.collection, 'audit-logs', 'GET must not create domain records')
      assert.equal(security.commandFor({ user: args.user, context: args.context }).kind, 'audit')
      if (options.auditError) throw Error('SECRET audit details')
      return { id: 'audit-1' }
    },
  }
  const route = loadTS('src/app/(frontend)/api/referrals/[workflowKey]/route.ts', {
    '@/lib/app-auth': { appAuth: { async currentUser() { return Object.hasOwn(options, 'session') ? options.session : user } } },
    '@/lib/payload': { async getPayloadClient() { return store } },
    '@/lib/workflow-store': { workflowStore: (p) => p, payloadWorkflowUser: (u) => u },
    '@/lib/workflow-security': security, '@/lib/referral-pdf': pdf,
  })
  return { calls, user, run: (workflowKey = key) => route.GET(new Request('https://example.org/api/referrals/' + workflowKey + '?decision=no_referral_needed'), { params: Promise.resolve({ workflowKey }) }) }
}

test('GET returns downloadable persisted PDF, refreshes identity, uses collection access and audits', async () => {
  for (const outcome of ['urgent_referral', 'routine_referral', 'no_referral_needed']) {
    const h = routeHarness({ workflows: [fixture(outcome)] })
    const response = await h.run()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'application/pdf')
    assert.match(response.headers.get('content-disposition'), /^attachment; filename="clinical-genetics-referral.pdf"$/)
    assert.ok(!response.headers.get('content-disposition').includes('SYN-export'))
    assert.match(response.headers.get('cache-control'), /private, no-store/)
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(response.headers.get('vary'), 'Cookie')
    const bytes = Buffer.from(await response.arrayBuffer())
    verifyBytes(bytes)
    assert.equal(response.headers.get('content-length'), String(bytes.length))
    assert.equal(h.calls[0][0], 'findByID')
    for (const [, args] of h.calls) assert.equal(args.overrideAccess, false)
    const query = h.calls.find(([name]) => name === 'find')[1]
    assert.equal(query.sort, '-revision'); assert.equal(query.limit, 1)
    assert.deepEqual(query.where, { workflowKey: { equals: key } })
    assert.equal(query.user, h.calls.find(([name]) => name === 'create')[1].user)
    const audit = h.calls.find(([name]) => name === 'create')[1]
    assert.equal(audit.data.actionType, 'REFERRAL_GENERATED')
    assert.equal(audit.data.actorRole, 'OB/GYN Provider')
    assert.equal(audit.data.resourceRef, 'workflow-1')
    assert.ok(!audit.data.details.includes('Synthetic concern'))
    assert.equal(h.calls.filter(([name]) => name === 'create').length, 1)
  }
})

test('GET denies anonymous, disabled, nurse, admin and revoked/stale-session privileges', async () => {
  for (const options of [
    { session: null }, { user: { enabled: false } }, { user: { enabled: undefined } },
    { user: { role: 'nurse' } }, { user: { role: 'admin' } },
    { session: { id: 'admin', collection: 'admins' } },
    { session: { id: 'provider-1', collection: 'users', role: 'provider' }, user: { role: 'nurse' } },
    { lookupError: true },
  ]) {
    const h = routeHarness(options), response = await h.run()
    assert.ok([401, 403].includes(response.status))
    assert.ok(!h.calls.some(([name]) => name === 'find' || name === 'create'))
    assert.match(response.headers.get('cache-control'), /no-store/)
    assert.equal((await response.json()).error, 'Referral download unavailable.')
  }
})

test('GET rejects invalid keys, inaccessible/missing workflows, latest unsigned revision and malformed signoff', async () => {
  const invalid = routeHarness()
  assert.equal((await invalid.run('../../private')).status, 400)
  assert.ok(!invalid.calls.some(([name]) => name === 'find'))
  assert.equal((await routeHarness({ workflows: [] }).run()).status, 404)
  const older = fixture(), latest = fixture()
  latest.revision = 5; latest.state = 'DRAFT'; latest.signoff = null
  const h = routeHarness({ workflows: [older, latest] })
  assert.equal((await h.run()).status, 409)
  assert.ok(!h.calls.some(([name]) => name === 'create'))
  const malformed = fixture(); malformed.signoff.name = ''
  assert.equal((await routeHarness({ workflows: [malformed] }).run()).status, 409)
})

test('GET fails closed on audit/storage errors and never returns exception secrets', async () => {
  for (const options of [{ auditError: true }, { findError: true }]) {
    const h = routeHarness(options), response = await h.run()
    assert.equal(response.status, 500)
    assert.match(response.headers.get('cache-control'), /no-store/)
    assert.deepEqual(await response.json(), { error: 'Referral download unavailable.' })
    assert.equal(response.headers.get('content-disposition'), null)
  }
})
