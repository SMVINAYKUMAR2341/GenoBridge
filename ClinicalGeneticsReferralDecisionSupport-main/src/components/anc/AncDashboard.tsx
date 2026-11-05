'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Baby,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Activity,
  HeartPulse,
  Printer,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Stethoscope,
  HeartHandshake,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import type { RoutineAncData } from '@/lib/anc-model'
import { card, btnPrimary, btnGhost, inputCls } from '@/components/ui/Primitives'

interface DashboardProps {
  userRole?: string
  userName?: string
}

export function AncDashboard({ userRole = 'provider', userName = 'Doctor' }: DashboardProps) {
  const [records, setRecords] = useState<RoutineAncData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [stats, setStats] = useState({
    total: 0,
    highRisk: 0,
    active: 0,
    referred: 0,
    delivered: 0,
  })

  const isDoctor = userRole === 'provider'
  const isNurse = userRole === 'nurse'

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/anc?search=${encodeURIComponent(search)}&risk=${riskFilter}&status=${statusFilter}`)
      if (res.ok) {
        const json = await res.json()
        setRecords(json.records || [])
        setStats(json.stats || { total: 0, highRisk: 0, active: 0, referred: 0, delivered: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch ANC records', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [search, riskFilter, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#031525] via-[#08243B] to-[#041e33] border border-[#164C60] shadow-xl text-white">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D8C3]/15 border border-[#00D8C3]/30 text-[#00D8C3] text-xs font-semibold">
            <Baby className="w-3.5 h-3.5" />
            <span>OB/GYN ANTENATAL CARE (ANC) MONITORING &amp; REGISTRATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Maternal &amp; Child Health Care Registry
          </h1>
          <p className="text-xs sm:text-sm text-[#A9BDCA] max-w-2xl leading-relaxed">
            Aligned with Indian MoHFW, ACOG, and WHO protocols. Progressive multi-step obstetric monitoring, validated dating, high-risk screening, and clinical referral coordination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/anc/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] shadow-lg shadow-[#00D8C3]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isNurse ? 'New Patient Intake' : 'Register ANC Patient'}</span>
          </Link>
          <button
            onClick={fetchRecords}
            className="p-2.5 rounded-full bg-[#102B43] border border-[#164C60] text-[#A9BDCA] hover:text-white hover:border-[#00D8C3] transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Role-Aware Governance Alert */}
      <div className={`p-4 rounded-2xl border flex items-start gap-4 ${isDoctor ? 'bg-[#033424] border-[#0e5c3e]' : 'bg-[#032a38] border-[#104e63]'}`}>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isDoctor ? 'bg-[#0e4331] border-[#137a2c] text-[#34d399]' : 'bg-[#063345] border-[#16607a] text-[#38d8f0]'}`}>
          {isDoctor ? <Stethoscope className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
        </div>
        <div className="text-xs space-y-1">
          <div className={`font-semibold text-sm ${isDoctor ? 'text-[#34d399]' : 'text-[#38d8f0]'}`}>
            {isDoctor ? 'Attending Gynecologist Review Authority' : 'Clinical Nurse Intake & Antenatal Visit Logging'}
          </div>
          <div className="text-slate-200 leading-relaxed text-xs">
            {isDoctor
              ? `You are signed in with clinical evaluation authority. You can confirm obstetric dating (EDD), review pre-eclampsia risk scores, sign off on referral packages, and finalize antenatal management plans.`
              : `You are signed in with intake authority. You can register pregnant patients, document multi-generation history, record booking vitals, log follow-up visits, and save progressive drafts for doctor review.`}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#021f17] border border-[#0e4331] shadow-hx space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Active Pregnancies</span>
            <Baby className="w-4 h-4 text-[#34d399]" />
          </div>
          <div className="text-2xl font-black text-white">{stats.active}</div>
          <div className="text-[11px] text-slate-400">Under routine/high-risk care</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#021f17] border border-red-900/50 shadow-hx space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-red-400">
            <span>High Risk Cases</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{stats.highRisk}</div>
          <div className="text-[11px] text-slate-400">Requiring specialist review</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#021f17] border border-[#0e4331] shadow-hx space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Referred to Tertiary</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.referred}</div>
          <div className="text-[11px] text-slate-400">District / Medical College</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#021f17] border border-[#0e4331] shadow-hx space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Delivered &amp; Postnatal</span>
            <CheckCircle2 className="w-4 h-4 text-[#00e5ce]" />
          </div>
          <div className="text-2xl font-black text-white">{stats.delivered}</div>
          <div className="text-[11px] text-slate-400">Outcome documented</div>
        </div>
      </div>

      {/* Registry Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#021f17] border border-[#0e4331] space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Patient Name, ANC ID, MRN, or Mobile..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00e5ce]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center rounded-xl border border-[#0e4331] bg-[#032a1f] p-1 text-xs">
              <button
                onClick={() => setRiskFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${riskFilter === 'ALL' ? 'bg-[#00e5ce] text-[#00261c] font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                All Risks
              </button>
              <button
                onClick={() => setRiskFilter('HIGH')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${riskFilter === 'HIGH' ? 'bg-red-500 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                High Risk Only
              </button>
              <button
                onClick={() => setRiskFilter('LOW')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${riskFilter === 'LOW' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                Low Risk
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#0e4331] bg-[#032a1f] text-xs text-white focus:outline-none focus:border-[#00e5ce] [&>option]:bg-[#032a1f] [&>option]:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Care</option>
              <option value="HIGH_RISK">High Risk Monitored</option>
              <option value="DRAFT">Drafts In Progress</option>
              <option value="REFERRED">Referred Out</option>
              <option value="DELIVERED">Delivered</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="overflow-hidden rounded-2xl bg-[#021f17] border border-[#0e4331] shadow-hx">
        {loading ? (
          <div className="p-12 text-center text-slate-300 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00e5ce]" />
            <p className="text-xs">Loading patient registry...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-300 space-y-3">
            <Baby className="w-10 h-10 mx-auto text-[#0e4331]" />
            <div className="text-sm font-bold text-white">No Antenatal Records Found</div>
            <p className="text-xs max-w-md mx-auto text-slate-400">
              No matching pregnant patients found. Click below to start an antenatal intake.
            </p>
            <Link
              href="/anc/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00e5ce] text-[#00261c] hover:brightness-110"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#0e4331] bg-[#032a1f] text-slate-300 font-semibold">
                  <th className="py-3.5 px-4">Patient / ANC ID</th>
                  <th className="py-3.5 px-4">Age / Contact</th>
                  <th className="py-3.5 px-4">Obstetric Formula</th>
                  <th className="py-3.5 px-4">Gestational Age / EDD</th>
                  <th className="py-3.5 px-4">Booking Vitals &amp; Hb</th>
                  <th className="py-3.5 px-4">Risk Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#164C60]/50">
                {records.map((r) => {
                  const isHigh = r.riskClassification?.riskLevel === 'HIGH'
                  const gplaStr = `G${r.booking.gravida ?? 1} P${r.booking.para ?? 0} L${r.booking.living ?? 0} A${r.booking.abortions ?? 0}`
                  const gaStr = r.pregnancy.gaWeeks !== null ? `${r.pregnancy.gaWeeks}w ${r.pregnancy.gaDays ?? 0}d` : 'Dating pending'
                  const latestVisit = r.visits[r.visits.length - 1]
                  const bp = latestVisit ? `${latestVisit.systolic}/${latestVisit.diastolic}` : r.generalExam?.systolicBp ? `${r.generalExam.systolicBp}/${r.generalExam.diastolicBp}` : '—'
                  const latestHb = r.cbc[r.cbc.length - 1]?.haemoglobin ?? r.thalassaemia?.maternalHb ?? null

                  return (
                    <tr
                      key={r.booking.identifier}
                      className="hover:bg-slate-50 dark:hover:bg-[#102B43]/50 transition-colors"
                    >
                      {/* Patient & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>{r.booking.name}</span>
                          {r.status === 'DRAFT' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-semibold">
                              Draft
                            </span>
                          )}
                          {r.status === 'ARCHIVED' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/20 text-slate-400 font-semibold">
                              Archived
                            </span>
                          )}
                          {r.status === 'DELIVERED' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-400 font-semibold">
                              Delivered
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#A9BDCA] font-mono">
                          {r.booking.identifier} • {r.booking.hospitalRegNumber || 'No MRN'}
                        </div>
                      </td>

                      {/* Age & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 dark:text-slate-200">
                          {r.booking.ageAtBooking ? `${r.booking.ageAtBooking} yrs` : '—'} • {r.booking.bloodGroup}{r.booking.rhesus === 'positive' ? '+' : r.booking.rhesus === 'negative' ? '-' : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-[#A9BDCA]/70 truncate max-w-[150px]">
                          {r.booking.mobileNumber || r.booking.address || '—'}
                        </div>
                      </td>

                      {/* G/P/L/A */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-[#031525] border border-slate-200 dark:border-[#164C60]">
                          {gplaStr}
                        </span>
                        {r.histories.previousCSectionCount ? (
                          <div className="text-[10px] text-amber-500 font-semibold mt-1">
                            Prev LSCS ({r.histories.previousCSectionCount})
                          </div>
                        ) : null}
                      </td>

                      {/* GA / EDD */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#00D8C3]" />
                          <span>{gaStr}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#A9BDCA]">
                          EDD: {r.pregnancy.edd || 'Not calculated'}
                        </div>
                      </td>

                      {/* Vitals & Hb */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 dark:text-slate-200 font-medium">
                          BP: {bp} mmHg
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#A9BDCA]">
                          Hb: {latestHb ? `${latestHb} g/dL` : 'Not recorded'}
                        </div>
                      </td>

                      {/* Risk Badge */}
                      <td className="py-3.5 px-4">
                        {isHigh ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-500">
                              <AlertTriangle className="w-3 h-3" />
                              <span>HIGH RISK</span>
                            </span>
                            {r.riskClassification?.highRiskFlags?.[0] && (
                              <div className="text-[10px] text-red-400 truncate max-w-[180px]">
                                {r.riskClassification.highRiskFlags[0]}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>LOW RISK</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/anc/${encodeURIComponent(r.booking.identifier)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#102B43] dark:hover:bg-[#164C60] text-slate-800 dark:text-white transition-colors"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          <Link
                            href={`/anc/register?id=${encodeURIComponent(r.booking.identifier)}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-[#A9BDCA] dark:hover:text-[#00D8C3] hover:bg-slate-100 dark:hover:bg-[#102B43]"
                            title="Edit Record"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clinical Guidance Footnote */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#031525]/60 border border-slate-200 dark:border-[#164C60]/60 text-xs text-slate-500 dark:text-[#A9BDCA] leading-relaxed">
        <strong>Protocol Reference:</strong> Antenatal assessment follows MoHFW Guidelines for Antenatal Care and Skilled Attendance at Birth (2024 update) and ACOG Practice Bulletins on Gestational Hypertension and Preeclampsia. All high-risk classifications and drug recommendations (e.g. Low-Dose Aspirin, Anti-D Immunoglobulin, PRBC transfusion) require explicit attending clinician review and approval.
      </div>
    </div>
  )
}

