'use server'

import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'
import type { StructuredFormState, PathwaySlug } from '@/lib/decision-engine'
// import { parseClinicalInputs, FORM_FIELDS } from '@/lib/form-fields' // Unused in current active code

function text(value: unknown, name: string, max = 2000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(`Enter a valid ${name}.`)
  return value.trim()
}
function failure(error: unknown) {
  return {
    ok: false as const,
    error: error instanceof Error ? error.message : 'The request could not be completed.',
  }
}
async function staff() {
  const user = await appAuth.currentUser()
  if (!user || !['provider', 'admin'].includes(user.role ?? ''))
    throw new Error('Please sign in with an authorized staff account.')
  return user
}
async function audit(
  action:
    | 'ASSESSMENT_SAVED'
    | 'REFERRAL_GENERATED'
    | 'CRITERIA_VALIDATED'
    | 'CRITERIA_UPDATED'
    | 'METRICS_EXPORT',
  resourceRef: string,
) {
  const user = await staff()
  const payload = await getPayloadClient()
  await payload.create({
    collection: 'audit-logs',
    overrideAccess: true,
    data: {
      eventCode: `AUD-${crypto.randomUUID()}`,
      actorName: user.name,
      actorRole: user.role === 'admin' ? 'Specialist Admin' : 'OB/GYN Provider',
      actionType: action,
      resourceRef,
      details: 'Authenticated clinical workflow event.',
      encryptionVerified: false,
    },
  })
}
export async function signInAction(input: { email: string; password: string }) {
  try {
    if (typeof input.password !== 'string' || !input.password || input.password.length > 200)
      throw new Error('Enter a valid password.')
    await appAuth.login(text(input.email, 'email', 254), input.password)
    return { ok: true as const }
  } catch {
    return {
      ok: false as const,
      error: 'Unable to sign in. Check your staff credentials or contact your administrator.',
    }
  }
}
export async function signOutAction() {
  await appAuth.logout()
  return { ok: true as const }
}
export async function loadWorkspaceAction() {
  try {
    const user = await appAuth.currentUser()
    if (!user) return { ok: true as const, user: null, patients: [], assessments: [] }
    const payload = await getPayloadClient()
    const [patients, assessments] = await Promise.all([
      payload.find({
        collection: 'patients',
        overrideAccess: false,
        user,
        limit: 100,
        sort: 'fullName',
        depth: 0,
      }),
      payload.find({
        collection: 'assessments',
        overrideAccess: false,
        user,
        limit: 100,
        sort: '-createdAt',
        depth: 0,
      }),
    ])
    return {
      ok: true as const,
      user: { id: user.id, name: user.name, role: user.role },
      patients: patients.docs,
      assessments: assessments.docs,
    }
  } catch (error) {
    console.warn(
      'Staff workspace could not be loaded:',
      error instanceof Error ? error.name : 'Unknown failure',
    )
    return {
      ok: false as const,
      error: 'Staff records could not be loaded. Sign in again or retry.',
    }
  }
}
/* LEGACY FUNCTIONS COMMENTED OUT - NOT USED IN CURRENT WORKFLOW
export async function createPatientIntakeAction(input: Record<string, unknown>) {
  try {
    const user = await staff()
    const pregnancyStatus = text(input.pregnancyStatus, 'pregnancy status')
    if (
      ![
        'pregnant_first_trimester',
        'pregnant_second_trimester',
        'pregnant_third_trimester',
        'preconception',
        'not_pregnant',
        'postpartum',
      ].includes(pregnancyStatus)
    )
      throw new Error('Invalid pregnancy status.')
    const dob = text(input.dob, 'date of birth', 10)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
      !Number.isFinite(Date.parse(dob)) ||
      new Date(dob).toISOString().slice(0, 10) !== dob ||
      Date.parse(dob) > Date.now()
    )
      throw new Error('Enter a valid date of birth.')
    const age = Math.floor((Date.now() - Date.parse(dob)) / 31557600000)
    if (age < 0 || age > 120) throw new Error('Date of birth is outside the supported range.')
    const payload = await getPayloadClient()
    const record = await payload.create({
      collection: 'patients',
      overrideAccess: false,
      user,
      data: {
        fullName: text(input.fullName, 'patient name', 120),
        mrn: text(input.mrn, 'MRN', 80),
        dob,
        age,
        pregnancyStatus: pregnancyStatus as 'not_pregnant',
        intakeSummary:
          typeof input.intakeSummary === 'string' ? input.intakeSummary.slice(0, 4000) : '',
        intakeCompletedBy: user.name,
      },
    })
    return { ok: true as const, id: record.id }
  } catch (error) {
    return failure(error)
  }
}
export async function saveAssessmentAction(input: {
  patientId: string
  pathwaySlug: string
  form: StructuredFormState
  reviewed: boolean
  referBorderline?: boolean
}) {
  try {
    const user = await staff()
    if (input.reviewed !== true) throw new Error('Confirm the clinical inputs have been reviewed.')
    const payload = await getPayloadClient()
    const patient = await payload.findByID({
      collection: 'patients',
      id: text(input.patientId, 'patient'),
      user,
      overrideAccess: false,
    })
    const pathways = await payload.find({
      collection: 'clinical-pathways',
      user,
      overrideAccess: false,
      where: { slug: { equals: text(input.pathwaySlug, 'pathway') } },
      limit: 1,
    })
    const pathway = pathways.docs[0]
    if (!pathway) throw new Error('Clinical pathway not found.')
    const form = parseClinicalInputs(input.pathwaySlug, input.form)
    const criteria = await payload.find({
      collection: 'clinical-criteria',
      user,
      overrideAccess: false,
      where: { pathwaySlug: { equals: input.pathwaySlug } },
      limit: 100,
    })
    const evaluated = evaluateClinicalDecision(
      input.pathwaySlug as PathwaySlug,
      pathway,
      criteria.docs,
      form,
      patient,
    )
    if (
      !criteria.docs.length ||
      criteria.docs.some((c) => !c.approvalAttested || c.validationStatus !== 'validated')
    ) {
      throw new Error(
        'This pathway is not approved for clinical use. A specialist must review and attest every criterion before a clinical decision can be saved.',
      )
    }
    const referral =
      (evaluated.decision.includes('referral') && evaluated.decision !== 'no_referral_needed') ||
      (evaluated.decision === 'borderline_consideration' && input.referBorderline === true)
    const summary = buildStructuredReferralOrder(patient, pathway.title, evaluated, user.name)
    const record = await payload.create({
      collection: 'assessments',
      user,
      overrideAccess: false,
      context: { assessmentWorkflow: true },
      data: {
        assessmentCode: `ASM-${crypto.randomUUID()}`,
        patient: patient.id,
        patientMrn: patient.mrn,
        patientName: patient.fullName,
        patientAge: patient.age,
        pathwaySlug: input.pathwaySlug as PathwaySlug,
        pathwayTitle: pathway.title,
        decision: evaluated.decision,
        referralTarget: evaluated.referralTarget,
        rationale: evaluated.rationale,
        guidelineCitations: evaluated.guidelineCitations,
        triggeredCriteriaCodes: evaluated.matchedCriteria
          .map((c: any) => `${c.code} v${c.versionNumber}`)
          .join(', '),
        containsUnvalidatedCriteria: evaluated.containsUnvalidatedCriteria,
        clinicalInputsSummary: evaluated.clinicalInputsSummary,
        structuredInputsJson: { ...form },
        actionTaken: referral
          ? 'referral_generated'
          : evaluated.decision === 'borderline_consideration'
            ? 'borderline_watchlist'
            : 'logged_no_referral',
        referralOrderSummary: summary,
        providerName: user.name,
        providerRole: 'obgyn_provider',
      },
    })
    return { ok: true as const, summary, id: record.id }
  } catch (error) {
    return failure(error)
  }
}
export async function updateCriterionAction(input: {
  id: string
  title: string
  rationale: string
  citation: string
  target: string
  urgency: string
  version: string
  approve: boolean
  notes: string
  conditions: string
}) {
  try {
    const user = await staff()
    if (user.role !== 'admin') throw new Error('Specialist administrator access is required.')
    if (!['urgent', 'routine', 'borderline', 'none'].includes(input.urgency))
      throw new Error('Select a valid outcome.')
    const payload = await getPayloadClient()
    const original = await payload.findByID({
      collection: 'clinical-criteria',
      id: text(input.id, 'criterion'),
      user,
      overrideAccess: false,
    })
    if (input.version.trim() === original.versionNumber)
      throw new Error('Use a new version number for this revision.')
    const conditions = JSON.parse(input.conditions || '[]')
    if (!Array.isArray(conditions) || conditions.length > 20)
      throw new Error('Conditions must be an array of up to 20 field/equals rules.')
    for (const condition of conditions) {
      const field = FORM_FIELDS[original.pathwaySlug]?.find((f) => f.key === condition?.field)
      if (
        !field ||
        (field.type === 'checkbox'
          ? typeof condition.equals !== 'boolean'
          : field.options
            ? !field.options.some((o) => o[0] === condition.equals)
            : typeof condition.equals !== 'string')
      ) {
        throw new Error('Each trigger must use a valid field and value for this pathway.')
      }
    }
    await payload.update({
      collection: 'clinical-criteria',
      id: text(input.id, 'criterion'),
      user,
      overrideAccess: false,
      context: { specialistApproval: true },
      data: {
        conditions,
        title: text(input.title, 'title', 400),
        plainLanguageRationale: text(input.rationale, 'rationale', 4000),
        guidelineCitation: text(input.citation, 'guideline citation', 1000),
        referralTarget: text(input.target, 'referral target', 300),
        urgencyOutcome: input.urgency as 'routine',
        versionNumber: text(input.version, 'version', 40),
        validationStatus: input.approve === true ? 'validated' : 'under_review',
        approvalAttested: input.approve === true,
        reviewedBySpecialist: user.name,
        lastReviewedAt: new Date().toISOString(),
        versionNotes: text(input.notes, 'review notes', 2000),
      },
    })
    return { ok: true as const }
  } catch (error) {
    return failure(error)
  }
}
export async function getMetricsAction() {
  try {
    const user = await staff()
    if (user.role !== 'admin')
      throw new Error('Administrator access is required for clinic metrics.')
    const payload = await getPayloadClient()
    const counts: Record<string, number> = {}
    for (const decision of [
      'urgent_referral',
      'routine_referral',
      'borderline_consideration',
      'no_referral_needed',
    ]) {
      counts[decision] = (
        await payload.count({
          collection: 'assessments',
          overrideAccess: false,
          user,
          where: { decision: { equals: decision } },
        })
      ).totalDocs
    }
    const pathways = await payload.find({
      collection: 'clinical-pathways',
      overrideAccess: false,
      user,
      limit: 50,
    })
    const byPathway = await Promise.all(
      pathways.docs.map(async (p) => ({
        title: p.title,
        count: (
          await payload.count({
            collection: 'assessments',
            overrideAccess: false,
            user,
            where: { pathwaySlug: { equals: p.slug } },
          })
        ).totalDocs,
      })),
    )
    await audit('METRICS_EXPORT', 'aggregate-dashboard')
    return { ok: true as const, counts, byPathway }
  } catch (error) {
    return failure(error)
  }
}

*/