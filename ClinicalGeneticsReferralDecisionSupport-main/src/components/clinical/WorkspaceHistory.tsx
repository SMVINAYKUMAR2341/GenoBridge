'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, History, RefreshCw } from 'lucide-react'
import StaffSignIn, { refreshClinicalWorkspace, useClinicalWorkspace } from './StaffSignIn'
import { btnGhost, card, Empty, PageHeader } from '@/components/ui/Primitives'
import { loadWorkflowAction } from '@/app/(frontend)/workflow-actions'
import type { WorkflowRecord } from '@/lib/workflow-store'

type View = 'history' | 'saved' | 'referrals'
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
    title: 'Referral decisions',
    subtitle:
      'Finalized synthetic workflows with persisted referral or consideration decisions. These are not real-patient referrals, transmitted orders, or EHR delivery confirmations.',
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
  const records = (workspace?.workflows ?? [])
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
              {records.map((record) => (
                <article key={record.id} className="rounded-[14px] border border-[#0e4331] bg-[#021f17] p-5 text-white shadow-hx">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-bold text-white text-base capitalize">
                        {record.pathwaySlug.replaceAll('-', ' ')}
                      </h2>
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
                  <div className="mt-4 flex flex-wrap gap-3">
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
                  </div>
                  {expanded === record.workflowKey && (
                    <WorkflowRevisions key={record.workflowKey} workflowKey={record.workflowKey} />
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <p className="mt-6 text-sm text-hx-muted">
        Read-only listing. No clinical data is written to browser storage. No active EHR
        integration.
      </p>
    </>
  )
}
