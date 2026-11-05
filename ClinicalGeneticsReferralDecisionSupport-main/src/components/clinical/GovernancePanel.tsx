'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { BookOpen, CopyPlus, FilePenLine, Plus, RefreshCw, Save } from 'lucide-react'
import {
  createGovernanceRevisionAction,
  listGovernanceAction,
  saveGovernanceDraftAction,
  transitionGovernanceAction,
} from '@/app/(frontend)/workflow-actions'
import { btnGhost, btnPrimary, card, Empty, inputCls, PageHeader } from '@/components/ui/Primitives'
import StaffSignIn, { useClinicalWorkspace } from './StaffSignIn'

import { FORM_FIELDS } from '@/lib/form-fields'
import type { GovernedCriterion, Guideline, Lifecycle } from '@/lib/workflow-store'
import type { CRITERION_EDIT_FIELDS, GUIDELINE_EDIT_FIELDS } from '@/lib/workflow-governance'

type Kind = 'criterion' | 'guideline'
type RecordDoc = GovernedCriterion | Guideline
type GovernanceEditKey = (typeof CRITERION_EDIT_FIELDS)[number]
type FieldSpec = {
  key: GovernanceEditKey
  label: string
  required?: boolean
  multiline?: boolean
  date?: boolean
}
type GuidelineFieldSpec = FieldSpec & { key: (typeof GUIDELINE_EDIT_FIELDS)[number] }
const sourceFields: GuidelineFieldSpec[] = [
  { key: 'sourceURL', label: 'Source URL (HTTPS)' },
  { key: 'sourceOrganization', label: 'Source organization' },
  { key: 'sourceDocument', label: 'Exact source document title' },
  { key: 'sourceVersion', label: 'Verified source version / edition' },
  { key: 'publishedAt', label: 'Source publication date', date: true },
  { key: 'sourceSection', label: 'Verified source section / page' },
]
const metadataFields: GuidelineFieldSpec[] = [
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'population', label: 'Population' },
  { key: 'applicability', label: 'Applicability', multiline: true },
  { key: 'exclusions', label: 'Exclusions', multiline: true },
  { key: 'evidenceLevel', label: 'Evidence level' },
  { key: 'recommendationGrade', label: 'Recommendation grade' },
  { key: 'provenance', label: 'Provenance', multiline: true },
  { key: 'validationEvidence', label: 'Validation evidence', multiline: true },
  { key: 'effectiveFrom', label: 'Effective from', date: true },
  { key: 'reviewDueAt', label: 'Review due', date: true },
  { key: 'changeReason', label: 'Change reason', multiline: true },
]
const criterionFields: FieldSpec[] = [
  { key: 'code', label: 'Unique criterion code', required: true },
  { key: 'versionNumber', label: 'Criterion version', required: true },
  { key: 'triggerKey', label: 'Trigger identifier', required: true },
  { key: 'guideline', label: 'Linked guideline record ID' },
  { key: 'referralTarget', label: 'Referral target', required: true },
  {
    key: 'plainLanguageRationale',
    label: 'Plain-language rationale',
    required: true,
    multiline: true,
  },
  { key: 'guidelineCitation', label: 'Exact guideline citation', required: true },
  { key: 'jargonTip', label: 'Terminology note', multiline: true },
  { key: 'recommendedWorkup', label: 'Recommended workup', multiline: true },
  { key: 'versionNotes', label: 'Version notes', multiline: true },
]
const transitions: Record<Lifecycle, Lifecycle[]> = {
  DRAFT: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['ACTIVE', 'RETIRED'],
  ACTIVE: ['SUPERSEDED', 'RETIRED'],
  SUPERSEDED: [],
  RETIRED: [],
}
const transitionLabel: Record<Lifecycle, string> = {
  DRAFT: 'Return to draft',
  UNDER_REVIEW: 'Submit for review',
  APPROVED: 'Approve reviewed content',
  ACTIVE: 'Publish / activate',
  SUPERSEDED: 'Mark superseded',
  RETIRED: 'Retire',
}
const titleField: FieldSpec = { key: 'title', label: 'Title', required: true }
function valueOf(record: RecordDoc, key: string): unknown {
  return (record as unknown as Record<string, unknown>)[key]
}
function fieldsFor(kind: Kind) {
  return [
    titleField,
    ...(kind === 'criterion' ? criterionFields : []),
    ...sourceFields,
    ...metadataFields,
  ]
}
function isArchivedReference(record: RecordDoc) {
  return ['title', 'sourceDocument', 'sourceURL', 'guidelineCitation'].some((key) =>
    /(?:\bPB[\s-]*226\b|practice[\s-]+bulletin(?:[\s-]+no\.?)?[\s:#-]*226\b)/i.test(
      String(valueOf(record, key) ?? ''),
    ),
  )
}
function localDateTime(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
function editorValues(kind: Kind, record: RecordDoc | null) {
  return Object.fromEntries(
    [
      ...fieldsFor(kind),
      ...(kind === 'criterion' ? [{ key: 'pathwaySlug' }, { key: 'urgencyOutcome' }] : []),
    ].map(({ key }) => {
      let value = record ? valueOf(record, key) : ''
      if (key === 'guideline' && value && typeof value === 'object')
        value = (value as { id?: string }).id
      if (
        [...sourceFields, ...metadataFields].some((field) => field.key === key && field.date) &&
        typeof value === 'string'
      )
        value = localDateTime(value)
      return [key, typeof value === 'string' ? value : '']
    }),
  )
}

const REFERENCE_SUGGESTIONS: { title: string; archived?: boolean }[] = [
  { title: 'FOGSI Routine Antenatal Care GCPR' },
  { title: 'FOGSI Preconception Care & Genetics' },
  { title: 'Standard Pedigree Symbols' },
  { title: 'ACOG Committee Opinion 690' },
  { title: 'ACOG Committee Opinion 691' },
  { title: 'ACOG Committee Opinion 793' },
  { title: 'SMFM Consult Series #74' },
  { title: 'ACOG January 2026 Practice Advisory on Fetal Chromosomal Abnormalities' },
  { title: 'ASRM Recurrent Pregnancy Loss Committee Opinion 2026' },
  { title: 'Current applicable NCCN hereditary cancer guidance' },
  { title: 'Relevant SMFM/ACOG fetal structural abnormalities/prenatal diagnosis' },
  { title: 'ACOG PB226 (2020)', archived: true },
]

export function ReferenceCatalog() {
  return (
    <section className={`${card} mt-8 p-6`} aria-label="Reference catalog pending verification">
      <div className="flex items-center gap-2 text-hx-emerald">
        <BookOpen size={21} />
        <h2 className="font-bold">Reference catalog</h2>
      </div>
      <p className="mt-3 text-xs font-bold tracking-wide text-hx-warn">
        REFERENCE CATALOG PENDING VERIFICATION
      </p>
      <p className="mt-3 text-sm leading-relaxed text-hx-slate">
        Static source suggestions only—not durable stored records, active guidelines, approved
        rules, or evidence of alignment. Titles and years below are user-supplied search
        suggestions; no source PDFs or verified metadata are available. Exact titles, publication
        dates, versions, sections, applicability, and currency need verification before reviewer
        approval.
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {REFERENCE_SUGGESTIONS.map((source) => (
          <li
            key={source.title}
            className={`rounded-xl border p-4 ${source.archived ? 'border-hx-warn-line bg-hx-warn-bg' : 'border-hx-border'}`}
          >
            <p className="text-sm font-bold text-hx-ink">{source.title}</p>
            <p
              className={`mt-2 text-xs font-semibold ${source.archived ? 'text-hx-warn' : 'text-hx-muted'}`}
            >
              {source.archived
                ? 'Archived / superseded · Not active · Metadata pending verification'
                : 'Source suggestion · Pending verification · Not approved or active'}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-hx-muted">
        This catalog performs no data writes or automatic seeding. A source is not stored unless an
        authorized reviewer explicitly creates and saves a draft record; saving is not approval or
        activation. “Current applicable” describes the requested search scope, not verified
        currency. PB226 is archived/superseded and must never be activated. No replacement document,
        source pages, versions, publication dates beyond the supplied labels, or recommendations are
        inferred.
      </p>
    </section>
  )
}

export default function GovernancePanel() {
  const { workspace, loading: sessionLoading, error: sessionError } = useClinicalWorkspace()
  const canReview = workspace?.user?.canReviewCriteria === true
  const [kind, setKind] = useState<Kind>('criterion')
  const [records, setRecords] = useState<RecordDoc[]>([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<RecordDoc | null>(null)
  const [editing, setEditing] = useState(false)
  const [clone, setClone] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [conditions, setConditions] = useState('[]')
  const [simulated, setSimulated] = useState(true)
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    let active = true
    setRecords([])
    setSelected(null)
    setEditing(false)
    setValues({})
    setConditions('[]')
    setDirty(false)
    setHasNext(false)
    setLoading(false)
    setError('')
    if (!workspace?.user || sessionLoading) return
    setLoading(true)
    void listGovernanceAction({ kind, page })
      .then((result) => {
        if (!active) return
        if (!result.ok) {
          setError(result.error)
          return
        }
        setRecords(result.records)
        setHasNext(result.hasNextPage)
      })
      .catch(() => {
        if (active) setError('Unable to load governance records. Retry.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [kind, page, generation, workspace?.user?.id, sessionLoading])
  function open(record: RecordDoc | null, revision = false) {
    setSelected(record)
    const next = editorValues(kind, record)
    if (revision && kind === 'criterion') {
      next.code = ''
      next.versionNumber = ''
    }
    setValues(next)
    setConditions(JSON.stringify(record ? (valueOf(record, 'conditions') ?? []) : [], null, 2))
    setSimulated(record ? record.simulated !== false : true)
    setClone(revision)
    setEditing(true)
    setDirty(false)
    setError('')
    setMessage('')
  }
  function change(key: string, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }))
    setDirty(true)
  }
  const locked =
    !!selected && selected.lifecycle !== 'DRAFT' && selected.lifecycle != null && !clone
  const editable = canReview && !locked && !busy
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canReview || locked || busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const patch: Partial<Record<GovernanceEditKey, unknown>> = { simulated }
      for (const field of fieldsFor(kind)) {
        const value = values[field.key] ?? ''
        const original = selected ? valueOf(selected, field.key) : null
        patch[field.key] =
          field.date && value
            ? typeof original === 'string' && localDateTime(original) === value
              ? original
              : new Date(value).toISOString()
            : value || null
      }
      if (kind === 'criterion') {
        patch.pathwaySlug = values.pathwaySlug
        patch.urgencyOutcome = values.urgencyOutcome
        let parsed: unknown
        try {
          parsed = JSON.parse(conditions)
        } catch {
          setError('Conditions must be valid JSON. No changes were saved.')
          return
        }
        if (!Array.isArray(parsed)) {
          setError('Conditions must be a JSON array of {field, equals} objects.')
          return
        }
        patch.conditions = parsed
      }
      const result =
        clone && selected
          ? await createGovernanceRevisionAction({ kind, id: selected.id, patch })
          : await saveGovernanceDraftAction({
              kind,
              ...(selected ? { id: selected.id, expectedUpdatedAt: selected.updatedAt } : {}),
              patch,
            })
      if (!result.ok) {
        setError(
          result.error +
            ('fieldErrors' in result ? ` ${Object.keys(result.fieldErrors).join(', ')}` : ''),
        )
        return
      }
      setMessage('Draft saved on the server. It is not approved or active.')
      setGeneration((value) => value + 1)
    } catch {
      setError('Save could not be confirmed. Reload the current record before retrying.')
    } finally {
      setBusy(false)
    }
  }
  async function transition(to: Lifecycle) {
    if (!selected || !canReview || dirty || busy) return
    if (isArchivedReference(selected) && (to === 'APPROVED' || to === 'ACTIVE')) {
      setError('PB226 is archived / superseded and cannot be approved or activated here.')
      return
    }
    if (
      !window.confirm(
        `${transitionLabel[to]}? This is a server-validated lifecycle change, not a draft edit.`,
      )
    )
      return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await transitionGovernanceAction({
        kind,
        id: selected.id,
        expectedUpdatedAt: selected.updatedAt,
        to,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage(`Server confirmed lifecycle: ${to}.`)
      setGeneration((value) => value + 1)
    } catch {
      setError('Transition could not be confirmed. Reload before retrying.')
    } finally {
      setBusy(false)
    }
  }
  const renderField = (field: FieldSpec) => (
    <label
      key={field.key}
      className={`block text-sm font-semibold text-hx-ink ${field.multiline ? 'sm:col-span-2' : ''}`}
    >
      {field.label}
      {field.multiline ? (
        <textarea
          className={`${inputCls} mt-1 min-h-24`}
          value={values[field.key] ?? ''}
          onChange={(event) => change(field.key, event.target.value)}
          required={field.required}
          maxLength={8000}
          disabled={!editable}
        />
      ) : (
        <input
          className={`${inputCls} mt-1`}
          type={field.date ? 'datetime-local' : field.key === 'sourceURL' ? 'url' : 'text'}
          value={values[field.key] ?? ''}
          onChange={(event) => change(field.key, event.target.value)}
          required={field.required}
          maxLength={8000}
          disabled={!editable}
        />
      )}
    </label>
  )
  return (
    <>
      <PageHeader
        eyebrow="Reviewer-governed content"
        title="Clinical governance"
        subtitle="Inspect source records, author drafts, and progress through explicit review and publication. No starter content is preapproved."
      />
      <StaffSignIn />
      <section className={`${card} mb-5 p-5 text-sm text-hx-slate`}>
        <p>
          Only a signed-in, currently authorized qualified reviewer may create, edit metadata,
          approve, or publish. Administrator status alone is not sufficient under the current
          backend policy. Every mutation is validated again on the server.
        </p>
        <p className="mt-2">
          Lifecycle labels alone do not establish current clinical eligibility. Approval evidence,
          source currency, effective dates, review deadlines, and linked guideline snapshots are
          checked by the backend.
        </p>
      </section>
      <div className="mb-5 flex flex-wrap gap-3">
        {(['criterion', 'guideline'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={kind === value ? btnPrimary : btnGhost}
            aria-pressed={kind === value}
            disabled={busy}
            onClick={() => {
              setKind(value)
              setPage(1)
              setMessage('')
            }}
          >
            {value === 'criterion' ? 'Criteria' : 'Guideline references'}
          </button>
        ))}
        <button
          type="button"
          className={btnGhost}
          disabled={loading || busy}
          onClick={() => setGeneration((value) => value + 1)}
        >
          <RefreshCw size={16} /> Reload
        </button>
        {canReview && (
          <button type="button" className={btnGhost} disabled={busy} onClick={() => open(null)}>
            <Plus size={16} /> New draft
          </button>
        )}
      </div>
      {(sessionError || error) && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error || sessionError}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 rounded-xl bg-hx-mint p-4 text-sm text-hx-emerald">
          {message}
        </p>
      )}
      {sessionLoading || loading ? (
        <p role="status" className="text-sm text-hx-slate">
          Loading governance catalog…
        </p>
      ) : !workspace?.user ? (
        <Empty
          title="Staff sign-in required"
          text="Sign in to inspect the governed records available to your account."
        />
      ) : (
        <>
          {!canReview && (
            <p className="mb-4 text-sm text-hx-slate">
              Read-only access. Current reviewer authorization is required for metadata management
              and lifecycle actions.
            </p>
          )}
          {!records.length ? (
            <Empty
              title="No records on this page"
              text="No preapproved or simulated starter rules have been substituted for server records."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {records.map((record) => (
                <button
                  type="button"
                  key={record.id}
                  onClick={() => open(record)}
                  disabled={busy}
                  className={`${card} p-5 text-left transition hover:border-hx-accent focus-visible:ring-2 focus-visible:ring-hx-accent`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <strong className="text-hx-ink">{record.title || 'Untitled record'}</strong>
                    <FilePenLine size={17} className="shrink-0 text-hx-emerald" />
                  </span>
                  <span className="mt-3 block text-xs font-bold text-hx-emerald">
                    {isArchivedReference(record)
                      ? 'ARCHIVED / SUPERSEDED — not eligible'
                      : (record.lifecycle ?? 'DRAFT')}{' '}
                    ·{' '}
                    {record.simulated === false
                      ? 'Non-simulated classification'
                      : 'Simulated / unclassified'}
                  </span>
                  <span className="mt-2 block break-all text-xs text-hx-muted">
                    ID: {record.id}
                  </span>
                </button>
              ))}
            </div>
          )}
          <nav aria-label="Governance catalog pages" className="my-5 flex items-center gap-3">
            <button
              type="button"
              className={btnGhost}
              disabled={page === 1 || loading || busy}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span className="text-sm text-hx-slate">Page {page}</span>
            <button
              type="button"
              className={btnGhost}
              disabled={!hasNext || loading || busy}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
      {editing && workspace?.user && (
        <section className={`${card} mt-6 p-6`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-hx-ink">
              {clone
                ? 'New revision draft'
                : selected
                  ? `Record · ${selected.lifecycle ?? 'DRAFT'}`
                  : 'New draft'}
            </h2>
            {selected && canReview && !clone && (
              <button
                type="button"
                className={btnGhost}
                disabled={busy}
                onClick={() => open(selected, true)}
              >
                <CopyPlus size={16} /> Create new revision
              </button>
            )}
          </div>
          {locked && (
            <p className="mb-5 text-sm text-hx-slate">
              Content is locked outside draft. Create a new revision to change it; the source record
              and approval snapshot remain intact.
            </p>
          )}
          <form onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              {renderField(titleField)}
              {kind === 'criterion' && (
                <>
                  {criterionFields.map(renderField)}
                  <label className="text-sm font-semibold text-hx-ink">
                    Pathway
                    <select
                      className={`${inputCls} mt-1`}
                      required
                      disabled={!editable}
                      value={values.pathwaySlug ?? ''}
                      onChange={(event) => change('pathwaySlug', event.target.value)}
                    >
                      <option value="">Select pathway</option>
                      {Object.keys(FORM_FIELDS).map((slug) => (
                        <option key={slug} value={slug}>
                          {slug.replaceAll('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-hx-ink">
                    Decision category
                    <select
                      className={`${inputCls} mt-1`}
                      required
                      disabled={!editable}
                      value={values.urgencyOutcome ?? ''}
                      onChange={(event) => change('urgencyOutcome', event.target.value)}
                    >
                      <option value="">Select category</option>
                      {['urgent', 'routine', 'borderline', 'none'].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-hx-ink sm:col-span-2">
                    Explicit conditions (JSON)
                    <textarea
                      className={`${inputCls} mt-1 min-h-44 font-mono`}
                      spellCheck={false}
                      disabled={!editable}
                      value={conditions}
                      onChange={(event) => {
                        setConditions(event.target.value)
                        setDirty(true)
                      }}
                    />
                    <span className="mt-2 block text-xs font-normal text-hx-muted">
                      Array of objects with only field and equals. All conditions must match. Use
                      exact structured input field keys; boolean values for checkboxes. The backend
                      validates pathway membership and allowed values. No clinical thresholds or
                      default conditions are supplied.
                    </span>
                  </label>
                </>
              )}
            </div>
            <h3 className="mt-7 mb-4 font-bold text-hx-ink">Source provenance</h3>
            <div className="grid gap-4 sm:grid-cols-2">{sourceFields.map(renderField)}</div>
            <h3 className="mt-7 mb-4 font-bold text-hx-ink">
              Applicability, evidence & review metadata
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">{metadataFields.map(renderField)}</div>
            <label className="mt-5 flex items-start gap-3 text-sm text-hx-ink">
              <input
                type="checkbox"
                className="mt-1 accent-emerald-700"
                checked={simulated}
                disabled={!editable}
                onChange={(event) => {
                  setSimulated(event.target.checked)
                  setDirty(true)
                }}
              />{' '}
              Simulated / unverified content. Clearing this is a classification statement, not
              approval.
            </label>
            <p className="mt-3 text-xs text-hx-muted">
              Dates use your browser’s local time and are saved as UTC. Do not infer missing source
              years, pages, versions, evidence, or legal applicability. PB226 is archived/superseded
              and must not be activated.
            </p>
            {canReview && !locked && (
              <button className={`${btnPrimary} mt-5`} disabled={busy}>
                <Save size={16} />{' '}
                {busy ? 'Saving…' : clone ? 'Save new revision as draft' : 'Save draft & metadata'}
              </button>
            )}
          </form>
          {selected && !clone && (
            <>
              <div className="mt-6 border-t border-hx-border pt-5">
                <h3 className="font-bold text-hx-ink">Lifecycle actions</h3>
                <p className="mt-2 text-sm text-hx-slate">
                  Save draft edits before a transition. Approval and publication are separate
                  actions; completion and source checks are enforced by the server.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(transitions[selected.lifecycle ?? 'DRAFT'] ?? []).map((to) => (
                    <button
                      key={to}
                      type="button"
                      className={btnGhost}
                      disabled={
                        !canReview ||
                        busy ||
                        dirty ||
                        (isArchivedReference(selected) && (to === 'APPROVED' || to === 'ACTIVE'))
                      }
                      onClick={() => transition(to)}
                    >
                      {transitionLabel[to]}
                    </button>
                  ))}
                </div>
              </div>
              <details className="mt-5 text-sm text-hx-slate">
                <summary className="cursor-pointer font-semibold">
                  Approval snapshot & governance history (read-only)
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-hx-mint p-4 text-xs whitespace-pre-wrap break-all">
                  {JSON.stringify(
                    {
                      id: selected.id,
                      updatedAt: selected.updatedAt,
                      approvalDigest: selected.approvalDigest ?? null,
                      approvedSnapshot: selected.approvedSnapshot ?? null,
                      governanceHistory: selected.governanceHistory ?? [],
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </>
          )}
        </section>
      )}
      <ReferenceCatalog />
    </>
  )
}
