'use client'

import { inputCls } from '@/components/ui/Primitives'
import { LEGACY_FORM_FIELDS, visibleIntakeFields, type InputField } from '@/lib/form-fields'
import type { PathwaySlug, StructuredFormState } from '@/lib/decision-engine'
import type { WorkflowIntake } from '@/lib/workflow-store'

export function ClinicalHistory({
  slug,
  inputs,
  intake,
  syntheticReference,
  errors,
  onInput,
  onIntake,
  onReference,
}: {
  slug: PathwaySlug
  inputs: StructuredFormState
  intake: WorkflowIntake
  syntheticReference: string
  errors: Record<string, string>
  onInput: (key: string, value: string) => void
  onIntake: (value: WorkflowIntake) => void
  onReference: (value: string) => void
}) {
  const fields = visibleIntakeFields(slug, inputs)
  const sections = [...new Set(fields.map((field) => field.section ?? 'Clinical details'))]
  const legacy = LEGACY_FORM_FIELDS[slug].filter((field) => Object.hasOwn(inputs, field.key))
  function control(field: InputField) {
    const id = `clinical-${field.key}`
    const error = errors[`assessmentInputs.${field.key}`] ?? errors[field.key]
    const props = {
      id,
      className: inputCls,
      value: String(inputs[field.key] ?? ''),
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => onInput(field.key, event.target.value),
      'aria-invalid': !!error,
      'aria-describedby': `${id}-help`,
    }
    return (
      <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-200">
          {field.label}
        </label>
        {field.type === 'select' ? (
          <select {...props}>
            <option value="">Unknown / not recorded</option>
            {field.options?.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea {...props} rows={3} maxLength={8000} />
        ) : (
          <input
            {...props}
            type={field.type}
            step={field.type === 'number' ? 'any' : undefined}
            maxLength={2000}
          />
        )}
        <div id={`${id}-help`}>
          {field.hint && <p className="mt-1 text-xs text-slate-400">{field.hint}</p>}
          {error && (
            <p role="alert" className="mt-1 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-7">
      <div className="rounded-xl border border-[#0e5c3e] bg-[#033424] p-4 text-sm font-medium text-[#6ee7b7] shadow-sm">
        Enter source observations, not a referral conclusion. Blank answers remain unknown. No
        clinical cut-offs are embedded in this form. Use synthetic data only.
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold text-slate-200">
          Synthetic patient reference
          <input
            className={inputCls}
            value={syntheticReference}
            onChange={(event) => onReference(event.target.value)}
            placeholder="SYN-example"
            maxLength={94}
            aria-invalid={!!errors.syntheticPatientReference}
          />
          <span className="text-xs font-normal text-slate-400">
            Required for saving. Never enter a real name, MRN or identifier.
          </span>
          {errors.syntheticPatientReference && (
            <span role="alert" className="text-red-400 font-normal">
              {errors.syntheticPatientReference}
            </span>
          )}
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-200">
          Consent to assessment
          <select
            className={inputCls}
            value={
              intake.consentToAssessment === true
                ? 'yes'
                : intake.consentToAssessment === false
                  ? 'no'
                  : ''
            }
            onChange={(event) =>
              onIntake({
                ...intake,
                consentToAssessment: event.target.value === '' ? '' : event.target.value === 'yes',
              })
            }
            aria-invalid={!!errors['intake.consentToAssessment']}
          >
            <option value="">Unknown / not recorded</option>
            <option value="yes">Consent confirmed</option>
            <option value="no">Consent not given</option>
          </select>
          {errors['intake.consentToAssessment'] && (
            <span role="alert" className="text-red-400 font-normal">
              {errors['intake.consentToAssessment']}
            </span>
          )}
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-200 sm:col-span-2">
          Presenting concern / reason for assessment
          <textarea
            rows={3}
            className={inputCls}
            maxLength={4000}
            value={intake.presentingConcern ?? ''}
            onChange={(event) => onIntake({ ...intake, presentingConcern: event.target.value })}
          />
        </label>
      </div>
      {slug === 'infertility-recurrent-pregnancy-loss' && (
        <p className="text-sm text-slate-400">
          Select infertility, pregnancy loss, or both to open the independent subflows. Previously
          entered answers are retained when hidden; select both to review them. The documented
          assessment focus is included with the saved inputs.
        </p>
      )}
      {sections.map((section) => (
        <fieldset key={section} className="rounded-xl border border-[#0e4331] bg-[#021f17]/70 p-5 shadow-sm">
          <legend className="px-2 font-bold text-[#34d399]">{section}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields
              .filter((field) => (field.section ?? 'Clinical details') === section)
              .map(control)}
          </div>
        </fieldset>
      ))}
      {legacy.length > 0 && (
        <details className="rounded-xl border border-[#0e4331] bg-[#021f17]/50 p-4">
          <summary className="cursor-pointer font-bold text-slate-200">
            Historical schema answers — read only
          </summary>
          <p className="my-3 text-sm text-slate-400">
            Retained exactly under their original field meanings. These composite questions are not
            translated into raw observations or used as a local fallback. Approved server criteria
            may reference historical keys; return for correction or specialist review when that
            evidence is insufficient.
          </p>
          <dl className="grid gap-3 text-sm">
            {legacy.map((field) => (
              <div key={field.key}>
                <dt className="font-semibold text-slate-200">
                  {field.label} <span className="font-normal text-slate-400">({field.key})</span>
                </dt>
                <dd className="text-[#34d399]">
                  {inputs[field.key] === '' || inputs[field.key] === undefined
                    ? 'Unknown / not recorded'
                    : typeof inputs[field.key] === 'boolean'
                      ? inputs[field.key]
                        ? 'Yes'
                        : 'No'
                      : (field.options?.find(([key]) => key === inputs[field.key])?.[1] ??
                        String(inputs[field.key]))}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  )
}
