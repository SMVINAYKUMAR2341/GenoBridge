'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, History, RefreshCw, Mail, CheckCircle2, Clock, Send, Ban, FileCode2 } from 'lucide-react'
import StaffSignIn, { refreshClinicalWorkspace, useClinicalWorkspace } from './StaffSignIn'
import { btnGhost, card, Empty, PageHeader } from '@/components/ui/Primitives'
import { loadWorkflowAction } from '@/app/(frontend)/workflow-actions'
import type { WorkflowRecord } from '@/lib/workflow-store'
import EmailReferralModal from '@/components/referrals/EmailReferralModal'
import { buildFhirGenomicsBundle, downloadFhirBundleJson } from '@/lib/fhir-genomics-bundle'

type View = 'history' | 'saved' | 'referrals'
type ReferralStatus = 'all' | 'pending' | 'sent' | 'completed' | 'declined'

const copy = {
  history: {
    title: 'Workspace history',
    subtitle:
      'Latest observed synthetic workflow revisions, loaded from the server. Scan limits and concurrent writes may affect completeness.',
  },
  saved: {
    title: 'Saved drafts',
    subtitle:
      'Resume accessible server-saved synthetic drafts. This view does not create, change, or delete clinical records.',
  },
  referrals: {
    title: 'Referral decisions & tracking',
    subtitle:
      'Finalized synthetic workflows with persisted referral or consideration decisions. Track lifecycle status from pending triage to specialist handover.',
  },
}

function date(value: string) {
  const time = new Date(value)
  return Number.isNaN(time.getTime()) ? 'Date unavailable' : time.toLocaleString()
}

function WorkflowRevisions({ workflowKey }: { workflowKey: string }) {
  const [records, setRecords] = useState<WorkflowRecord[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setBusy(true)
    setError('')
    try {
      const result = await loadWorkflowAction({ workflowKey, page: page + 1 })
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (!result.user || result.user.role === 'admin') {
        setRecords([])
        setHasNext(false)
        refreshClinicalWorkspace()
        return
      }
      setRecords((previous) => [...previous, ...result.records])
      setPage(result.page)
      setHasNext(result.hasNextPage)
    } catch {
      setError('Could not load revisions. Retry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 border-t border-hx-border pt-3">
      {records.length > 0 && (
        <ol className="mb-3 space-y-2 text-sm text-hx-slate">
          {records.map((record) => (
            <li key={record.id}>
              Revision {record.revision} · {record.state.replaceAll('_', ' ')} ·{' '}
              {date(record.createdAt)}
              {record.decision ? ` · ${record.decision.replaceAll('_', ' ')}` : ''}
            </li>
          ))}
        </ol>
      )}
      {hasNext && (
        <button type="button" className={btnGhost} disabled={busy} onClick={load}>
          <History size={15} />{' '}
          {busy ? 'Loading…' : page ? 'More revisions' : 'Load revision history'}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export default function WorkspaceHistory({ view = 'history' }: { view?: View }) {
  const { workspace, loading, error, reload } = useClinicalWorkspace()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [referralFilter, setReferralFilter] = useState<ReferralStatus>('all')
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean
    referralId: string
    patientName?: string
    pathwayTitle?: string
    decisionLabel?: string
  }>({
    isOpen: false,
    referralId: '',
  })

  const rawRecords = (workspace?.workflows ?? [])
    .filter((record) =>
      view === 'saved'
        ? record.state === 'DRAFT'
        : view === 'referrals'
          ? record.state === 'FINALIZED' &&
            ['urgent_referral', 'routine_referral', 'borderline_consideration'].includes(
              record.decision ?? '',
            )
          : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Determine current lifecycle status per referral
  const getStatus = (workflowKey: string): string => {
    return statusOverrides[workflowKey] || 'pending'
  }

  const setStatus = (workflowKey: string, status: string) => {
    setStatusOverrides((prev) => ({ ...prev, [workflowKey]: status }))
  }

  const records = view === 'referrals' && referralFilter !== 'all'
    ? rawRecords.filter((r) => getStatus(r.workflowKey) === referralFilter)
    : rawRecords

  // Status counts for tabs
  const counts = {
    all: rawRecords.length,
    pending: rawRecords.filter((r) => getStatus(r.workflowKey) === 'pending').length,
    sent: rawRecords.filter((r) => getStatus(r.workflowKey) === 'sent').length,
    completed: rawRecords.filter((r) => getStatus(r.workflowKey) === 'completed').length,
    declined: rawRecords.filter((r) => getStatus(r.workflowKey) === 'declined').length,
  }

  return (
    <>
      <PageHeader
        eyebrow="Clinical workspace"
        title={copy[view].title}
        subtitle={copy[view].subtitle}
      >
        <button type="button" className={btnGhost} onClick={reload} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>
      <StaffSignIn />

      {/* Referral Lifecycle Status Filter Tabs (Histone Style) */}
      {view === 'referrals' && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-[#08243B]/80 border border-[#164C60] p-1.5">
          {(
            [
              { key: 'all', label: 'All Referrals', icon: Clock },
              { key: 'pending', label: 'Pending Review', icon: Clock },
              { key: 'sent', label: 'Sent to Specialist', icon: Send },
              { key: 'completed', label: 'Consult Completed', icon: CheckCircle2 },
              { key: 'declined', label: 'Declined / Withdrawn', icon: Ban },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            const active = referralFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setReferralFilter(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#00D8C3] text-[#031525] shadow-md shadow-[#00D8C3]/20'
                    : 'text-[#A9BDCA] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  active ? 'bg-[#031525]/20 text-[#031525]' : 'bg-[#031525] text-[#8aaec3]'
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <p role="status" className="text-sm text-hx-slate">
          Loading accessible workflows…
        </p>
      ) : error ? (
        <p role="alert" className={`${card} p-5 text-sm text-red-700`}>
          {error}
        </p>
      ) : !workspace?.user ? (
        <Empty
          title="Staff sign-in required"
          text="No clinical records are loaded for anonymous visitors."
        />
      ) : (
        <>
          <p role="note" className="mb-4 text-sm text-hx-slate">
            <strong>
              {workspace.scan.truncated
                ? 'Incomplete workspace scan. '
                : workspace.scan.queried
                  ? 'Synthetic-only workspace. '
                  : 'Records not queried. '}
            </strong>
            {workspace.scan.note}
            {workspace.scan.truncated &&
              ' View filters apply only to returned workflows, not the complete clinic history.'}
          </p>
          {!records.length ? (
            <Empty
              title="No matching workflows in this view"
              text="Only accessible server-saved synthetic workflows from the reported scan are shown. Real-patient records and seeded clinical results are not supplied by this view."
            />
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const currentStatus = getStatus(record.workflowKey)
                return (
                  <article key={record.id} className="rounded-[14px] border border-[#0e4331] bg-[#021f17] p-5 text-white shadow-hx">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-white text-base capitalize">
                            {record.pathwaySlug.replaceAll('-', ' ')}
                          </h2>
                          {view === 'referrals' && (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                                currentStatus === 'pending'
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : currentStatus === 'sent'
                                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                    : currentStatus === 'completed'
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                      : 'bg-slate-700 border-slate-600 text-slate-300'
                              }`}
                            >
                              Status: {currentStatus}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">
                          Revision {record.revision} · {date(record.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Synthetic workflow · <span className="break-all">{record.workflowKey}</span>
                        </p>
                      </div>
                      <span className="rounded-full border border-[#0e5c3e] bg-[#033424] px-3 py-1 text-xs font-bold text-[#34d399]">
                        {record.state.replaceAll('_', ' ')}
                      </span>
                    </div>

                    {record.decision && (
                      <p className="mt-3 text-sm text-slate-200">
                        Persisted decision: <span className="font-semibold text-[#00e5ce]">{record.decision.replaceAll('_', ' ')}</span>
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        className={btnGhost}
                        href={`/assessment/${encodeURIComponent(record.pathwaySlug)}?workflow=${encodeURIComponent(record.workflowKey)}`}
                      >
                        <ArrowUpRight size={16} className="text-[#00e5ce]" />{' '}
                        {record.state === 'DRAFT' ? 'Resume draft' : 'Open workflow'}
                      </Link>

                      <button
                        type="button"
                        className={btnGhost}
                        aria-expanded={expanded === record.workflowKey}
                        onClick={() =>
                          setExpanded(expanded === record.workflowKey ? null : record.workflowKey)
                        }
                      >
                        <History size={16} className="text-[#00e5ce]" /> Revisions
                      </button>

                      {view === 'referrals' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setEmailModal({
                                isOpen: true,
                                referralId: record.workflowKey,
                                pathwayTitle: record.pathwaySlug.replaceAll('-', ' '),
                                decisionLabel: record.decision?.replaceAll('_', ' ') || 'Genetic Referral',
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#033424] text-[#00e5ce] border border-[#0e5c3e] hover:bg-[#064e3b] transition-all"
                          >
                            <Mail size={14} />
                            <span>Email to Specialist</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const bundle = buildFhirGenomicsBundle(null, {
                                pathwayTitle: record.pathwaySlug.replaceAll('-', ' '),
                                decisionLabel: record.decision?.replaceAll('_', ' ') || 'Genetic Referral',
                                abhaAddress: '91-8842-9912-3011@abdm',
                                practitionerName: workspace?.user?.name || 'Consultant Gynecologist, MD',
                                hospitalName: 'GENOBRIDGE Healthcare Network (ABDM Facility)',
                                rationale: `Referral triggered in ${record.pathwaySlug.replaceAll('-', ' ')} workflow. Evaluated against FOGSI, ACOG, and ACMG criteria.`,
                              })
                              downloadFhirBundleJson(
                                bundle,
                                `referral-${record.workflowKey.slice(0, 12)}-fhir-genomics-abdm.json`
                              )
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#08243B] text-[#A9BDCA] border border-[#164C60] hover:text-[#00D8C3] hover:border-[#00D8C3] transition-all"
                            title="Export HL7 FHIR Genomics R4 Bundle with LOINC & SNOMED-CT codes (ABDM compliant)"
                          >
                            <FileCode2 size={14} />
                            <span>Export FHIR R4 (ABDM)</span>
                          </button>

                          {/* Quick Lifecycle Status Switcher */}
                          <div className="flex items-center gap-1 ml-auto text-xs text-[#8aaec3]">
                            <span>Mark:</span>
                            {(['pending', 'sent', 'completed', 'declined'] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(record.workflowKey, s)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-all ${
                                  currentStatus === s
                                    ? 'bg-[#00D8C3] text-[#031525]'
                                    : 'bg-[#08243B] text-[#A9BDCA] hover:text-white'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {expanded === record.workflowKey && (
                      <WorkflowRevisions key={record.workflowKey} workflowKey={record.workflowKey} />
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Specialist Email Dispatch Modal */}
      <EmailReferralModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
        referralId={emailModal.referralId}
        pathwayTitle={emailModal.pathwayTitle}
        decisionLabel={emailModal.decisionLabel}
        onSent={({ to }) => {
          setStatus(emailModal.referralId, 'sent')
        }}
      />

      <p className="mt-6 text-sm text-hx-muted">
        Read-only listing. No clinical data is written to browser storage. No active EHR
        integration.
      </p>
    </>
  )
}
