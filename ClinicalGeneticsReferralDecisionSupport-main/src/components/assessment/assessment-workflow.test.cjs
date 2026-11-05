const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

// Exercise the actual dependency-free catalog and hook command handlers. The
// minimal hook host controls renders; this is not a browser or Payload DB test.
function load(file, overrides = {}, cache = new Map()) {
  const absolute = path.resolve(file)
  if (cache.has(absolute)) return cache.get(absolute)
  const output = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  cache.set(absolute, module.exports)
  new Function('module', 'exports', 'require', output)(module, module.exports, (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name]
    if (name.startsWith('@/'))
      return load(path.resolve('src', `${name.slice(2)}.ts`), overrides, cache)
    if (name.startsWith('.'))
      return load(path.resolve(path.dirname(absolute), `${name}.ts`), overrides, cache)
    return require(name)
  })
  cache.set(absolute, module.exports)
  return module.exports
}
const fields = load('src/lib/form-fields.ts')
const { PATHWAYS } = load('src/data/pathways.ts')
const { canFinalizeWorkflow } = load('src/components/assessment/workflow-result-model.ts')
const ancModel = load('src/lib/anc-model.ts')
const slug = 'hereditary-cancer-risk'
const key = 'f0c197c0-36df-4ced-91c7-2ea29e92c123'
function reviewedRecord(decision = 'routine_referral') {
  return {
    id: 'row-3',
    workflowKey: key,
    revision: 3,
    revisionKey: `${key}:3`,
    state: 'IN_REVIEW',
    syntheticPatientReference: 'SYN-test',
    pathwaySlug: slug,
    intake: { consentToAssessment: true },
    pedigree: {},
    anc: {},
    assessmentInputs: {},
    actor: 'provider-test',
    createdAt: '2026-01-01T00:00:00Z',
    evaluationSnapshot: {
      evaluationDigest: 'a'.repeat(64),
      result: {
        decision,
        reviewPending: false,
        containsUnvalidatedCriteria: false,
        missingFields: [],
        validationErrors: [],
        matchedCriteria: [{ id: 'criterion-test', outcome: decision }],
        sourceCitations: [
          { criteriaId: 'criterion-test', source: { url: 'https://example.invalid/test' } },
        ],
      },
    },
  }
}
const tick = () => new Promise((resolve) => setImmediate(resolve))
function host({
  initial = null,
  provider = true,
  saveImpl,
  url = 'https://example.invalid/assessment/hereditary-cancer-risk',
  specialist,
} = {}) {
  let cursor = 0
  let current
  const slots = []
  const pending = []
  const calls = []
  let persisted = initial
  const user = { id: 'staff-test', role: provider ? 'provider' : 'nurse' }
  global.window = {
    location: { href: url },
    confirm: () => true,
    history: {
      state: null,
      replaceState(_state, _unused, next) {
        global.window.location.href = String(next)
      },
    },
  }
  const react = {
    useState(initialValue) {
      const index = cursor++
      if (!Object.hasOwn(slots, index))
        slots[index] = typeof initialValue === 'function' ? initialValue() : initialValue
      return [
        slots[index],
        (next) => {
          slots[index] = typeof next === 'function' ? next(slots[index]) : next
        },
      ]
    },
    useRef(value) {
      const index = cursor++
      if (!Object.hasOwn(slots, index)) slots[index] = { current: value }
      return slots[index]
    },
    useEffect(effect, deps) {
      const index = cursor++
      if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) {
        slots[index] = deps
        pending.push(effect)
      }
    },
  }
  function append(input, state) {
    const revision = input.expectedRevision + 1
    persisted = {
      ...persisted,
      id: `row-${revision}`,
      revision,
      revisionKey: `${input.workflowKey}:${revision}`,
      state,
      reviewNote: input.reviewNote,
      createdAt: '2026-01-01T00:00:00Z',
    }
    if (state === 'IN_REVIEW') persisted.evaluationSnapshot = reviewedRecord().evaluationSnapshot
    return { ok: true, record: persisted }
  }
  const actions = {
    async saveWorkflowDraftAction(input) {
      calls.push(['save', input])
      if (saveImpl) {
        const result = await saveImpl(input)
        if (!result.ok) return result
      }
      persisted = { ...input.draft, workflowKey: input.workflowKey, actor: user.id }
      return append(input, 'DRAFT')
    },
    async loadWorkflowAction(input) {
      calls.push(['load', input])
      return {
        ok: true,
        user,
        records: persisted ? [persisted] : [],
        page: input.page ?? 1,
        hasNextPage: false,
      }
    },
    async submitWorkflowAction(input) {
      calls.push(['submit', input])
      return append(input, 'SUBMITTED')
    },
    async reviewWorkflowAction(input) {
      calls.push(['review', input])
      return append(input, 'IN_REVIEW')
    },
    async returnWorkflowToDraftAction(input) {
      calls.push(['return', input])
      return append(input, 'DRAFT')
    },
    async finalizeWorkflowAction(input) {
      calls.push(['finalize', input])
      return append(input, 'FINALIZED')
    },
  }
  const { useAssessmentWorkflow } = load('src/components/assessment/useAssessmentWorkflow.ts', {
    react,
    '@/app/(frontend)/workflow-actions': actions,
  })
  function render() {
    cursor = 0
    current = useAssessmentWorkflow(slug, provider, specialist)
    return current
  }
  return {
    calls,
    get current() {
      return current
    },
    render,
    async mount() {
      render()
      for (const effect of pending.splice(0)) effect()
      await tick()
      render()
      return current
    },
  }
}

test('six independent raw catalogs share canonical pathway slugs and never invent defaults', () => {
  assert.equal(PATHWAYS.length, 6)
  assert.equal(new Set(PATHWAYS.map((pathway) => pathway.slug)).size, 6)
  assert.deepEqual(fields.emptyClinicalForm(), {})
  assert.deepEqual(fields.formForPatient({ pregnancyStatus: 'not_pregnant' }), {})
  for (const pathway of PATHWAYS) {
    const active = fields.CLINICAL_INTAKE_FIELDS[pathway.slug]
    assert.ok(active.length >= 15)
    assert.ok(active.some((field) => field.type === 'date'))
    assert.ok(active.some((field) => field.type === 'textarea'))
    assert.ok(active.every((field) => field.type !== 'checkbox'))
    assert.deepEqual(
      pathway.fields.map((field) => field.name),
      active.map((field) => field.key),
    )
    const keys = fields.FORM_FIELDS[pathway.slug].map((field) => field.key)
    assert.equal(new Set(keys).size, keys.length)
    assert.deepEqual(fields.parseClinicalInputs(pathway.slug, {}), {})
  }
})

test('parser allowlists fields, retains false and blank distinctly, preserves historical option meanings', () => {
  const result = fields.parseClinicalInputs(slug, {
    hcrKnownFamilialMutation: false,
    hcrBilateralRaw: '',
    hcrPrimaryCountRaw: '0',
    hcrPersonalCancer: 'active_surgical_planning',
  })
  assert.equal(result.hcrKnownFamilialMutation, false)
  assert.equal(result.hcrBilateralRaw, '')
  assert.equal(result.hcrPrimaryCountRaw, '0')
  assert.equal(result.hcrPersonalCancer, 'active_surgical_planning')
  assert.equal(Object.hasOwn(result, 'hcrAshkenaziAncestry'), false)
  assert.throws(() => fields.parseClinicalInputs(slug, { injected: true }))
  assert.throws(() => fields.parseClinicalInputs('toString', {}))
  assert.throws(() => fields.parseClinicalInputs(slug, []))
  assert.throws(() => fields.parseClinicalInputs(slug, { hcrBilateralRaw: false }))
  assert.throws(() => fields.parseClinicalInputs(slug, { hcrKnownFamilialMutation: 'false' }))
})

test('real dates and finite numbers are validated without fabricated clinical ranges', () => {
  for (const value of ['2025-02-29', '2026-02-30', '2026-13-01', 'not-a-date']) {
    assert.throws(() => fields.parseClinicalInputs(slug, { hcrDiagnosisDateRaw: value }))
  }
  assert.equal(
    fields.parseClinicalInputs(slug, { hcrDiagnosisDateRaw: '2024-02-29' }).hcrDiagnosisDateRaw,
    '2024-02-29',
  )
  for (const value of ['NaN', 'Infinity', '12 months', ' ', {}, true])
    assert.throws(() => fields.parseClinicalInputs(slug, { hcrPrimaryCountRaw: value }))
  assert.equal(
    fields.parseClinicalInputs(slug, { hcrDiagnosisAgeRaw: '101' }).hcrDiagnosisAgeRaw,
    '101',
  )
})

test('infertility and loss subflows are independently visible without deleting saved answers', () => {
  const pathway = 'infertility-recurrent-pregnancy-loss'
  const inputs = { reproSubflowRaw: 'infertility', lossClinicalCountRaw: '3' }
  const infertility = fields.visibleIntakeFields(pathway, inputs)
  assert.ok(infertility.some((field) => field.key === 'infDurationMonthsRaw'))
  assert.ok(!infertility.some((field) => field.key === 'lossClinicalCountRaw'))
  const loss = fields.visibleIntakeFields(pathway, { reproSubflowRaw: 'rpl' })
  assert.ok(!loss.some((field) => field.key === 'infDurationMonthsRaw'))
  assert.ok(loss.some((field) => field.key === 'lossClinicalCountRaw'))
  assert.equal(fields.parseClinicalInputs(pathway, inputs).lossClinicalCountRaw, '3')
  assert.equal(
    fields.visibleIntakeFields(pathway, {}).some((field) => field.subflow),
    false,
  )
})

test('mounting, editing, and re-rendering never save or evaluate', async () => {
  const h = host()
  await h.mount()
  h.current.changeReference('SYN-test')
  h.current.changeInput('hcrPrimaryCountRaw', '1')
  h.render()
  await tick()
  h.render()
  assert.deepEqual(h.calls, [])
})

test('synchronous ref lock prevents same-tick duplicate writes and retains key across revisions', async () => {
  let release
  const wait = new Promise((resolve) => {
    release = resolve
  })
  const h = host({
    saveImpl: async () => {
      await wait
      return { ok: true }
    },
  })
  await h.mount()
  h.current.changeReference('SYN-test')
  h.render()
  const first = h.current.save()
  const duplicate = h.current.save()
  assert.equal(h.calls.filter(([name]) => name === 'save').length, 1)
  release()
  await Promise.all([first, duplicate])
  h.render()
  assert.equal(h.current.record.revision, 1)
  assert.equal(h.calls[0][1].expectedRevision, 0)
  await h.current.save()
  h.render()
  assert.equal(h.calls[1][1].workflowKey, h.calls[0][1].workflowKey)
  assert.equal(h.calls[1][1].expectedRevision, 1)
})

test('failed save retains inputs and stable workflow key and never claims success', async () => {
  const h = host({
    saveImpl: async () => ({
      ok: false,
      error: 'Revision conflict',
      fieldErrors: { expectedRevision: 'Reload' },
    }),
  })
  await h.mount()
  h.current.changeReference('SYN-test')
  h.current.changeInput('hcrDiagnosisAgeRaw', '42')
  h.render()
  await h.current.save()
  h.render()
  assert.equal(h.current.record, null)
  assert.equal(h.current.inputs.hcrDiagnosisAgeRaw, '42')
  assert.equal(h.current.notice, '')
  assert.equal(h.current.error, 'Revision conflict')
  await h.current.save()
  assert.equal(h.calls[0][1].workflowKey, h.calls[1][1].workflowKey)
})

test('resume is read-only and subsequent saves use the returned revision and all sections', async () => {
  const initial = {
    ...reviewedRecord(),
    state: 'DRAFT',
    evaluationSnapshot: null,
    pedigree: {},
    anc: ancModel.createEmptyRoutineAnc(),
  }
  const h = host({ initial, url: `https://example.invalid/assessment/${slug}?workflow=${key}` })
  await h.mount()
  assert.deepEqual(
    h.calls.map(([name]) => name),
    ['load'],
  )
  assert.equal(h.current.record.revision, 3)
  h.current.changeInput('hcrPrimaryCountRaw', '2')
  h.render()
  await h.current.save()
  const save = h.calls.find(([name]) => name === 'save')[1]
  assert.equal(save.expectedRevision, 3)
  assert.equal(save.workflowKey, key)
  assert.deepEqual(save.draft.anc, initial.anc)
  assert.equal(save.draft.assessmentInputs.hcrPrimaryCountRaw, '2')
})

test('save and submit never review implicitly; review is a separate explicit command', async () => {
  const h = host()
  await h.mount()
  h.current.changeReference('SYN-test')
  h.current.changeIntake({ consentToAssessment: true })
  h.render()
  await h.current.submit()
  h.render()
  assert.deepEqual(
    h.calls.map(([name]) => name),
    ['save', 'submit'],
  )
  assert.equal(h.current.record.state, 'SUBMITTED')
  await h.current.transition('review')
  h.render()
  assert.deepEqual(
    h.calls.map(([name]) => name),
    ['save', 'submit', 'review'],
  )
  assert.equal(h.calls[2][1].expectedRevision, 2)
})

test('only complete primary snapshots can finalize, never a pending or evidence-free no-referral result', () => {
  for (const outcome of ['urgent_referral', 'routine_referral', 'no_referral_needed'])
    assert.equal(canFinalizeWorkflow(reviewedRecord(outcome)), true)
  for (const outcome of [
    'borderline_consideration',
    'insufficient_information',
    'criteria_pending_approval',
    'unknown',
  ])
    assert.equal(canFinalizeWorkflow(reviewedRecord(outcome)), false)
  for (const patch of [
    { reviewPending: true },
    { containsUnvalidatedCriteria: true },
    { missingFields: ['test'] },
    { validationErrors: [{ message: 'test' }] },
    { matchedCriteria: [] },
    { sourceCitations: [] },
  ]) {
    const record = reviewedRecord('no_referral_needed')
    Object.assign(record.evaluationSnapshot.result, patch)
    assert.equal(canFinalizeWorkflow(record), false)
  }
  assert.equal(canFinalizeWorkflow(null), false)
  assert.equal(canFinalizeWorkflow({ ...reviewedRecord(), state: 'SUBMITTED' }), false)
})

test('nurse cannot invoke clinical transitions even if a client handler is called directly', async () => {
  const h = host({
    initial: reviewedRecord(),
    provider: false,
    url: `https://example.invalid/assessment/${slug}?workflow=${key}`,
  })
  await h.mount()
  for (const kind of ['review', 'return', 'finalize', 'specialist']) {
    await h.current.transition(kind)
    h.render()
  }
  assert.deepEqual(
    h.calls.map(([name]) => name),
    ['load'],
  )
  assert.match(h.current.error, /Only a provider/)
})

test('finalization requires clinician note, attestation, and current digest', async () => {
  const h = host({
    initial: reviewedRecord('no_referral_needed'),
    url: `https://example.invalid/assessment/${slug}?workflow=${key}`,
  })
  await h.mount()
  await h.current.transition('finalize')
  h.render()
  assert.equal(h.calls.length, 1)
  h.current.setReviewNote('Reviewed persisted inputs and sources; approval documented.')
  h.render()
  h.current.setAttest(true)
  h.render()
  await h.current.transition('finalize')
  h.render()
  assert.equal(h.calls[1][0], 'finalize')
  assert.equal(h.calls[1][1].expectedEvaluationDigest, 'a'.repeat(64))
  assert.equal(h.calls[1][1].attest, true)
  assert.equal(h.calls[1][1].expectedRevision, 3)
  assert.match(h.current.notice, /No-referral decision saved/)
})

test('specialist handoff is fail-closed when unavailable, and requires a documented reason', async () => {
  const h = host({
    initial: reviewedRecord('insufficient_information'),
    url: `https://example.invalid/assessment/${slug}?workflow=${key}`,
  })
  await h.mount()
  h.current.setReviewNote('Missing original report; specialist advice needed.')
  h.render()
  await h.current.transition('specialist')
  h.render()
  assert.match(h.current.error, /not connected/)
  assert.equal(h.current.notice, '')
  assert.equal(h.calls.length, 1)
})

test('invalid ANC edits block saving the last valid context and do not erase the editable child draft', async () => {
  const h = host()
  await h.mount()
  h.current.changeReference('SYN-test')
  const invalid = ancModel.createEmptyRoutineAnc()
  invalid.booking.bookingDate = '2026-02-30'
  h.current.changeAnc(invalid)
  h.render()
  assert.ok(h.current.ancError)
  await h.current.save()
  h.render()
  assert.equal(h.calls.length, 0)
  assert.match(h.current.error, /Correct Routine ANC/)
  h.current.changeAnc(ancModel.createEmptyRoutineAnc())
  h.render()
  assert.equal(h.current.ancError, '')
})
