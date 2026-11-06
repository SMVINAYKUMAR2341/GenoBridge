'use client'

import { Download, ShieldCheck, FileCode2 } from 'lucide-react'
import { btnGhost, card } from '@/components/ui/Primitives'
import { FORM_FIELDS } from '@/lib/form-fields'
import type { WorkflowRecord } from '@/lib/workflow-store'
import { buildFhirGenomicsBundle, downloadFhirBundleJson } from '@/lib/fhir-genomics-bundle'

export const OUTCOME_LABELS: Record<string, string> = {
  urgent_referral: 'Urgent referral',
  routine_referral: 'Routine referral',
  no_referral_needed: 'No referral needed',
  borderline_consideration: 'Manual clinical review',
  insufficient_information: 'Insufficient information — manual review',
  criteria_pending_approval: 'Criteria pending approval — manual review',
}
export const PRIMARY_OUTCOMES = ['urgent_referral', 'routine_referral', 'no_referral_needed']
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const rows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(object) : []
const text = (value: unknown, empty = 'Not recorded') =>
  typeof value === 'string' && value.trim() ? value : empty
const display = (value: unknown): string =>
  value === '' || value === undefined || value === null
    ? 'Unknown / not recorded'
    : typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value)
function sourceUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}
function Source({ source }: { source: Record<string, unknown> }) {
  const url = sourceUrl(source.url ?? source.sourceURL)
  return (
    <div className="rounded-lg border border-hx-border p-3 text-sm">
      <p className="font-semibold">
        {text(source.org ?? source.sourceOrganization)} ·{' '}
        {text(source.title ?? source.sourceDocument)}
      </p>
      <p className="text-hx-muted">
        Version: {text(source.guidelineVersion ?? source.sourceVersion)} · Date:{' '}
        {text(source.date ?? source.publishedAt)} · Page: {text(source.page)} · Section:{' '}
        {text(source.section ?? source.sourceSection)}
      </p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block break-all font-semibold text-hx-emerald underline"
        >
          View source document
        </a>
      ) : (
        <p className="text-xs text-hx-muted">No safe HTTPS source URL available.</p>
      )}
    </div>
  )
}
export function WorkflowResult({ record }: { record: WorkflowRecord | null }) {
  const snapshot = object(record?.evaluationSnapshot)
  const result = object(snapshot.result)
  const decision = text(result.decision, '')
  const evaluated = Object.keys(result).length > 0
  const primary = PRIMARY_OUTCOMES.includes(decision)
  const pending =
    !primary || result.reviewPending === true || result.containsUnvalidatedCriteria === true
  const criteria = rows(result.matchedCriteria)
  const serviceSnapshots = rows(result.criteriaSnapshots)
  const sources = rows(result.sourceCitations)
  const approvals = rows(snapshot.criteria)
  const signoff = object(record?.signoff)
  const fields = FORM_FIELDS[record?.pathwaySlug ?? ''] ?? []
  return (
    <div className="space-y-5">
      <section className={`${card} p-5`}>
        <p className="text-xs font-bold tracking-widest text-hx-emerald uppercase">
          Persisted server evaluation
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-hx-forest">
          {evaluated
            ? (OUTCOME_LABELS[decision] ?? 'Unrecognized result — manual review required')
            : 'Awaiting server review'}
        </h2>
        <p className="mt-3 text-sm whitespace-pre-wrap">
          {evaluated
            ? text(
                result.rationale,
                'No rationale is available. Manual clinical review is required.',
              )
            : 'Save and submit the clinical record, then ask a provider to explicitly review it. Absence of an evaluation is not a no-referral decision.'}
        </p>
        {evaluated && pending && (
          <p className="mt-3 rounded-xl bg-hx-warn-bg p-3 text-sm font-semibold text-hx-warn">
            Safeguard state: do not finalize or interpret this as no referral. Document a reason for
            specialist review.
          </p>
        )}
        {(decision === 'urgent_referral' || decision === 'routine_referral') && (
          <p className="mt-3 text-sm font-bold">
            Urgency: {decision === 'urgent_referral' ? 'Urgent' : 'Routine'}
          </p>
        )}
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold">Destination(s)</dt>
            <dd className="whitespace-pre-wrap">
              {text(result.referralTarget, 'Not specified by server evaluation')}
            </dd>
          </div>
          <div>
            <dt className="font-bold">Evaluation timestamp</dt>
            <dd>{text(snapshot.evaluatedAt ?? result.timestamp, 'Not evaluated')}</dd>
          </div>
          <div>
            <dt className="font-bold">Engine / version</dt>
            <dd>{text(result.engineVersion ?? snapshot.engineVersion)}</dd>
          </div>
          <div>
            <dt className="font-bold">Reason code</dt>
            <dd>{text(result.reasonCode)}</dd>
          </div>
        </dl>
        {Array.isArray(result.missingFields) && result.missingFields.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold">Missing input</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {result.missingFields.map((key, index) => (
                <li key={index}>
                  {fields.find((field) => field.key === key)?.label ?? display(key)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {rows(result.validationErrors).length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-sm text-hx-warn">
            {rows(result.validationErrors).map((error, index) => (
              <li key={index}>
                {text(error.path)}: {text(error.message)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} space-y-4 p-5`}>
        <h3 className="text-lg font-bold">Matched criteria & rationale</h3>
        {!criteria.length && (
          <p className="text-sm text-hx-muted">
            No matched criterion is present in this persisted evaluation. This is not evidence that
            referral is unnecessary.
          </p>
        )}
        {criteria.map((criterion, index) => {
          const service = serviceSnapshots
            .map((entry) => object(entry.criteria))
            .find((entry) => entry.id === criterion.id)
          const approved = object(
            approvals.find((entry) => entry.id === criterion.id)?.approvedSnapshot,
          )
          return (
            <article
              key={String(criterion.id ?? index)}
              className="space-y-2 rounded-xl border border-hx-border p-4"
            >
              <h4 className="font-bold">
                {text(criterion.code, '')} · {text(criterion.title)}
              </h4>
              <p className="text-sm">
                Criterion version: {display(criterion.version ?? criterion.versionNumber)} ·{' '}
                {OUTCOME_LABELS[String(criterion.outcome)] ?? display(criterion.outcome)}
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {text(
                  service?.rationale ?? approved.plainLanguageRationale,
                  'Individual criterion rationale not supplied in this snapshot.',
                )}
              </p>
              <p className="text-sm text-hx-muted">
                {text(criterion.guidelineCitation, 'Citation not supplied')}
              </p>
              {rows(criterion.citations).map((source, i) => (
                <Source key={i} source={source} />
              ))}
            </article>
          )
        })}
        <h3 className="pt-2 font-bold">Source provenance</h3>
        {sources.length ? (
          sources.map((citation, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs text-hx-muted">Criterion: {text(citation.criteriaId)}</p>
              <Source source={object(citation.source)} />
            </div>
          ))
        ) : (
          <p className="text-sm text-hx-muted">
            No source citations supplied. Active approved criteria must be available before a
            primary clinical decision can be signed.
          </p>
        )}
        {!!result.guidelineCitations && (
          <p className="text-sm whitespace-pre-wrap">{display(result.guidelineCitations)}</p>
        )}
        {!!result.recommendedWorkup && (
          <div>
            <h4 className="font-bold">Approved workup text</h4>
            <p className="mt-1 text-sm whitespace-pre-wrap">{display(result.recommendedWorkup)}</p>
          </div>
        )}
        {!!result.jargonTip && (
          <p className="text-sm whitespace-pre-wrap">{display(result.jargonTip)}</p>
        )}
      </section>

      <section className={`${card} space-y-3 p-5`}>
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheck size={19} /> Reviewing clinician approval
        </h3>
        {Object.keys(signoff).length ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              'name',
              'role',
              'actor',
              'at',
              'signatureId',
              'evaluationDigest',
              'attested',
              'note',
            ].map((key) => (
              <div key={key} className={key === 'note' ? 'sm:col-span-2' : ''}>
                <dt className="font-semibold">
                  {
                    (
                      {
                        name: 'Clinician',
                        role: 'Role',
                        actor: 'Staff ID',
                        at: 'Signed at',
                        signatureId: 'Signature ID',
                        evaluationDigest: 'Signed evaluation digest',
                        attested: 'Review attested',
                        note: 'Clinical approval note',
                      } as Record<string, string>
                    )[key]
                  }
                </dt>
                <dd className="break-all whitespace-pre-wrap">{display(signoff[key])}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-hx-muted">
            Not signed. An in-review result is not a finalized referral or clinician approval.
          </p>
        )}
        {record?.state === 'FINALIZED' && (
          <div className="flex flex-wrap items-center gap-3">
            <a className={btnGhost} href={`/api/referrals/${encodeURIComponent(record.workflowKey)}`}>
              <Download size={16} />{' '}
              {decision === 'no_referral_needed'
                ? 'Download finalized no-referral report'
                : 'Download finalized report'}
            </a>
            <button
              type="button"
              onClick={() => {
                const bundle = buildFhirGenomicsBundle(null, {
                  pathwayTitle: record.pathwaySlug.replaceAll('-', ' '),
                  decisionLabel: OUTCOME_LABELS[decision] || decision.replaceAll('_', ' '),
                  rationale: text(result.rationale, 'Clinical criteria evaluated against published guidelines.'),
                  guidelineCitations: sources.map((s) => `${text(object(s.source).org)} · ${text(object(s.source).title)} (${text(object(s.source).guidelineVersion)})`),
                  practitionerName: text(signoff.name, 'Reviewing Clinician'),
                  councilNumber: text(signoff.actor, 'NMC-REGISTERED'),
                })
                downloadFhirBundleJson(
                  bundle,
                  `genobridge-fhir-r4-${record.workflowKey.slice(0, 10)}.json`
                )
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#033424] text-[#00e5ce] border border-[#0e5c3e] hover:bg-[#064e3b] transition-all"
              title="Download standardized HL7 FHIR Genomics R4 Bundle (ABDM / Ayushman Bharat Digital Mission compliant)"
            >
              <FileCode2 size={15} />
              <span>Export HL7 FHIR (ABDM)</span>
            </button>
          </div>
        )}
        <details className="border-t border-hx-border pt-3">
          <summary className="cursor-pointer font-semibold">
            Criteria and guideline reviewer approvals
          </summary>
          {!approvals.length && (
            <p className="mt-2 text-sm">No governed criteria approvals supplied.</p>
          )}
          {approvals.map((criterion, index) => (
            <div key={index} className="mt-3 rounded-lg border border-hx-border p-3 text-sm">
              <p className="font-bold">
                {text(criterion.code, text(criterion.id))} · {text(criterion.version)}
              </p>
              {[
                { label: 'Criterion', history: criterion.governanceHistory },
                { label: 'Guideline', history: object(criterion.guideline).governanceHistory },
              ].map(({ label, history }) => (
                <div key={label}>
                  <p className="mt-2 font-semibold">{label} approval</p>
                  {rows(history)
                    .filter((event) => event.to === 'APPROVED')
                    .map((event, i) => (
                      <p key={i}>
                        Reviewer: {text(event.actorName ?? event.actor)} · {text(event.at)} ·{' '}
                        {text(event.note ?? event.reason, 'No approval note recorded')}
                      </p>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </details>
      </section>

      {record && (
        <section className={`${card} space-y-3 p-5`}>
          <h3 className="text-lg font-bold">Full persisted clinical report</h3>
          <p className="text-sm">
            {record.syntheticPatientReference} · Revision {record.revision} · {record.state} · Saved{' '}
            {record.createdAt}
          </p>
          <p className="text-xs text-hx-muted">
            Only persisted content is shown. Routine ANC and pedigree are retained as context, not
            silently converted into criteria facts.
          </p>
          <details>
            <summary className="cursor-pointer font-semibold">
              Clinical history and structured answers
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-hx-bg p-4 text-xs whitespace-pre-wrap">
              {JSON.stringify(
                { intake: record.intake, assessmentInputs: record.assessmentInputs },
                null,
                2,
              )}
            </pre>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold">
              Complete pedigree and Routine ANC context
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-hx-bg p-4 text-xs whitespace-pre-wrap">
              {JSON.stringify({ pedigree: record.pedigree, anc: record.anc }, null, 2)}
            </pre>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold">
              Complete evaluation, source versions and signoff
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-hx-bg p-4 text-xs whitespace-pre-wrap">
              {JSON.stringify(
                {
                  evaluationSnapshot: record.evaluationSnapshot,
                  signoff: record.signoff,
                  reviewNote: record.reviewNote,
                },
                null,
                2,
              )}
            </pre>
          </details>
        </section>
      )}
      <details className="text-sm text-hx-muted">
        <summary className="cursor-pointer font-semibold">
          Outcome terminology: three primary outcomes and three safeguards
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {Object.entries(OUTCOME_LABELS).map(([key, label]) => (
            <li key={key}>
              {label} —{' '}
              {PRIMARY_OUTCOMES.includes(key)
                ? 'primary outcome; requires current server review and clinician signoff'
                : 'safeguard; specialist review required, not eligible for finalization'}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
