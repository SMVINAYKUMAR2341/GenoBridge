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
    <div className="space-y-6">
      {/* Authoritative Recommendation Hero Banner matching Histone */}
      <div
        data-testid="result-hero"
        className={`rounded-2xl p-6 sm:p-8 text-white border shadow-xl transition-all ${
          decision === 'urgent_referral'
            ? 'bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-900/90 border-rose-500 shadow-rose-950/50'
            : decision === 'routine_referral'
              ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-orange-950/90 border-amber-500 shadow-amber-950/50'
              : decision === 'borderline_consideration'
                ? 'bg-gradient-to-r from-sky-950/90 via-cyan-900/80 to-blue-950/90 border-cyan-500 shadow-cyan-950/50'
                : 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-teal-950/90 border-emerald-500 shadow-emerald-950/50'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.22em] opacity-80 mb-2">
          <span>{record?.pathwaySlug ? record.pathwaySlug.replace(/-/g, ' ') : 'CLINICAL EVALUATION'}</span>
          <span className="px-3 py-0.5 rounded-full bg-white/15 text-white font-bold tracking-wider">
            {decision === 'urgent_referral'
              ? 'REFER — URGENT'
              : decision === 'routine_referral'
                ? 'REFER — ROUTINE'
                : decision === 'borderline_consideration'
                  ? 'BORDERLINE — DISCUSS'
                  : 'NO REFERRAL NEEDED'}
          </span>
        </div>
        <div data-testid="outcome-label" className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          {OUTCOME_LABELS[decision] || 'Recommendation'}
        </div>
        {result.referralTarget && result.referralTarget !== 'None' && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium opacity-95">
            <span className="text-[11px] uppercase tracking-widest opacity-70">Referral target:</span>
            <span className="font-bold text-[#00D8C3] bg-black/20 px-3 py-1 rounded-lg">
              {String(result.referralTarget)}
            </span>
          </div>
        )}
      </div>

      <section className={`${card} p-5 space-y-4`}>
        <div className="flex items-center justify-between border-b border-[#164C60]/50 pb-3">
          <p className="text-xs font-bold tracking-widest text-[#00D8C3] uppercase font-mono">
            Deterministic Decision Rationale
          </p>
          <span className="text-xs text-[#A9BDCA] font-mono">Zero-hallucination rule engine</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
          {evaluated
            ? text(
                result.rationale,
                'No rationale is available. Manual clinical review is required.',
              )
            : 'Save and submit the clinical record, then ask a provider to explicitly review it. Absence of an evaluation is not a no-referral decision.'}
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 pt-2 border-t border-[#164C60]/50">
          <div>
            <dt className="text-xs font-mono text-[#A9BDCA] uppercase">Destination(s)</dt>
            <dd className="font-semibold text-white mt-0.5">
              {text(result.referralTarget, 'Not specified by server evaluation')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-mono text-[#A9BDCA] uppercase">Evaluation timestamp</dt>
            <dd className="font-semibold text-white mt-0.5">{text(snapshot.evaluatedAt ?? result.timestamp, 'Not evaluated')}</dd>
          </div>
          <div>
            <dt className="text-xs font-mono text-[#A9BDCA] uppercase">Engine / standard</dt>
            <dd className="font-semibold text-[#00D8C3] mt-0.5">FOGSI · ACOG · ACMG · ASRM · NCCN</dd>
          </div>
          <div>
            <dt className="text-xs font-mono text-[#A9BDCA] uppercase">Reason code</dt>
            <dd className="font-semibold text-white mt-0.5">{text(result.reasonCode)}</dd>
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
              className="space-y-3 rounded-xl border border-[#164C60]/70 bg-[#08243B]/40 p-4 transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-base">
                    {text(criterion.title, '') || text(criterion.code, '')}
                  </h4>
                  <div className="text-xs text-[#A9BDCA] mt-0.5">
                    Target: <span className="text-[#00D8C3] font-semibold">{text(criterion.referral_target ?? result.referralTarget)}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  String(criterion.outcome).includes('urgent')
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : String(criterion.outcome).includes('routine')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {OUTCOME_LABELS[String(criterion.outcome)] ?? display(criterion.outcome)}
                </span>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00D8C3] text-[#031525] font-bold shrink-0">
                  STATUTORY GUIDELINE
                </span>
                <span className="text-xs text-[#A9BDCA] leading-relaxed">
                  {text(criterion.guidelineCitation, 'Statutory guideline matched')}
                </span>
              </div>
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
