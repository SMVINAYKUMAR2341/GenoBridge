'use client'

import { useCallback, useEffect, useState } from 'react'
import { BarChart3, LockKeyhole, RefreshCw } from 'lucide-react'
import { getWorkflowAggregatesAction } from '@/app/(frontend)/workflow-actions'
import { btnGhost, card, PageHeader } from '@/components/ui/Primitives'
import StaffSignIn from './StaffSignIn'

type AggregateResult = Awaited<ReturnType<typeof getWorkflowAggregatesAction>>
const labels = {
  urgent_referral: 'Urgent referral',
  routine_referral: 'Routine referral',
  borderline_consideration: 'Further consideration',
  no_referral_needed: 'No referral needed',
}
export default function AnalyticsPanel() {
  const [result, setResult] = useState<AggregateResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generation, setGeneration] = useState(0)
  const reload = useCallback(() => setGeneration((value) => value + 1), [])
  useEffect(() => {
    window.addEventListener('clinical-workspace-refresh', reload)
    return () => window.removeEventListener('clinical-workspace-refresh', reload)
  }, [reload])
  useEffect(() => {
    let active = true
    setResult(null)
    setLoading(true)
    setError('')
    void getWorkflowAggregatesAction()
      .then((value) => {
        if (active) setResult(value)
      })
      .catch(() => {
        if (active) setError('Unable to load aggregates. Retry or contact your administrator.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [generation])
  const metrics = result?.ok ? result.metrics : null
  return (
    <>
      <PageHeader
        eyebrow="Privacy-aware reporting"
        title="Workflow analytics"
        subtitle="The server exposes one fixed clinic-wide outcome partition for finalized, real-patient workflows. No patient-level drill-down or custom cohorts."
      >
        <button type="button" className={btnGhost} disabled={loading} onClick={reload}>
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>
      <StaffSignIn />
      {loading && (
        <p role="status" className="text-sm text-hx-slate">
          Loading authorized aggregate counts…
        </p>
      )}
      {(error || (result && !result.ok)) && (
        <p role="alert" className={`${card} p-5 text-sm text-red-700`}>
          {error || (result && !result.ok ? result.error : '')}
        </p>
      )}
      {metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(labels).map(([key, label]) => {
              const value = metrics.counts[key as keyof typeof labels]
              return (
                <section key={key} className={`${card} p-5`}>
                  <BarChart3 size={20} className="text-hx-emerald" />
                  <h2 className="mt-4 text-sm font-semibold text-hx-slate">{label}</h2>
                  <p className="mt-2 text-2xl font-extrabold text-hx-ink">
                    {value === null ? 'Suppressed' : value}
                  </p>
                </section>
              )
            })}
          </div>
          <section className={`${card} mt-4 p-5`}>
            <h2 className="font-bold text-hx-ink">Total in the fixed cohort</h2>
            <p className="mt-2 text-xl font-bold text-hx-ink">
              {metrics.total === null ? 'Suppressed' : metrics.total}
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm text-hx-slate">
              <LockKeyhole size={17} className="shrink-0" /> Small cells and complementary cells are
              suppressed by the server. Suppressed values are unknown, not zero; hidden totals
              cannot be reconstructed here.
            </p>
          </section>
        </>
      )}
      <section className={`${card} mt-6 p-5 text-sm text-hx-slate`}>
        <h2 className="font-bold text-hx-ink">Reporting limits</h2>
        <p className="mt-2">
          Counts are decision categories, not referral completion, diagnostic yield, clinical
          benefit, or safety outcomes. Synthetic workflows are excluded. No trends, time-series,
          conversion rates, or inferred comparisons are available.
        </p>
        <p className="mt-2">
          Administrator permission is checked on the server. Aggregate access is audited. This is
          not an EHR activity report.
        </p>
      </section>
    </>
  )
}
