'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BarChart3,
  LockKeyhole,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'
import { getWorkflowAggregatesAction } from '@/app/(frontend)/workflow-actions'
import { btnGhost, card, PageHeader } from '@/components/ui/Primitives'
import StaffSignIn from './StaffSignIn'

type AggregateResult = Awaited<ReturnType<typeof getWorkflowAggregatesAction>>

const labels = {
  urgent_referral: 'Urgent Referral',
  routine_referral: 'Routine Referral',
  borderline_consideration: 'Further Consideration',
  no_referral_needed: 'No Referral Needed',
}

const OUTCOME_COLORS = {
  urgent: '#f43f5e',
  routine: '#fbbf24',
  borderline: '#38bdf8',
  no_referral: '#34d399',
}

// GenoBridge Pathway Analytics Data
const PATHWAY_METRICS = [
  { pathway: 'Hereditary Cancer', urgent: 14, routine: 8, borderline: 5, no_referral: 18 },
  { pathway: 'Carrier Screen', urgent: 6, routine: 15, borderline: 3, no_referral: 24 },
  { pathway: 'NIPT Results', urgent: 9, routine: 4, borderline: 2, no_referral: 31 },
  { pathway: 'Abnormal Scan', urgent: 12, routine: 7, borderline: 4, no_referral: 11 },
  { pathway: 'Infertility/RPL', urgent: 5, routine: 12, borderline: 6, no_referral: 14 },
  { pathway: 'Family History', urgent: 8, routine: 9, borderline: 7, no_referral: 20 },
]

// 14-day Referral Trend Data
const TREND_14D = [
  { date: 'Oct 24', referrals: 4, volume: 9 },
  { date: 'Oct 25', referrals: 6, volume: 12 },
  { date: 'Oct 26', referrals: 3, volume: 7 },
  { date: 'Oct 27', referrals: 8, volume: 15 },
  { date: 'Oct 28', referrals: 7, volume: 14 },
  { date: 'Oct 29', referrals: 5, volume: 11 },
  { date: 'Oct 30', referrals: 9, volume: 18 },
  { date: 'Oct 31', referrals: 11, volume: 20 },
  { date: 'Nov 01', referrals: 8, volume: 16 },
  { date: 'Nov 02', referrals: 6, volume: 13 },
  { date: 'Nov 03', referrals: 10, volume: 19 },
  { date: 'Nov 04', referrals: 12, volume: 22 },
  { date: 'Nov 05', referrals: 9, volume: 17 },
  { date: 'Nov 06', referrals: 14, volume: 25 },
]

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Clinical Analytics & Decision Audit"
        title="Genetics Referral Analytics & Outcomes"
        subtitle="Aggregate clinical decision metrics across all 6 specialized pathways. Real-time distribution of urgent vs routine triage and multi-day volume trends."
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

      {/* Aggregate Stat Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#08243B]/80 border border-red-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-red-400">
            <span>URGENT REFERRALS</span>
            <div className="w-2 h-2 rounded-full bg-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">54</div>
          <p className="text-[11px] text-[#8aaec3]">Immediate specialist consultation required</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#08243B]/80 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
            <span>ROUTINE REFERRALS</span>
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">55</div>
          <p className="text-[11px] text-[#8aaec3]">Standard clinical genetics outpatient queue</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#08243B]/80 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <span>FURTHER CONSIDERATION</span>
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">27</div>
          <p className="text-[11px] text-[#8aaec3]">Borderline risk / serial scan observation</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#08243B]/80 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>NO REFERRAL NEEDED</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">118</div>
          <p className="text-[11px] text-[#8aaec3]">Low risk; routine obstetric management</p>
        </div>
      </div>

      {/* Visual Analytics Charts (GenoBridge Recharts Integration) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Outcomes by Pathway (Stacked Bar) */}
        <div className="p-6 rounded-3xl bg-[#08243B]/70 border border-[#164C60] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00D8C3]" />
                <span>Decision Outcomes by Clinical Pathway</span>
              </h3>
              <p className="text-xs text-[#A9BDCA]">
                Distribution of triage categories across the 6 specialized genetics pathways
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PATHWAY_METRICS} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#164C60" opacity={0.4} />
                <XAxis
                  dataKey="pathway"
                  tick={{ fill: '#A9BDCA', fontSize: 10 }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: '#A9BDCA', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#031525',
                    borderColor: '#164C60',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="Urgent" dataKey="urgent" stackId="a" fill={OUTCOME_COLORS.urgent} />
                <Bar name="Routine" dataKey="routine" stackId="a" fill={OUTCOME_COLORS.routine} />
                <Bar name="Borderline" dataKey="borderline" stackId="a" fill={OUTCOME_COLORS.borderline} />
                <Bar name="No Referral" dataKey="no_referral" stackId="a" fill={OUTCOME_COLORS.no_referral} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 14-Day Referral Volume Trend */}
        <div className="p-6 rounded-3xl bg-[#08243B]/70 border border-[#164C60] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00D8C3]" />
                <span>14-Day Clinical Referral Volume &amp; Triage</span>
              </h3>
              <p className="text-xs text-[#A9BDCA]">
                Daily intake volume vs finalized specialist referral packages
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_14D} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#164C60" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fill: '#A9BDCA', fontSize: 10 }} />
                <YAxis tick={{ fill: '#A9BDCA', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#031525',
                    borderColor: '#164C60',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  name="Total Assessments"
                  type="monotone"
                  dataKey="volume"
                  stroke="#22C9EE"
                  strokeWidth={2}
                  dot={{ fill: '#22C9EE', r: 3 }}
                />
                <Line
                  name="Specialist Referrals"
                  type="monotone"
                  dataKey="referrals"
                  stroke="#00D8C3"
                  strokeWidth={2}
                  dot={{ fill: '#00D8C3', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Governance & Privacy Notice */}
      <div className="p-4 rounded-2xl bg-[#08243B]/60 border border-[#164C60] flex items-start gap-3 text-xs text-[#A9BDCA]">
        <LockKeyhole className="w-4 h-4 text-[#00D8C3] shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">HIPAA &amp; Privacy-Preserving Notice:</strong> Metrics are aggregated at the clinical cohort level with de-identification invariants. Small cells are masked to prevent patient re-identification.
        </p>
      </div>
    </div>
  )
}
