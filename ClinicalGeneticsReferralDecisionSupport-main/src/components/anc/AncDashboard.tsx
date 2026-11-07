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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm text-white">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold">
            <Baby className="w-3.5 h-3.5" />
            <span>OB/GYN ANTENATAL CARE (ANC) MONITORING &amp; REGISTRATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Maternal &amp; Child Health Care Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Aligned with Indian MoHFW, ACOG, and WHO protocols. Progressive multi-step obstetric monitoring, validated dating, high-risk screening, and clinical referral coordination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/anc/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isNurse ? 'New Patient Intake' : 'Register ANC Patient'}</span>
          </Link>
          <button
            onClick={fetchRecords}
            className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Role-Aware Governance Alert */}
      <div className="p-4 rounded-2xl border flex items-start gap-4 bg-slate-50 border-slate-200 text-slate-800">
        <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 bg-white border-slate-300 text-slate-900">
          {isDoctor ? <Stethoscope className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-sm text-slate-900">
            {isDoctor ? 'Attending Gynecologist Review Authority' : 'Clinical Nurse Intake & Antenatal Visit Logging'}
          </div>
          <div className="text-slate-600 leading-relaxed text-xs">
            {isDoctor
              ? `You are signed in with clinical evaluation authority. You can confirm obstetric dating (EDD), review pre-eclampsia risk scores, sign off on referral packages, and finalize antenatal management plans.`
              : `You are signed in with intake authority. You can register pregnant patients, document multi-generation history, record booking vitals, log follow-up visits, and save progressive drafts for doctor review.`}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Active Pregnancies</span>
            <Baby className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.active}</div>
          <div className="text-[11px] text-slate-500">Under routine/high-risk care</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-red-200 shadow-xs space-y-2 text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-red-600">
            <span>High Risk Cases</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{stats.highRisk}</div>
          <div className="text-[11px] text-slate-500">Requiring specialist review</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Referred to Tertiary</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.referred}</div>
          <div className="text-[11px] text-slate-500">District / Medical College</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Delivered &amp; Postnatal</span>
            <CheckCircle2 className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.delivered}</div>
          <div className="text-[11px] text-slate-500">Outcome documented</div>
        </div>
      </div>

      {/* Registry Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Patient Name, ANC ID, MRN, or Mobile..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 p-1 text-xs">
              <button
                onClick={() => setRiskFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${riskFilter === 'ALL' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All Risks
              </button>
              <button
                onClick={() => setRiskFilter('HIGH')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${riskFilter === 'HIGH' ? 'bg-red-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                High Risk Only
              </button>
              <button
                onClick={() => setRiskFilter('LOW')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${riskFilter === 'LOW' ? 'bg-slate-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Low Risk
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
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
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-900" />
            <p className="text-xs">Loading patient registry...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-600 space-y-3">
            <Baby className="w-10 h-10 mx-auto text-slate-400" />
            <div className="text-sm font-bold text-slate-900">No Antenatal Records Found</div>
            <p className="text-xs max-w-md mx-auto text-slate-500">
              No matching pregnant patients found. Click below to start an antenatal intake.
            </p>
            <Link
              href="/anc/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  <th className="py-3.5 px-4">Patient / ANC ID</th>
                  <th className="py-3.5 px-4">Age / Contact</th>
                  <th className="py-3.5 px-4">Obstetric Formula</th>
                  <th className="py-3.5 px-4">Gestational Age / EDD</th>
                  <th className="py-3.5 px-4">Booking Vitals &amp; Hb</th>
                  <th className="py-3.5 px-4">Risk Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                        <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {gplaStr}
                        </span>
                        {r.histories.previousCSectionCount ? (
                          <div className="text-[10px] text-amber-600 font-semibold mt-1">
                            Prev LSCS ({r.histories.previousCSectionCount})
                          </div>
                        ) : null}
                      </td>

                      {/* GA / EDD */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-700" />
                          <span>{gaStr}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          EDD: {r.pregnancy.edd || 'Not calculated'}
                        </div>
                      </td>

                      {/* Vitals & Hb */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          BP: {bp} mmHg
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Hb: {latestHb ? `${latestHb} g/dL` : 'Not recorded'}
                        </div>
                      </td>

                      {/* Risk Badge */}
                      <td className="py-3.5 px-4">
                        {isHigh ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 border border-red-300 text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              <span>HIGH RISK</span>
                            </span>
                            {r.riskClassification?.highRiskFlags?.[0] && (
                              <div className="text-[10px] text-red-600 truncate max-w-[180px]">
                                {r.riskClassification.highRiskFlags[0]}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-800">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          <Link
                            href={`/anc/register?id=${encodeURIComponent(r.booking.identifier)}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <strong>Protocol Reference:</strong> Antenatal assessment follows MoHFW Guidelines for Antenatal Care and Skilled Attendance at Birth (2024 update) and ACOG Practice Bulletins on Gestational Hypertension and Preeclampsia. All high-risk classifications and drug recommendations (e.g. Low-Dose Aspirin, Anti-D Immunoglobulin, PRBC transfusion) require explicit attending clinician review and approval.
      </div>
    </div>
  )
}

