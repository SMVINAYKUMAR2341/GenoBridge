'use client'

import { useEffect, useRef, useState } from 'react'
import {
  saveWorkflowDraftAction,
  loadWorkflowAction,
  submitWorkflowAction,
  reviewWorkflowAction,
  returnWorkflowToDraftAction,
  finalizeWorkflowAction,
} from '@/app/(frontend)/workflow-actions'
import { parseClinicalInputs } from '@/lib/form-fields'
import { parseRoutineAnc } from '@/lib/anc-model'
import { canFinalizeWorkflow } from './workflow-result-model'
import type { StructuredFormState, PathwaySlug } from '@/lib/decision-engine'
import type { WorkflowRecord, WorkflowDraftInput, WorkflowIntake } from '@/lib/workflow-store'
import { deriveFeatures } from '@/components/pedigree/PedigreeStudioClient'

export type WorkflowActionResult =
  | { ok: true; record: WorkflowRecord }
  | {
      ok: false
      error: string
      fieldErrors?: Record<string, string>
    }
/** Integration seam for the parent's specialist-handoff action. Never simulated. */
export type SpecialistReviewAction = (input: {
  workflowKey: string
  expectedRevision: number
  reviewNote: string
}) => Promise<WorkflowActionResult>
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'The request could not be confirmed. Reload the persisted record before retrying.'

export function useAssessmentWorkflow(
  slug: PathwaySlug,
  provider: boolean,
  specialistAction?: SpecialistReviewAction,
) {
  const [record, setRecord] = useState<WorkflowRecord | null>(null)
  const latest = useRef<WorkflowRecord | null>(null)
  const workflowKey = useRef('')
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  const [inputs, setInputs] = useState<StructuredFormState>({})
  const [intake, setIntake] = useState<WorkflowIntake>({})
  const [pedigree, setPedigree] = useState<NonNullable<WorkflowDraftInput['pedigree']>>({})
  const [anc, setAnc] = useState<NonNullable<WorkflowDraftInput['anc']>>({})
  const [ancError, setAncError] = useState('')
  const [syntheticReference, setSyntheticReference] = useState('')
  const [dirty, setDirty] = useState(false)
  const [history, setHistory] = useState<WorkflowRecord[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [attest, setAttest] = useState(false)

  function accept(saved: WorkflowRecord, hydrate: boolean) {
    latest.current = saved
    workflowKey.current = saved.workflowKey
    setRecord(saved)
    setAttest(false)
    setReviewNote('')
    setHistory((rows) =>
      [saved, ...rows.filter((row) => row.revision !== saved.revision)].sort(
        (a, b) => b.revision - a.revision,
      ),
    )
    if (hydrate) {
      setInputs({ ...saved.assessmentInputs } as StructuredFormState)
      setIntake({ ...saved.intake } as WorkflowIntake)
      let ped = saved.pedigree
      if ((!ped || Object.keys(ped).length === 0) && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('genobridge_active_pedigree_model')
          if (stored) ped = JSON.parse(stored)
        } catch {}
      }
      setPedigree(ped)
      setAnc(saved.anc)
      setAncError('')
      setSyntheticReference(saved.syntheticPatientReference ?? '')
    }
    setDirty(false)
  }

  // Read-only initialization. No draft writes or automatic evaluations in effects.
  useEffect(() => {
    let active = true
    const key = new URL(window.location.href).searchParams.get('workflow')
    if (!key) {
      if (typeof window !== 'undefined') {
        try {
          const savedModel = localStorage.getItem('genobridge_active_pedigree_model')
          const savedPed = localStorage.getItem('genobridge_active_pedigree')
          if (savedModel) {
            const parsed = JSON.parse(savedModel)
            setPedigree(parsed)
          }
          if (savedPed) {
            const parsedData = JSON.parse(savedPed)
            const derived = deriveFeatures(parsedData)
            setInputs((prev) => ({
              ...prev,
              ...(derived.consanguinity ? { consanguinity: true, consanguineous_partnership: true } : {}),
              ...(derived.ashkenazi_ancestry ? { ashkenazi_ancestry: true } : {}),
              ...(derived.family_history_recessive_condition ? { family_history_recessive_condition: true, family_history_recessive: true } : {}),
              ...(derived.male_breast_cancer_family ? { male_breast_cancer_family: true, male_breast_cancer: true } : {}),
              ...((derived.family_ovarian_cancer_count ?? 0) > 0 ? { family_ovarian_cancer_count: derived.family_ovarian_cancer_count, family_history_ovarian: true } : {}),
              ...((derived.family_breast_cancer_first_degree_count ?? 0) > 0 ? { family_breast_cancer_first_degree_count: derived.family_breast_cancer_first_degree_count, family_history_breast: true } : {}),
            }))
          }
        } catch (e) {
          console.warn('[useAssessmentWorkflow] Could not hydrate pedigree:', e)
        }
      }
      setLoading(false)
      return
    }
    workflowKey.current = key
    if (!uuid.test(key)) {
      setError('Invalid workflow link. Start a new assessment or open a valid saved workflow.')
      setLoadFailed(true)
      setLoading(false)
      return
    }
    void loadWorkflowAction({ workflowKey: key })
      .then((result) => {
        if (!active) return
        if (!result.ok) throw new Error(result.error)
        const current = result.records[0]
        if (!result.user || result.user.role === 'admin' || !current)
          throw new Error('Workflow unavailable for this staff account.')
        if (current.pathwaySlug !== slug)
          throw new Error(
            'This workflow belongs to another pathway. Open it from saved assessments.',
          )
        accept(current, true)
        setHistory(result.records)
        setHasMoreHistory(result.hasNextPage)
      })
      .catch((reason) => {
        if (active) {
          setError(message(reason))
          setLoadFailed(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  function edited() {
    setDirty(true)
    setNotice('')
    setAttest(false)
  }
  const editable = !loading && !loadFailed && (!record || record.state === 'DRAFT')
  async function run(task: () => Promise<void>, silent = false) {
    // A state-only lock leaves a same-tick window before React re-renders.
    if (lock.current || loading || loadFailed) return
    lock.current = true
    setBusy(true)
    if (!silent) {
      setError('')
      setFieldErrors({})
    }
    setNotice('')
    try {
      await task()
    } catch (reason) {
      if (!silent) {
        setError(message(reason))
      } else {
        console.warn('[useAssessmentWorkflow] Silent operation note:', reason)
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  function checked(result: WorkflowActionResult) {
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {})
      throw new Error(result.error)
    }
    accept(result.record, true)
    return result.record
  }
  async function persistDraft() {
    if (ancError) throw new Error(`Correct Routine ANC before saving: ${ancError}`)
    if (latest.current && latest.current.state !== 'DRAFT')
      throw new Error('Only drafts are editable. Return this record to draft before changing it.')
    // Generate once, before the first attempt. A failed or indeterminate response
    // must never cause a retry to create a different workflow.
    if (!workflowKey.current) workflowKey.current = crypto.randomUUID()
    const result = await saveWorkflowDraftAction({
      workflowKey: workflowKey.current,
      expectedRevision: latest.current?.revision ?? 0,
      draft: {
        patient: null,
        syntheticPatientReference: syntheticReference,
        pathwaySlug: slug,
        intake,
        pedigree,
        anc,
        assessmentInputs: parseClinicalInputs(slug, inputs),
      },
    })
    const saved = checked(result)
    const url = new URL(window.location.href)
    url.searchParams.set('workflow', saved.workflowKey)
    window.history.replaceState(window.history.state, '', url)
    return saved
  }
  const save = (silent = false) =>
    run(async () => {
      await persistDraft()
      if (!silent) {
        setNotice('Draft saved as a new server revision. No clinical recommendation has been made.')
      }
    }, silent)
  const submit = () =>
    run(async () => {
      const current = dirty || !latest.current ? await persistDraft() : latest.current
      if (current.state !== 'DRAFT') throw new Error('Only a draft can be submitted.')
      checked(
        await submitWorkflowAction({
          workflowKey: current.workflowKey,
          expectedRevision: current.revision,
        }),
      )
      setNotice('Submitted for provider review. Evaluation requires the separate Review action.')
    })
  async function transition(kind: 'review' | 'return' | 'finalize' | 'specialist') {
    await run(async () => {
      if (!provider) throw new Error('Only a provider can perform this clinical action.')
      const current = latest.current
      if (!current) throw new Error('Save and submit a draft first.')
      if (dirty) throw new Error('Save your changes before clinical review.')
      const command = {
        workflowKey: current.workflowKey,
        expectedRevision: current.revision,
        reviewNote: reviewNote.trim(),
      }
      if (kind === 'review') {
        if (!['SUBMITTED', 'IN_REVIEW'].includes(current.state))
          throw new Error('Submit the draft before review.')
        checked(await reviewWorkflowAction(command))
        setNotice(
          'Persisted clinical data evaluated on the server. Review the result before signing.',
        )
      } else if (kind === 'return') {
        if (!command.reviewNote)
          throw new Error('Document what needs correction before returning to draft.')
        checked(await returnWorkflowToDraftAction(command))
        setNotice(
          'Returned to draft with a documented correction note. Prior revisions are retained.',
        )
      } else if (kind === 'specialist') {
        if (!command.reviewNote) throw new Error('Document a reason for specialist review.')
        if (!specialistAction)
          throw new Error('Specialist-review handoff is not connected. No request was sent.')
        checked(await specialistAction(command))
        setNotice('Specialist-review request saved by the server.')
      } else {
        const result = current.evaluationSnapshot?.result as Record<string, unknown> | undefined
        if (!canFinalizeWorkflow(current))
          throw new Error(
            'Only a current, complete primary outcome can be finalized. Safety states require specialist review.',
          )
        if (!attest || !command.reviewNote)
          throw new Error('Confirm your review and document your clinical approval note.')
        checked(
          await finalizeWorkflowAction({
            ...command,
            attest: true,
            expectedEvaluationDigest: current.evaluationSnapshot?.evaluationDigest,
          }),
        )
        setNotice(
          result?.decision === 'no_referral_needed'
            ? 'No-referral decision saved with clinician signoff.'
            : 'Referral finalized with clinician signoff.',
        )
      }
    })
  }
  const reload = () =>
    run(async () => {
      if (!workflowKey.current) return
      if (dirty && !window.confirm('Discard unsaved edits and load the latest server revision?'))
        return
      const result = await loadWorkflowAction({ workflowKey: workflowKey.current })
      if (!result.ok) throw new Error(result.error)
      const current = result.records[0]
      if (!current || !result.user || result.user.role === 'admin' || current.pathwaySlug !== slug)
        throw new Error('Workflow unavailable for this account and pathway.')
      accept(current, true)
      setHistory(result.records)
      setHistoryPage(1)
      setHasMoreHistory(result.hasNextPage)
      setNotice(
        'Latest persisted revision loaded. Earlier evaluations do not apply to newer drafts.',
      )
    })
  const loadMoreHistory = () =>
    run(async () => {
      const result = await loadWorkflowAction({
        workflowKey: workflowKey.current,
        page: historyPage + 1,
      })
      if (!result.ok) throw new Error(result.error)
      if (!result.user || result.user.role === 'admin')
        throw new Error('Clinical history access is unavailable.')
      setHistory((rows) =>
        [...new Map([...rows, ...result.records].map((row) => [row.revision, row])).values()].sort(
          (a, b) => b.revision - a.revision,
        ),
      )
      setHistoryPage(result.page)
      setHasMoreHistory(result.hasNextPage)
    })
  return {
    record,
    busy,
    loading,
    loadFailed,
    editable,
    error,
    fieldErrors,
    notice,
    dirty,
    inputs,
    intake,
    pedigree,
    anc,
    syntheticReference,
    history,
    hasMoreHistory,
    reviewNote,
    attest,
    ancError,
    changeInput: (key: string, value: string | boolean) => {
      edited()
      setInputs((old) => ({ ...old, [key]: value }))
    },
    changeIntake: (next: WorkflowIntake) => {
      edited()
      setIntake(next)
    },
    changePedigree: (next: typeof pedigree) => {
      edited()
      setPedigree(next)
    },
    changeAnc: (next: typeof anc) => {
      edited()
      const parsed = parseRoutineAnc(next)
      // Keep the child's incomplete edit in its own draft without feeding an
      // invalid controlled value back into its server-safe model. Block saving
      // the last valid value until the user corrects the child draft.
      if (!parsed.success) {
        setAncError(parsed.errors.join(' '))
        return
      }
      setAncError('')
      setAnc(parsed.data)
    },
    changeReference: (next: string) => {
      edited()
      setSyntheticReference(next)
    },
    setReviewNote: (next: string) => {
      setAttest(false)
      setReviewNote(next)
    },
    setAttest,
    save,
    submit,
    transition,
    reload,
    loadMoreHistory,
    clearError: () => {
      setError('')
      setFieldErrors({})
    },
  }
}
