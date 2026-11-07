'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  Users,
  Baby,
  FileCheck2,
  Filter,
  Dna,
  ShieldCheck,
  Building2,
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

interface AnalyticsData {
  filters: { range: string; portal: string }
  kpis: {
    totalUniquePatients: number
    activePatients: number
    patientsWithAnc: number
    patientsWithPedigree: number
    patientsWithAssessments: number
    patientsWithReports: number
    totalWorkflows: number
    finalizedAssessments: number
    draftAssessments: number
    totalPedigrees: number
    ancVisitsTotal: number
    ancUltrasoundsTotal: number
    ancLabsTotal: number
    ancVaccinationsTotal: number
    ancHighRiskTotal: number
    totalDocumentsGenerated: number
  }
  ageDistribution: Array<{ group: string; count: number }>
  portalActivity: Array<{ portal: string; records: number }>
  trend: Array<{ date: string; registrations: number; clinicalVisits: number }>
  timestamp: string
}

export default function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState('all')
  const [portal, setPortal] = useState('all')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics/overview?range=${range}&portal=${portal}`)
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login?redirect=/analytics'
          return
        }
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error('Analytics load error:', err)
      setError(err?.message || 'Unable to load database analytics. Please retry.')
    } finally {
      setLoading(false)
    }
  }, [range, portal])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const kpis = data?.kpis

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 bg-white text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase font-bold text-slate-500">
            <BarChart3 size={15} className="text-slate-900" />
            <span>Database-Driven Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Genetics Referral &amp; Cross-Portal Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics queried directly from Neon PostgreSQL and clinical repository tables.
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-xs">
            <Calendar size={13} className="text-slate-500" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this_month">This Month</option>
              <option value="prev_month">Previous Month</option>
            </select>
          </div>

          {/* Portal Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-xs">
            <Filter size={13} className="text-slate-500" />
            <select
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Portals</option>
              <option value="ANC Portal">ANC Portal</option>
              <option value="Doctor Portal">Doctor Portal</option>
              <option value="Pedigree Studio">Pedigree Studio</option>
              <option value="Hospital Portal">Hospital Portal</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh database metrics"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* 2. Top-Level KPI Cards (Phase 5.1 & 5.2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 text-xs">
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase">
            <span>Unique Patients</span>
            <Users size={14} className="text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {kpis ? kpis.totalUniquePatients : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Deduplicated across portals</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase">
            <span>Active In-Care</span>
            <Activity size={14} className="text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {kpis ? kpis.activePatients : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active maternal &amp; clinical cases</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase">
            <span>Pedigrees Mapped</span>
            <Dna size={14} className="text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {kpis ? kpis.totalPedigrees : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Genetic trees in PostgreSQL</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase">
            <span>Clinical Workflows</span>
            <FileCheck2 size={14} className="text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {kpis ? kpis.totalWorkflows : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {kpis?.finalizedAssessments ?? 0} finalized · {kpis?.draftAssessments ?? 0} in review
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase">
            <span>ANC Encounters</span>
            <Baby size={14} className="text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {kpis ? kpis.ancVisitsTotal : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {kpis?.ancUltrasoundsTotal ?? 0} scans · {kpis?.ancLabsTotal ?? 0} labs
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase">
            <span>Documents Issued</span>
            <ShieldCheck size={14} className="text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {kpis ? kpis.totalDocumentsGenerated : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Attested clinical PDFs</div>
        </div>
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Cross-Portal Records Distribution (Phase 5.2) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Activity Distribution by Connected Portal
              </h3>
              <p className="text-[11px] text-slate-500">Live record volume by originating source</p>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              Live DB
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {data?.portalActivity && data.portalActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.portalActivity} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="portal" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="records" fill="#0f172a" radius={[4, 4, 0, 0]} name="Clinical Records" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No cross-portal records recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Patient Age Distribution (Phase 5.5) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Patient Age Demographics
              </h3>
              <p className="text-[11px] text-slate-500">Recorded age brackets across registry</p>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              Demographics
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {data?.ageDistribution && data.ageDistribution.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="group" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" fill="#475569" radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No patient age records recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Cross-Portal Registration Trend (Phase 5.4) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Cross-Portal Patient Registration &amp; Encounter Timeline
            </h3>
            <p className="text-[11px] text-slate-500">Historical intake timeline from actual database timestamps</p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          {data?.trend && data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  name="New Patient Registrations"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Timeline data will populate as patients and encounters are logged across portals
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
