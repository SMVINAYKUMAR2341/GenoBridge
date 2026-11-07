'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  History,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import type { Pathway } from '@/data/pathways'
import { PageHeader, btnGhost, btnPrimary, card, inputCls } from '@/components/ui/Primitives'
import StaffSignIn, { useClinicalWorkspace } from '@/components/clinical/StaffSignIn'
import { PedigreeEditor } from '@/components/clinical/PedigreeEditor'
import { createEmptyPedigree, parsePedigree } from '@/components/clinical/pedigree-model'
import { RoutineAnc } from '@/components/clinical/RoutineAnc'
import { createEmptyRoutineAnc, parseRoutineAnc } from '@/lib/anc-model'
import { ClinicalHistory } from './ClinicalHistory'
import { WorkflowResult, OUTCOME_LABELS } from './WorkflowResult'
import { canFinalizeWorkflow } from './workflow-result-model'
import { useAssessmentWorkflow, type SpecialistReviewAction } from './useAssessmentWorkflow'
import { evaluatePathway, buildConcatenatedFeatures, type DecisionResult } from '@/lib/decision-engine'

const TABS = ['Clinical Intake & Parameters', 'Referral Decision & Clinical Report']
type Props = { pathway: Pathway; requestSpecialistReviewAction?: SpecialistReviewAction }

export default function AssessmentFlow({ pathway, requestSpecialistReviewAction }: Props) {
  const { workspace, loading, error, reload } = useClinicalWorkspace()
  const user = workspace?.user
  return (
    <>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-slate-950 transition"
      >
        <ArrowLeft size={15} /> All pathways
      </Link>
      <PageHeader
        eyebrow={pathway.guidelines}
        title={pathway.title}
        subtitle={pathway.description}
      />
      <StaffSignIn />

      {loading ? (
        <p role="status" className={`${card} flex items-center gap-2 p-5`}>
          <RefreshCw size={17} className="animate-spin" /> Loading authorized clinical workspace…
        </p>
      ) : error ? (
        <div role="alert" className={`${card} p-5`}>
          <p className="text-red-700">{error}</p>
          <button type="button" className={`${btnGhost} mt-3`} onClick={reload}>
            Retry workspace load
          </button>
        </div>
      ) : !user ? (
        <ClinicalAssessment
          key={`guest:provider:${pathway.slug}`}
          pathway={pathway}
          provider={true}
          requestSpecialistReviewAction={requestSpecialistReviewAction}
        />
      ) : user.role === 'admin' ? (
        <div className={`${card} p-5`}>
          <h2 className="flex items-center gap-2 font-bold">
            <ShieldAlert size={18} /> Aggregate-only access
          </h2>
          <p className="mt-2 text-sm">
            Administrators cannot open, create, review or download individual clinical records. Use
            the governance or aggregate analytics workspace.
          </p>
        </div>
      ) : (
        <ClinicalAssessment
          key={`${user.id}:${user.role}:${pathway.slug}`}
          pathway={pathway}
          provider={user.role === 'provider'}
          requestSpecialistReviewAction={requestSpecialistReviewAction}
        />
      )}
    </>
  )
}

function ClinicalAssessment({
  pathway,
  provider,
  requestSpecialistReviewAction,
}: Props & { provider: boolean }) {
  const workflow = useAssessmentWorkflow(pathway.slug, provider, requestSpecialistReviewAction)
  const [tab, setTab] = useState(0)
  const [evaluationResult, setEvaluationResult] = useState<DecisionResult | null>(null)
  const [emptyPedigree] = useState(createEmptyPedigree)
  const [emptyAnc] = useState(createEmptyRoutineAnc)
  const record = workflow.record
  const result = record?.evaluationSnapshot?.result as Record<string, unknown> | undefined
  const decision = typeof result?.decision === 'string' ? result.decision : ''
  const reviewable = provider && !!record && ['SUBMITTED', 'IN_REVIEW'].includes(record.state)
  const finalizable = provider && canFinalizeWorkflow(record)
  const safeguard = provider && record?.state === 'IN_REVIEW' && !canFinalizeWorkflow(record)
  const pedigree = useMemo(
    () =>
      Object.keys(workflow.pedigree).length
        ? parsePedigree(workflow.pedigree)
        : { success: true as const, data: emptyPedigree },
    [workflow.pedigree, emptyPedigree],
  )
  // RoutineAnc syncs its internal draft when value changes. Keep the parsed
  // value stable during unrelated renders and while an incomplete edit is fixed.
  const anc = useMemo(
    () =>
      Object.keys(workflow.anc).length
        ? parseRoutineAnc(workflow.anc)
        : { success: true as const, data: emptyAnc },
    [workflow.anc, emptyAnc],
  )
  const disabled = workflow.busy || !workflow.editable

  if (workflow.loading)
    return (
      <p role="status" className="flex items-center gap-2 p-5">
        <RefreshCw size={17} className="animate-spin" /> Loading saved workflow…
      </p>
    )
  if (workflow.loadFailed)
    return (
      <section className={`${card} space-y-3 p-5`}>
        <p role="alert" className="text-sm text-red-700">
          {workflow.error}
        </p>
        <p className="text-sm">
          The linked record was not loaded. Saving is blocked so it cannot be replaced with a blank
          draft.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={btnGhost} onClick={() => window.location.reload()}>
            Retry loading
          </button>
          <a className={btnPrimary} href={`/assessment/${pathway.slug}`}>
            Start a separate new assessment
          </a>
        </div>
      </section>
    )

  return (
    <div className="space-y-5" aria-busy={workflow.busy}>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white p-4 text-slate-900 shadow-xs">
        <div className="text-sm">
          <p className="font-bold text-slate-900">
            {record
              ? `${record.syntheticPatientReference || 'Clinical Record'} · ${record.state} · Revision ${record.revision}`
              : `Clinical Decision Support · ${pathway.title}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {record
              ? 'Persisted clinical workflow and referral audit record.'
              : 'Deterministic 2-step clinical evaluation. Inputs are evaluated against verified clinical practice guidelines.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhost}
            disabled={workflow.busy}
            onClick={() => void workflow.reload()}
          >
            <RefreshCw size={15} className="text-slate-700" /> Reload persisted record
          </button>
          <a
            href={`/assessment/${pathway.slug}`}
            className={btnGhost}
            onClick={(event) => {
              if (
                workflow.busy ||
                (workflow.dirty &&
                  !window.confirm('Leave this assessment and discard unsaved changes?'))
              )
                event.preventDefault()
            }}
          >
            New assessment
          </a>
        </div>
      </section>
      {workflow.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <p className="font-bold text-red-900">Action not confirmed</p>
          <p className="mt-1">{workflow.error}</p>
          {Object.entries(workflow.fieldErrors).length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {Object.entries(workflow.fieldErrors).map(([key, error]) => (
                <li key={key}>
                  {key}: {error}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2">
            Your unsaved inputs remain in this page. For a revision conflict or interrupted
            response, reload the persisted record before retrying.
          </p>
        </div>
      )}
      {workflow.notice && (
        <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
          {workflow.notice}
        </p>
      )}

      {workflow.busy && (
        <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw size={15} className="animate-spin text-slate-900" /> Waiting for server confirmation…
        </p>
      )}

      <div role="tablist" aria-label="Assessment sections" className="flex flex-wrap gap-2">
        {TABS.map((name, index) => (
          <button
            key={name}
            id={`assessment-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={tab === index}
            aria-controls={`assessment-panel-${index}`}
            tabIndex={tab === index ? 0 : -1}
            onClick={() => setTab(index)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % TABS.length
                  : event.key === 'ArrowLeft'
                    ? (index + TABS.length - 1) % TABS.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? TABS.length - 1
                        : null
              if (next !== null) {
                event.preventDefault()
                setTab(next)
                document.getElementById(`assessment-tab-${next}`)?.focus()
              }
            }}
            className={tab === index ? btnPrimary : btnGhost}
          >
            {index + 1}. {name}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`assessment-panel-${tab}`}
        aria-labelledby={`assessment-tab-${tab}`}
        className="space-y-5"
      >
        {tab === 0 && (
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 lg:p-8 text-slate-900 shadow-xs">
              <fieldset disabled={disabled}>
                <ClinicalHistory
                  slug={pathway.slug}
                  inputs={workflow.inputs}
                  intake={workflow.intake}
                  syntheticReference={workflow.syntheticReference}
                  errors={workflow.fieldErrors}
                  onInput={workflow.changeInput}
                  onIntake={workflow.changeIntake}
                  onReference={workflow.changeReference}
                />
              </fieldset>
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xs space-y-3">
                <div className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-slate-700">
                  Patient MRN / ID
                </div>
                <input
                  type="text"
                  placeholder="e.g. MRN-94821 or Patient Name"
                  value={workflow.syntheticReference || ''}
                  onChange={(e) => workflow.changeReference(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
                />
                <div className="text-xs text-slate-600 leading-relaxed">
                  Linked directly to the clinical encounter for automated brief and PDF generation.
                </div>
                {Object.keys(workflow.pedigree).length > 0 && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800">
                    <div className="font-bold text-slate-900">Pedigree on file</div>
                    <div className="mt-0.5 text-slate-600">Family history is auto-derived from the pedigree.</div>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  data-testid="run-assessment-btn"
                  onClick={async () => {
                    workflow.clearError?.()
                    const features = buildConcatenatedFeatures(pathway.slug, workflow.inputs)
                    let evaluated = evaluatePathway(pathway.slug, workflow.inputs)
                    try {
                      const res = await fetch('/api/evaluate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pathway: pathway.slug, features, inputs: workflow.inputs }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        evaluated = {
                          ...evaluated,
                          confidence_score: data.match_confidence ? Number(data.match_confidence) / 100 : evaluated.confidence_score,
                          outcome: (data.outcome || data.clinical_risk || evaluated.outcome).toLowerCase(),
                          tier: data.tier || evaluated.tier,
                          explanation: data.recommended_action || data.explanation || evaluated.explanation,
                          clinical_decision: data.clinical_decision || evaluated.clinical_decision,
                          referral_target: data.referral_target || evaluated.referral_target,
                          guideline_citations: data.guideline_source
                            ? Array.from(new Set([data.guideline_source, ...(data.guideline_citations || evaluated.guideline_citations || [])]))
                            : evaluated.guideline_citations,
                          fired_rules: data.fired_rules && data.fired_rules.length > 0 ? data.fired_rules : evaluated.fired_rules,
                          matched_criteria: data.matched_criteria && data.matched_criteria.length > 0 ? data.matched_criteria : evaluated.matched_criteria,
                          counterfactuals: data.counterfactuals || evaluated.counterfactuals,
                          patient_summary_en: data.patient_summary_en || evaluated.patient_summary_en,
                          patient_summary_hi: data.patient_summary_hi || evaluated.patient_summary_hi,
                        }
                      }
                    } catch (fetchErr) {
                      console.warn('Backend evaluation call failed, using client deterministic SaMD engine:', fetchErr)
                    }
                    setEvaluationResult(evaluated)
                    try {
                      if (workflow.editable) {
                        await workflow.save(true)
                      }
                    } catch { }
                    setTab(1)
                  }}
                  disabled={workflow.busy}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{workflow.busy ? 'Evaluating…' : 'Run Decision Support →'}</span>
                </button>
                <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                  Live statutory evaluation · Deterministic Glass-Box clinical rationale.
                </p>
              </div>
            </aside>
          </div>
        )}
        {tab === 1 && (
          <>
            <WorkflowResult
              record={record}
              decision={evaluationResult || evaluatePathway(pathway.slug, workflow.inputs)}
              pathwaySlug={pathway.slug}
              inputs={workflow.inputs}
              onReturnToForm={() => setTab(0)}
            />
            {record && record.state !== 'DRAFT' && record.state !== 'FINALIZED' && (
              <section className={`${card} space-y-4 p-5`}>
                <h2 className="text-lg font-bold">Clinical review & signoff</h2>
                {!provider ? (
                  <p className="text-sm text-hx-muted">
                    Submitted for provider review. Nurses may save drafts and submit them, but
                    cannot clinically review, return or finalize records.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-hx-muted">
                      Review evaluates the persisted revision on the server. Finalization rechecks
                      the evaluation digest and records the authenticated clinician, timestamp,
                      attestation and approval note. Returning to draft retains earlier revisions.
                    </p>
                    <label className="grid gap-1.5 text-sm font-bold">
                      Clinical approval / correction / specialist-review note
                      <textarea
                        className={inputCls}
                        rows={4}
                        value={workflow.reviewNote}
                        maxLength={4000}
                        disabled={workflow.busy}
                        onChange={(event) => workflow.setReviewNote(event.target.value)}
                        placeholder="Document your review, requested corrections, or reason for specialist review."
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={btnPrimary}
                        disabled={workflow.busy || !reviewable}
                        onClick={() => void workflow.transition('review')}
                      >
                        <ClipboardCheck size={16} />{' '}
                        {record.state === 'IN_REVIEW'
                          ? 'Review again on server'
                          : 'Review on server'}
                      </button>
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={workflow.busy || !reviewable || !workflow.reviewNote.trim()}
                        onClick={() => void workflow.transition('return')}
                      >
                        Return to draft with note
                      </button>
                    </div>
                    {safeguard && (
                      <div className="space-y-3 rounded-xl border border-hx-warn-line bg-hx-warn-bg p-4 text-sm text-hx-warn">
                        <p className="font-bold">Specialist review required</p>
                        <p>
                          Document the uncertainty and reason for escalation. Safeguard states
                          cannot be finalized as a referral or no-referral decision.
                        </p>
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={
                            workflow.busy ||
                            !workflow.reviewNote.trim() ||
                            !requestSpecialistReviewAction
                          }
                          onClick={() => void workflow.transition('specialist')}
                        >
                          Request specialist review with documented reason
                        </button>
                        {!requestSpecialistReviewAction && (
                          <p>
                            Specialist-review handoff is not yet connected. No request has been
                            sent. Follow your local escalation process; the note can be retained
                            through an explicit review or return-to-draft action.
                          </p>
                        )}
                      </div>
                    )}
                    {finalizable && (
                      <div className="space-y-4 border-t border-hx-border pt-4">
                        <label className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-800">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-slate-900"
                            checked={workflow.attest}
                            disabled={workflow.busy}
                            onChange={(event) => workflow.setAttest(event.target.checked)}
                          />
                          <span>
                            I reviewed the clinical parameters, server
                            evaluation and source evidence. I confirm the clinical decision and
                            approve this report as the authenticated reviewing clinician.
                          </span>
                        </label>
                        <button
                          type="button"
                          className={btnPrimary}
                          disabled={
                            workflow.busy || !workflow.attest || !workflow.reviewNote.trim()
                          }
                          onClick={() => void workflow.transition('finalize')}
                        >
                          <Check size={16} />{' '}
                          {decision === 'no_referral_needed'
                            ? 'Approve & save no-referral decision'
                            : 'Approve & finalize referral'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}
      </section>

      <footer className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div className="flex gap-2">
          <button
            type="button"
            className={btnGhost}
            disabled={tab === 0}
            onClick={() => setTab(0)}
          >
            <ArrowLeft size={15} /> Modify Inputs
          </button>
          <button
            type="button"
            className={tab === 0 ? btnPrimary : btnGhost}
            disabled={tab === 1}
            onClick={() => {
              const runBtn = document.querySelector('[data-testid="run-assessment-btn"]') as HTMLButtonElement | null
              if (runBtn) runBtn.click()
              else setTab(1)
            }}
          >
            {tab === 0 ? 'Evaluate Referral Decision →' : 'Decision Rendered'}
          </button>
        </div>
        {workflow.editable ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnGhost}
              disabled={workflow.busy}
              onClick={() => void workflow.save()}
            >
              <Save size={16} /> Save draft
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={workflow.busy}
              onClick={() => {
                setTab(1)
                void workflow.submit()
              }}
            >
              <ClipboardCheck size={16} /> Save & submit for review
            </button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-hx-muted">
            {record?.state === 'FINALIZED'
              ? 'Finalized revisions are immutable.'
              : 'Submitted record is locked. A provider must return it to draft before edits.'}
          </p>
        )}
      </footer>

      {workflow.history.length > 0 && (
        <section className={`${card} space-y-3 p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <History size={18} /> Append-only revision history
          </h2>
          <ol className="space-y-3">
            {workflow.history.map((revision) => (
              <li
                key={revision.revisionKey}
                className="rounded-xl border border-hx-border p-4 text-sm"
              >
                <p className="font-bold">
                  Revision {revision.revision} · {revision.state} · {revision.createdAt}
                </p>
                <p className="mt-1 text-hx-muted">
                  Staff ID: {revision.actor} ·{' '}
                  {OUTCOME_LABELS[revision.decision ?? ''] ?? 'No finalized clinical decision'}
                </p>
                {revision.reviewNote && (
                  <p className="mt-2 whitespace-pre-wrap">Review note: {revision.reviewNote}</p>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">
                    View this immutable revision report
                  </summary>
                  <div className="mt-4">
                    <WorkflowResult record={revision} />
                  </div>
                </details>
              </li>
            ))}
          </ol>
          {workflow.hasMoreHistory && (
            <button
              type="button"
              className={btnGhost}
              disabled={workflow.busy}
              onClick={() => void workflow.loadMoreHistory()}
            >
              Load earlier revisions
            </button>
          )}
        </section>
      )}
    </div>
  )
}
