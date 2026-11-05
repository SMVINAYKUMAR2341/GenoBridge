const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

function loadTS(path, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  new Function('module', 'exports', 'require', code)(
    module,
    module.exports,
    (name) => imports[name] || require(name),
  )
  return module.exports
}
const engine = loadTS('src/lib/decision-engine.ts')
const fields = loadTS('src/lib/form-fields.ts', { './decision-engine': engine })
const access = loadTS('src/access/clinical.ts')
const rows = [
  [
    'hereditary-cancer-risk',
    'hcr',
    [
      ['hcr_urgent_active_or_known_variant', { hcrKnownFamilialMutation: true }],
      ['hcr_routine_family_criteria', { hcrFirstDegreeEarlyBreastOrOvarian: true }],
      ['hcr_borderline_limited_history', { hcrLimitedFamilyOrSingleSecondDegree: true }],
    ],
  ],
  [
    'preconception-carrier-screening',
    'pcs',
    [
      [
        'pcs_urgent_pregnant_concordant_or_xlinked',
        {
          pcsPatientStatus: 'ar_carrier_positive',
          pcsPartnerStatus: 'concordant_positive',
          pcsIsPregnant: true,
        },
      ],
      ['pcs_routine_preconception_carrier', { pcsPatientStatus: 'ar_carrier_positive' }],
      ['pcs_borderline_mild_or_vus', { pcsPatientStatus: 'vus_or_mild_allele' }],
    ],
  ],
  [
    'nipt-results',
    'nipt',
    [
      ['nipt_urgent_high_risk_aneuploidy', { niptFinding: 'high_risk_common_trisomy' }],
      ['nipt_routine_low_ff_or_microdeletion', { niptFinding: 'repeat_low_ff_or_microdeletion' }],
      ['nipt_borderline_single_nocall', { niptFinding: 'single_early_nocall' }],
    ],
  ],
  [
    'abnormal-ultrasound-findings',
    'us',
    [
      ['us_urgent_structural_or_nt', { usFindingCategory: 'major_structural_or_nt_ge_3' }],
      [
        'us_routine_soft_marker_unscreened',
        { usFindingCategory: 'isolated_high_lr_soft_marker_unscreened' },
      ],
      [
        'us_borderline_sua_or_utd_lowrisk',
        { usFindingCategory: 'isolated_sua_utd_eif_with_neg_nipt' },
      ],
    ],
  ],
  [
    'infertility-recurrent-pregnancy-loss',
    'rpl',
    [
      [
        'rpl_urgent_translocation_or_active_cycle',
        { rplCytogenetics: 'parental_translocation_or_abnormal_poc' },
      ],
      ['rpl_routine_two_losses_or_poi_male', { rplClinicalLosses: '2_or_more_clinical' }],
      ['rpl_borderline_biochemical_only', { rplClinicalLosses: 'biochemical_only' }],
    ],
  ],
  [
    'positive-family-history',
    'fhx',
    [
      [
        'fhx_urgent_pregnant_known_disorder',
        { fhxConditionType: 'known_monogenic_or_xlinked', fhxIsPregnant: true },
      ],
      ['fhx_routine_family_genetic_condition', { fhxConditionType: 'id_mca_or_consanguinity' }],
      [
        'fhx_borderline_distant_or_multifactorial',
        { fhxConditionType: 'distant_unverified_or_multifactorial' },
      ],
    ],
  ],
]
const outcomes = ['urgent_referral', 'routine_referral', 'borderline_consideration']
function rule(slug, triggerKey, urgencyOutcome, extra = {}) {
  return {
    id: triggerKey,
    code: triggerKey,
    pathwaySlug: slug,
    triggerKey,
    urgencyOutcome,
    referralTarget: 'Test specialist',
    plainLanguageRationale: 'Test-only reasoning',
    guidelineCitation: 'Test-only source',
    versionNumber: 'test',
    approvalAttested: false,
    validationStatus: 'unvalidated_placeholder',
    ...extra,
  }
}
for (const [slug, prefix, cases] of rows) {
  cases.forEach(([key, patch], index) =>
    test(`${slug}: ${outcomes[index]}`, () => {
      const c = rule(slug, key, ['urgent', 'routine', 'borderline'][index])
      const result = engine.evaluateClinicalDecision(slug, undefined, [c], {
        ...fields.emptyClinicalForm(),
        ...patch,
      })
      assert.equal(result.decision, outcomes[index])
      assert.equal(result.referralTarget, c.referralTarget)
      assert.equal(result.rationale, c.plainLanguageRationale)
      assert.equal(result.guidelineCitations, c.guidelineCitation)
      assert.equal(result.containsUnvalidatedCriteria, true)
    }),
  )
  test(`${slug}: explicit baseline is required for no referral`, () => {
    const form = fields.emptyClinicalForm()
    const conditions = fields.FORM_FIELDS[slug]
      .filter((f) => f.type !== 'text' && f.type !== 'number')
      .map((f) => ({ field: f.key, equals: form[f.key] }))
    const c = rule(slug, `${prefix}_baseline`, 'none', { conditions })
    const result = engine.evaluateClinicalDecision(slug, undefined, [c], form)
    assert.equal(result.decision, 'no_referral_needed')
    assert.equal(result.referralTarget, c.referralTarget)
    assert.equal(result.rationale, c.plainLanguageRationale)
    assert.equal(result.containsUnvalidatedCriteria, true)
    assert.equal(
      engine.evaluateClinicalDecision(slug, undefined, [], form).decision,
      'borderline_consideration',
    )
  })
}
test('sample validated labels without specialist attestation are still unvalidated', () => {
  const c = rule('nipt-results', 'nipt_urgent_high_risk_aneuploidy', 'urgent', {
    validationStatus: 'validated',
  })
  assert.equal(
    engine.evaluateClinicalDecision('nipt-results', undefined, [c], {
      ...fields.emptyClinicalForm(),
      niptFinding: 'high_risk_common_trisomy',
    }).containsUnvalidatedCriteria,
    true,
  )
})
test('editable conditions affect matching and urgent rules win', () => {
  const a = rule('nipt-results', 'custom-a', 'routine', {
    conditions: [{ field: 'niptFinding', equals: 'high_risk_common_trisomy' }],
  })
  const b = rule('nipt-results', 'custom-b', 'urgent', { conditions: a.conditions })
  const form = { ...fields.emptyClinicalForm(), niptFinding: 'high_risk_common_trisomy' }
  assert.equal(
    engine.evaluateClinicalDecision('nipt-results', undefined, [a, b], form).matchedCriteria[0].id,
    b.id,
  )
  a.conditions = [{ field: 'niptFinding', equals: 'low_risk' }]
  assert.equal(
    engine.evaluateClinicalDecision('nipt-results', undefined, [a], form).decision,
    'borderline_consideration',
  )
})
test('structured server input rejects invalid enums and numeric values', () => {
  const form = fields.emptyClinicalForm()
  assert.throws(() =>
    fields.parseClinicalInputs('nipt-results', { ...form, niptFinding: 'invented' }),
  )
  assert.throws(() =>
    fields.parseClinicalInputs('nipt-results', { ...form, niptFetalFraction: '-9' }),
  )
  assert.throws(() => fields.parseClinicalInputs('invalid-pathway', form))
  assert.equal(fields.parseClinicalInputs('nipt-results', form).niptFinding, 'low_risk')
})
test('private records and specialist approval enforce server roles', () => {
  const req = (user) => ({ req: { user } })
  assert.equal(access.clinicalStaff(req(null)), false)
  assert.equal(access.clinicalStaff(req({ collection: 'users', role: 'provider' })), true)
  assert.equal(access.specialist(req({ collection: 'users', role: 'provider' })), false)
  assert.equal(access.specialist(req({ collection: 'users', role: 'admin' })), true)
  assert.equal(access.clinicalStaff(req({ collection: 'admins' })), false)
  assert.equal(
    access.clinicalStaff(req({ collection: 'users', role: 'provider', enabled: false })),
    false,
  )
  assert.equal(
    access.specialist(req({ collection: 'users', role: 'admin', enabled: false })),
    false,
  )
})
test('changing patient clears prior findings and prefills only known pregnancy context', () => {
  const form = fields.formForPatient({
    pregnancyStatus: 'pregnant_first_trimester',
    gestationalAgeWeeks: 12,
  })
  assert.equal(form.pcsIsPregnant, true)
  assert.equal(form.fhxIsPregnant, true)
  assert.equal(form.niptGestationalWeeks, '12')
  assert.equal(form.hcrKnownFamilialMutation, false)
  assert.equal(form.hcrRelativeDetails, '')
  assert.equal(fields.formForPatient().pcsIsPregnant, false)
})
test('assessment snapshots can only be created by the server workflow and cannot be updated', () => {
  const { Assessments } = loadTS('src/collections/Assessments.ts', {
    '../lib/cache': { CACHE_TAGS: {}, invalidateClinicalCache() {} },
    '../access/clinical': access,
    '../hooks/clinical-audit': { logRecordRead() {}, logWorkflowChange() {} },
  })
  const untrusted = { req: { user: { collection: 'users', role: 'provider' }, context: {} } }
  const internal = { req: { ...untrusted.req, context: { assessmentWorkflow: true } } }
  assert.equal(Assessments.access.create(untrusted), false)
  assert.equal(Assessments.access.create(internal), true)
  const decision = Assessments.fields.find((f) => f.name === 'decision')
  assert.equal(decision.access.create(untrusted), false)
  assert.equal(decision.access.create(internal), true)
  assert.equal(decision.access.update(internal), false)
})
