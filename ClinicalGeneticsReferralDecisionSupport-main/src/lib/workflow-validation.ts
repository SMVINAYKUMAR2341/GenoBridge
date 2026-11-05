import { FORM_FIELDS } from './form-fields'
import { parsePedigree, type PedigreeModel } from '../components/clinical/pedigree-model'
import { parseRoutineAnc, type RoutineAncData } from './anc-model'
import { WorkflowError, object, text } from './workflow-security'
import type { EmptyWorkflowSection } from './workflow-store'

/** Structural contract also accepts the parent's upcoming extended field catalog. */
export type WorkflowFormField = {
  key: string
  type: 'select' | 'text' | 'checkbox' | 'number' | 'date' | 'textarea'
  options?: readonly (readonly [string, string])[]
  required?: boolean
  section?: string
  subflow?: string
}
const INTAKE = ['presentingConcern', 'pregnancyStatus', 'gestationalAgeWeeks', 'gravida', 'para', 'consentToAssessment', 'notes']
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const emptyRecord = (value: unknown): value is EmptyWorkflowSection =>
  !!value && Object.prototype.toString.call(value) === '[object Object]' && Object.keys(value).length === 0

function intakeSection(input: unknown) {
  const record = object(input, INTAKE, 'intake')
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue
    if (value === '') { result[key] = ''; continue }
    if (key === 'consentToAssessment') {
      if (typeof value !== 'boolean') throw new WorkflowError('Expected true, false or an unanswered blank.', `intake.${key}`)
    } else if (['gravida', 'para', 'gestationalAgeWeeks'].includes(key)) {
      const max = key === 'gestationalAgeWeeks' ? 45 : 30
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max ||
        (key !== 'gestationalAgeWeeks' && !Number.isInteger(value))) throw new WorkflowError('Number outside the supported range.', `intake.${key}`)
    } else if (typeof value !== 'string' || value.length > 4000) throw new WorkflowError('Invalid text.', `intake.${key}`)
    result[key] = typeof value === 'string' ? value.trim() : value
  }
  return result
}
function pedigreeSection(input: unknown): PedigreeModel | EmptyWorkflowSection {
  if (emptyRecord(input)) return {}
  const result = parsePedigree(input)
  if (!result.success) throw new WorkflowError(result.errors.slice(0, 8).join(' '), 'pedigree')
  return result.data
}
function ancSection(input: unknown): RoutineAncData | EmptyWorkflowSection {
  if (emptyRecord(input)) return {}
  const result = parseRoutineAnc(input)
  if (!result.success) throw new WorkflowError(result.errors.slice(0, 8).join(' '), 'anc')
  return result.data
}
function validateAnswer(field: WorkflowFormField, value: unknown) {
  // Unknown is not negative/false/zero. Keep explicit blanks, and never create
  // answers for omitted fields (including optional fields).
  if (value === '') return
  let valid = false
  switch (field.type) {
    case 'checkbox': valid = typeof value === 'boolean'; break
    case 'number':
      valid = (typeof value === 'number' && Number.isFinite(value)) ||
        (typeof value === 'string' && value.length <= 100 && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) && Number.isFinite(Number(value)))
      break
    case 'date': valid = typeof value === 'string' && validDate(value); break
    case 'select': valid = typeof value === 'string' && value.length <= 2000 && !!field.options?.some(([key]) => key === value); break
    case 'text': valid = typeof value === 'string' && value.length <= 2000; break
    case 'textarea': valid = typeof value === 'string' && value.length <= 8000; break
  }
  if (!valid) throw new WorkflowError('Invalid clinical input.', `assessmentInputs.${field.key}`)
}

export function validateDraft(input: unknown) {
  const data = object(input, ['patient', 'syntheticPatientReference', 'pathwaySlug', 'intake', 'pedigree', 'anc', 'assessmentInputs'], 'draft')
  const pathwaySlug = text(data.pathwaySlug, 'pathwaySlug', 100)
  if (!Object.hasOwn(FORM_FIELDS, pathwaySlug)) throw new WorkflowError('Unsupported pathway.', 'pathwaySlug')
  // Until deployment/privacy gates exist, no workflow write may attach a real
  // patient. This validator also runs at the collection boundary on every revision.
  if (data.patient !== undefined && data.patient !== null && data.patient !== '') throw new WorkflowError('Real patient relationships are disabled until deployment gates are implemented. Use synthetic data only.', 'patient')
  const syntheticPatientReference = text(data.syntheticPatientReference, 'syntheticPatientReference', 94)
  if (!/^SYN-[A-Za-z0-9_-]{1,90}$/.test(syntheticPatientReference)) throw new WorkflowError('Use a SYN- reference and synthetic data only; never include real patient identifiers.', 'syntheticPatientReference')
  const intake = intakeSection(data.intake ?? {})
  const pedigree = pedigreeSection(data.pedigree ?? {})
  const anc = ancSection(data.anc ?? {})
  const fields: readonly WorkflowFormField[] = FORM_FIELDS[pathwaySlug]
  const rawInputs = object(data.assessmentInputs ?? {}, fields.map((field) => field.key), 'assessmentInputs')
  const assessmentInputs: Record<string, unknown> = {}
  for (const field of fields) {
    if (!Object.hasOwn(rawInputs, field.key) || rawInputs[field.key] === undefined) continue
    const value = rawInputs[field.key]
    validateAnswer(field, value)
    assessmentInputs[field.key] = value
  }
  return { patient: null, syntheticPatientReference, pathwaySlug, intake, anc, pedigree, assessmentInputs }
}
export function assertSubmission(doc: ReturnType<typeof validateDraft>) {
  if (doc.intake.consentToAssessment !== true) throw new WorkflowError('Confirm consent to assessment.', 'intake.consentToAssessment')
  const fields: readonly WorkflowFormField[] = FORM_FIELDS[doc.pathwaySlug]
  for (const field of fields) {
    if (!field.required) continue
    const value = doc.assessmentInputs[field.key]
    if (!Object.hasOwn(doc.assessmentInputs, field.key) || value === undefined || value === '' ||
      (typeof value === 'string' && !value.trim())) throw new WorkflowError('Complete this required field before submitting.', `assessmentInputs.${field.key}`)
    validateAnswer(field, value)
  }
}
