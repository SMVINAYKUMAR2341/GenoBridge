import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { resolve, dirname } from 'node:path'
import { SourceTextModule, SyntheticModule, type Module } from 'node:vm'

// Dependency-free hook tests for exported checkout environments. This exercises
// real source, not a second implementation. It does not replace Payload DB tests.
// Run: node --experimental-vm-modules --test src/lib/workflow-invariants.test.ts
const cache = new Map<string, Module>()
async function moduleAt(path: string): Promise<Module> {
  const existing = cache.get(path)
  if (existing) return existing
  if (path.startsWith('node:')) {
    const native = await import(path)
    const mod = new SyntheticModule(Object.keys(native), function () {
      for (const key of Object.keys(native)) this.setExport(key, native[key])
    }, { identifier: path })
    cache.set(path, mod)
    return mod
  }
  const source = stripTypeScriptTypes(readFileSync(path, 'utf8'), { mode: 'transform' })
  const mod = new SourceTextModule(source, { identifier: path })
  cache.set(path, mod)
  return mod
}
async function load(path: string): Promise<Record<string, any>> {
  const mod = await moduleAt(resolve(path))
  if (mod.status === 'unlinked') await mod.link((specifier, parent) => moduleAt(specifier.startsWith('node:') ? specifier : specifier.startsWith('@/') ? resolve('src', `${specifier.slice(2)}.ts`) : resolve(dirname(parent.identifier), `${specifier}.ts`)))
  if (mod.status === 'linked') await mod.evaluate()
  return mod.namespace as unknown as Record<string, any>
}
const security = await load('src/lib/workflow-security.ts')
const access = await load('src/access/clinical.ts')
const governance = await load('src/lib/workflow-governance.ts')
const privacy = await load('src/lib/workflow-privacy.ts')
const validation = await load('src/lib/workflow-validation.ts')
const fields = await load('src/lib/form-fields.ts')
const workflowHook = (await load('src/hooks/clinical-workflow.ts')).enforceClinicalWorkflow
const governanceHook = (await load('src/hooks/clinical-governance.ts')).governClinicalContent
let actionUser: any = null
let actionPayload: any = null
for (const [path, exports] of [
  ['src/lib/app-auth.ts', { appAuth: { currentUser: async () => actionUser } }],
  ['src/lib/payload.ts', { getPayloadClient: async () => actionPayload }],
] as const) {
  const mod = new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value)
  }, { identifier: resolve(path) })
  cache.set(resolve(path), mod)
}
const actions = await load('src/app/(frontend)/workflow-actions.ts')
const nurse = { collection: 'users', id: 'nurse-1', name: 'Nurse', role: 'nurse', enabled: true }
const provider = { collection: 'users', id: 'provider-1', name: 'Provider', role: 'provider', enabled: true }
const reviewer = { ...provider, clinicalQualification: 'Recorded credential', reviewerAuthorized: true, reviewerQualification: 'Recorded governance qualification', reviewerAuthorizationExpiresAt: '2099-01-01T00:00:00Z' }
const admin = { collection: 'users', id: 'admin-1', name: 'Admin', role: 'admin', enabled: true }
const metadata = {
  title: 'Test-only fixture', sourceURL: 'https://example.invalid/document', sourceOrganization: 'Test fixture',
  sourceDocument: 'Fixture', sourceVersion: 'test-1', publishedAt: '2025-01-01T00:00:00Z',
  sourceSection: 'Fixture section', jurisdiction: 'Test jurisdiction', population: 'Test population',
  applicability: 'Test only', exclusions: 'Test only', evidenceLevel: 'Test fixture', recommendationGrade: 'Test fixture',
  provenance: 'Test fixture, not seeded', validationEvidence: 'Test fixture, not clinical evidence',
  effectiveFrom: '2025-01-01T00:00:00Z', reviewDueAt: '2099-01-01T00:00:00Z', simulated: false,
  changeReason: 'Automated invariant fixture',
}
function activeSource() {
  const approvedSnapshot = governance.contentSnapshot(metadata, false)
  return { ...metadata, id: 'guideline-test', lifecycle: 'ACTIVE', approvedSnapshot, approvalDigest: governance.digest(approvedSnapshot) }
}
function draft() {
  const form = { ...fields.emptyClinicalForm(), hcrKnownFamilialMutation: true }
  return {
    patient: 'patient-test', pathwaySlug: 'hereditary-cancer-risk', intake: { consentToAssessment: true },
    pedigree: { familyHistoryKnown: true, relatives: [{ relationship: 'mother', lineage: 'maternal', condition: 'Test fixture' }] },
    anc: { gestationalAgeWeeks: 12 },
    assessmentInputs: Object.fromEntries(fields.FORM_FIELDS['hereditary-cancer-risk'].map((f: { key: string }) => [f.key, form[f.key]])),
  }
}
function adapter() {
  const records: Record<string, any>[] = []
  const receipts = new Set<string>()
  const guideline = activeSource()
  const ruleContent = { ...metadata, code: 'TEST-ONLY', versionNumber: 'test-1', pathwaySlug: 'hereditary-cancer-risk',
    triggerKey: 'fixture', conditions: [{ field: 'hcrKnownFamilialMutation', equals: true }],
    urgencyOutcome: 'urgent', referralTarget: 'Test fixture', plainLanguageRationale: 'Test fixture',
    guidelineCitation: 'Test fixture', guideline: guideline.id,
  }
  const approvedSnapshot = { ...governance.contentSnapshot(ruleContent, true), guidelineSnapshot: { id: guideline.id, approvalDigest: guideline.approvalDigest, content: guideline.approvedSnapshot } }
  const criterion = { ...ruleContent, id: 'criterion-test', lifecycle: 'ACTIVE', approvalAttested: true, validationStatus: 'validated', approvedSnapshot, approvalDigest: governance.digest(approvedSnapshot) }
  const payload = {
    async find(options: any) {
      if (options.collection === 'clinical-workflows') return { docs: records.filter((r) => r.workflowKey === options.where.workflowKey.equals).sort((a, b) => b.revision - a.revision).slice(0, 1) }
      if (options.collection === 'clinical-pathways') return { docs: [{ id: 'pathway-test', slug: 'hereditary-cancer-risk', title: 'Test fixture' }] }
      if (options.collection === 'clinical-criteria') return { docs: [criterion], hasNextPage: false }
      throw new Error('Unexpected collection')
    },
    async findByID(options: any) {
      if (options.collection === 'guideline-references') return guideline
      if (options.collection === 'patients') return { id: options.id, mrn: 'TEST', fullName: 'Test fixture', age: 30 }
      throw new Error('Unexpected relationship')
    },
    async create(options: any) {
      if (options.collection === 'clinical-workflows') {
        assert.equal(options.overrideAccess, false)
        const req = { user: options.user, context: options.context, payload }
        const next = await workflowHook({ req, data: options.data, operation: 'create' })
        if (records.some((r) => r.revisionKey === next.revisionKey)) throw new Error('Duplicate revision')
        records.push({ ...next, id: `revision-${records.length + 1}`, createdAt: '2026-01-01T00:00:00Z' })
        return records[records.length - 1]
      }
      if (options.collection !== 'governance-commands') throw new Error('Unexpected write')
      if (receipts.has(options.data.commandKey)) throw new Error('Duplicate receipt')
      receipts.add(options.data.commandKey)
      return options.data
    },
  }
  async function append(user: any, command: any, data: any = {}) {
    return payload.create({ collection: 'clinical-workflows', overrideAccess: false, user, context: security.workflowContext(user, command), data })
  }
  return { records, payload, criterion, guideline, append }
}

test('RBAC excludes both admin collections from PHI and reviewer authority', () => {
  for (const user of [null, admin, { collection: 'admins', id: 'cms' }, { ...provider, enabled: false }]) {
    assert.equal(access.clinicalStaff({ req: { user } }), false)
    assert.equal(access.specialist({ req: { user } }), false)
  }
  assert.equal(access.clinicalStaff({ req: { user: nurse } }), true)
  assert.equal(access.clinicalStaff({ req: { user: provider } }), true)
  assert.equal(security.isReviewer(provider), false)
  assert.equal(security.isReviewer(reviewer), true)
  assert.equal(security.isReviewer({ ...reviewer, role: 'admin' }), false)
  assert.equal(security.isReviewer({ ...reviewer, reviewerAuthorizationExpiresAt: '2000-01-01' }), false)
})
test('serialized/forged/other-actor context never grants access', () => {
  const context = security.workflowContext(nurse, { kind: 'draft', key: 'test', revision: 0 })
  assert.equal(access.workflowCreate({ req: { user: nurse, context } }), true)
  for (const forged of [JSON.parse(JSON.stringify(context)), { assessmentWorkflow: true }, { specialistApproval: true }, {}]) {
    assert.equal(access.workflowCreate({ req: { user: nurse, context: forged } }), false)
  }
  assert.equal(access.workflowCreate({ req: { user: provider, context } }), false)
  assert.equal(access.workflowRead({ req: { user: admin, context: {} } }), false)
  assert.equal(access.workflowRead({ req: { user: admin, context: security.workflowContext(admin, { kind: 'metrics' }) } }), true)
})
test('structured drafts reject server-owned fields, invalid ANC and ambiguous patient IDs', () => {
  assert.throws(() => validation.validateDraft({ ...draft(), signoff: {} }))
  assert.throws(() => validation.validateDraft({ ...draft(), anc: { gestationalAgeWeeks: 99 } }))
  assert.throws(() => validation.validateDraft({ ...draft(), syntheticPatientReference: 'SYN-test' }))
  assert.throws(() => validation.validateDraft({ ...draft(), assessmentInputs: { outcome: 'none' } }))
  assert.equal(validation.validateDraft({ ...draft(), patient: null, syntheticPatientReference: 'SYN-test' }).syntheticPatientReference, 'SYN-test')
})
test('workflow persists all sections, blocks nurse review and forged outcomes, re-evaluates signoff', async () => {
  const db = adapter()
  const key = 'workflow-test'
  const saved = await db.append(nurse, { kind: 'draft', key, revision: 0 }, { ...draft(), decision: 'no_referral_needed', signoff: { forged: true } })
  assert.equal(saved.decision, null)
  assert.equal(saved.signoff, null)
  assert.equal(saved.anc.gestationalAgeWeeks, 12)
  assert.equal(saved.pedigree.relatives.length, 1)
  await db.append(nurse, { kind: 'submit', key, revision: 1 })
  await assert.rejects(() => db.append(nurse, { kind: 'review', key, revision: 2 }))
  const reviewed = await db.append(provider, { kind: 'review', key, revision: 2 })
  assert.equal(reviewed.evaluationSnapshot.result.decision, 'urgent_referral')
  await assert.rejects(() => db.append(provider, { kind: 'finalize', key, revision: 3, attested: true, expectedEvaluationDigest: 'forged' }))
  const signed = await db.append(provider, { kind: 'finalize', key, revision: 3, attested: true, expectedEvaluationDigest: reviewed.evaluationSnapshot.evaluationDigest })
  assert.equal(signed.decision, 'urgent_referral')
  assert.equal(signed.signoff.actor, provider.id)
  assert.equal(db.records.length, 4)
  await assert.rejects(() => db.append(provider, { kind: 'draft', key, revision: 4 }, draft()))
})
test('concurrent saves cannot both consume the same revision', async () => {
  const db = adapter()
  const results = await Promise.allSettled([db.append(nurse, { kind: 'draft', key: 'race', revision: 0 }, draft()), db.append(nurse, { kind: 'draft', key: 'race', revision: 0 }, draft())])
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1)
})
test('expired rules, source changes and no-match results block finalization', async () => {
  for (const mutation of ['expiry', 'source', 'no-match']) {
    const db = adapter()
    await db.append(nurse, { kind: 'draft', key: mutation, revision: 0 }, draft())
    await db.append(nurse, { kind: 'submit', key: mutation, revision: 1 })
    const reviewed = await db.append(provider, { kind: 'review', key: mutation, revision: 2 })
    if (mutation === 'expiry') db.criterion.reviewDueAt = '2000-01-01T00:00:00Z'
    if (mutation === 'source') db.guideline.approvalDigest = 'changed'
    if (mutation === 'no-match') db.criterion.conditions = [{ field: 'hcrKnownFamilialMutation', equals: false }]
    await assert.rejects(() => db.append(provider, { kind: 'finalize', key: mutation, revision: 3, attested: true, expectedEvaluationDigest: reviewed.evaluationSnapshot.evaluationDigest }))
  }
})
test('governance requires sequential review, complete non-simulated sources and immutable approvals', async () => {
  const db = adapter()
  let current: any = null
  let clock = 0
  async function save(patch: any, user: any = reviewer) {
    const req = { user, payload: db.payload, context: security.workflowContext(user, { kind: 'governance', target: `guideline-references:${current?.id ?? 'new'}`, expectedDigest: current ? governance.digest({ id: current.id, updatedAt: current.updatedAt }) : undefined }) }
    const next = await governanceHook({ data: patch, originalDoc: current, req, collection: { slug: 'guideline-references' }, operation: current ? 'update' : 'create' })
    current = { ...current, ...next, id: 'source-test', updatedAt: `version-${++clock}` }
    return current
  }
  await assert.rejects(() => save({ ...metadata, lifecycle: 'DRAFT' }, admin))
  await save({ ...metadata, lifecycle: 'DRAFT' })
  await assert.rejects(() => save({ lifecycle: 'ACTIVE' }))
  await save({ lifecycle: 'UNDER_REVIEW' })
  await save({ lifecycle: 'APPROVED' })
  const frozen = JSON.stringify(current.approvedSnapshot)
  await assert.rejects(() => save({ title: 'Changed after approval' }))
  await save({ lifecycle: 'ACTIVE' })
  assert.equal(governance.isActive(current), true)
  await save({ lifecycle: 'RETIRED' })
  assert.equal(JSON.stringify(current.approvedSnapshot), frozen)
  assert.equal(governance.isActive(current), false)
  assert.throws(() => governance.assertComplete({ ...metadata, simulated: true }, false))
  assert.throws(() => governance.assertComplete({ ...metadata, provenance: '' }, false))
  assert.equal(governance.isActive({ ...metadata, approvalAttested: true }), false)
})
test('ANC section saves preserve pedigree and intake in the same workflow', async () => {
  const db = adapter()
  const workflowKey = '11111111-1111-4111-8111-111111111111'
  await db.append(nurse, { kind: 'draft', key: workflowKey, revision: 0 }, draft())
  actionUser = nurse
  actionPayload = { ...db.payload, findByID: async (options: any) => options.collection === 'users' ? nurse : db.payload.findByID(options) }
  const result = await actions.saveWorkflowSectionsAction({ workflowKey, expectedRevision: 1, sections: { anc: { gestationalAgeWeeks: 14 } } })
  assert.equal(result.ok, true)
  assert.equal(result.record.workflowKey, workflowKey)
  assert.equal(result.record.revision, 2)
  assert.equal(result.record.anc.gestationalAgeWeeks, 14)
  assert.equal(result.record.pedigree.relatives.length, 1)
  assert.equal(result.record.intake.consentToAssessment, true)
  const stale = await actions.saveWorkflowSectionsAction({ workflowKey, expectedRevision: 1, sections: { anc: {} } })
  assert.equal(stale.ok, false)
  actionUser = null
})
test('action boundary refreshes permissions, returns structured errors and never trusts outcomes', async () => {
  actionUser = null
  assert.equal((await actions.saveWorkflowDraftAction({ expectedRevision: 0, draft: draft() })).ok, false)
  actionUser = provider
  actionPayload = { findByID: async (options: any) => {
    assert.equal(options.overrideAccess, false)
    assert.equal(options.collection, 'users')
    return admin // A stale provider JWT was demoted server-side.
  } }
  const demoted = await actions.saveWorkflowDraftAction({ expectedRevision: 0, draft: draft() })
  assert.equal(demoted.ok, false)
  assert.equal(demoted.fieldErrors.auth, 'Clinical staff access is required.')
  actionPayload = { findByID: async () => provider }
  const forged = await actions.saveWorkflowDraftAction({ expectedRevision: 0, draft: { ...draft(), evaluationSnapshot: { decision: 'none' } } })
  assert.equal(forged.ok, false)
  assert.equal(typeof forged.fieldErrors.draft, 'string')
  actionPayload = { findByID: async () => { throw new Error('Private patient details and internal secret') } }
  const failure = await actions.loadWorkflowAction({ workflowKey: '11111111-1111-4111-8111-111111111111' })
  assert.equal(failure.ok, false)
  assert.equal(JSON.stringify(failure).includes('Private patient'), false)
  actionUser = null
})
test('small cells and complementary cells are suppressed; totals cannot reconstruct them', () => {
  const keys = privacy.WORKFLOW_DECISIONS
  const result = privacy.suppressWorkflowCounts(Object.fromEntries(keys.map((k: string, i: number) => [k, [1, 5, 8, 20][i]])))
  assert.equal(result.counts[keys[0]], null)
  assert.equal(result.counts[keys[3]], null)
  assert.equal(result.total, null)
  const boundary = privacy.suppressWorkflowCounts(Object.fromEntries(keys.map((k: string) => [k, 5])))
  assert.equal(boundary.total, 20)
  assert.equal(boundary.suppressed, false)
  const empty = privacy.suppressWorkflowCounts(Object.fromEntries(keys.map((k: string) => [k, 0])))
  assert.equal(Object.values(empty.counts).every((v) => v === null), true)
})
