'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Baby,
  Calendar,
  User,
  Heart,
  Stethoscope,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Printer,
  Plus,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  Syringe,
  Eye,
  Download,
  FileCheck,
  History,
  ClipboardList,
  Sparkles,
  Save,
  X,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Dna,
} from 'lucide-react'
import type {
  RoutineAncData,
  AncVisit,
  AncUltrasound,
} from '@/lib/anc-model'

interface ReportItem {
  id: string
  patientId: string
  mrn?: string
  patientName: string
  fileName: string
  filePath: string
  fileSize: number
  generatedAt: string
  generatedBy: { name: string; role: string }
  recordVersion: number
  lastUpdatedTimestamp: string
  summary: {
    gestationalAge?: string
    riskLevel?: string
    visitCount: number
    investigationCount: number
    ultrasoundCount: number
  }
}

interface AuditItem {
  id: string
  timestamp: string
  action: string
  recordId: string
  mrn?: string
  patientName?: string
  actor: { name: string; role: string }
  details?: Record<string, unknown>
}

interface RecordViewProps {
  record: RoutineAncData
  userRole?: string
  userName?: string
}

export function AncRecordView({
  record: initialRecord,
  userRole = 'provider',
  userName = 'Doctor',
}: RecordViewProps) {
  const [record, setRecord] = useState<RoutineAncData>(initialRecord)
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'patient_info'
    | 'pregnancy'
    | 'obstetric'
    | 'medical'
    | 'risk'
    | 'exam'
    | 'visits'
    | 'investigations'
    | 'hemogram'
    | 'ultrasounds'
    | 'vaccinations'
    | 'birth_plan'
    | 'pedigree'
    | 'referrals'
    | 'reports'
  >('overview')

  // Modals & Action States
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [showAddUltrasound, setShowAddUltrasound] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<ReportItem | null>(null)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([])
  const [savingSection, setSavingSection] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [pedigreeData, setPedigreeData] = useState<any>(null)
  const [pedigreeLoading, setPedigreeLoading] = useState(false)

  const syncPedigree = async () => {
    setPedigreeLoading(true)
    try {
      const res = await fetch(`/api/anc/${encodeURIComponent(record.booking.identifier)}/pedigree`, {
        method: 'POST',
      })
      if (res.ok) {
        const json = await res.json()
        setPedigreeData(json.pedigree)
        showToast('success', 'Genetic pedigree synchronized successfully from ANC records')
      } else {
        showToast('error', 'Failed to synchronize pedigree from ANC records')
      }
    } catch {
      showToast('error', 'Error syncing pedigree')
    } finally {
      setPedigreeLoading(false)
    }
  }

  const isDoctor = userRole === 'provider' || userRole === 'doctor'
  const isHighRisk = record.riskClassification?.riskLevel === 'HIGH'
  const gpla = `G${record.booking.gravida ?? 1} P${record.booking.para ?? 0} L${record.booking.living ?? 0} A${record.booking.abortions ?? 0}`

  const refreshReportsAndLogs = async () => {
    try {
      const res = await fetch(`/api/anc/${encodeURIComponent(record.booking.identifier)}`)
      if (res.ok) {
        const json = await res.json()
        if (json.reports) setReports(json.reports)
        if (json.auditLogs) setAuditLogs(json.auditLogs)
      }
    } catch (err) {
      console.error('Error fetching reports/logs:', err)
    }
  }

  useEffect(() => {
    refreshReportsAndLogs()
  }, [record.booking.identifier])

  useEffect(() => {
    if (activeTab === 'pedigree' && !pedigreeData) {
      setPedigreeLoading(true)
      fetch(`/api/anc/${encodeURIComponent(record.booking.identifier)}/pedigree`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.pedigree) setPedigreeData(data.pedigree)
        })
        .catch(() => {})
        .finally(() => setPedigreeLoading(false))
    }
  }, [activeTab, record.booking.identifier, pedigreeData])

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const persistUpdate = async (updates: Partial<RoutineAncData>, successMsg: string) => {
    setSavingSection(true)
    try {
      const res = await fetch(`/api/anc/${encodeURIComponent(record.booking.identifier)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok && data.data) {
        setRecord(data.data)
        showToast('success', successMsg)
        refreshReportsAndLogs()
      } else {
        showToast('error', data.error || 'Failed to persist changes')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast('error', `Error updating record: ${msg}`)
    } finally {
      setSavingSection(false)
    }
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const res = await fetch(`/api/anc/${encodeURIComponent(record.booking.identifier)}/report`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.metadata) {
        showToast('success', 'Official ANC Clinical Report generated successfully.')
        setSelectedReportForPreview(data.metadata)
        refreshReportsAndLogs()
      } else {
        showToast('error', data.error || 'Failed to generate report')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast('error', `Report error: ${msg}`)
    } finally {
      setGeneratingReport(false)
    }
  }

  // Quick Visit Form State
  const [newVisit, setNewVisit] = useState({
    date: new Date().toISOString().slice(0, 10),
    clinician: userName,
    gaWeeks: record.pregnancy.gaWeeks || 20,
    weightKg: record.booking.weightKg || 55,
    systolic: 120,
    diastolic: 80,
    fundalHeightCm: record.pregnancy.gaWeeks || 20,
    fetalHeartRateBpm: 140,
    fetalPresentation: 'cephalic' as const,
    fetalMovements: 'present' as const,
    pallor: 'absent' as const,
    pedalEdema: 'none' as const,
    urine: 'nil',
    plan: '',
    nextVisit: '',
    notes: '',
  })

  const handleAddVisitSubmit = async () => {
    if (!newVisit.date || !newVisit.gaWeeks) {
      showToast('error', 'Visit date and gestational age are required.')
      return
    }
    const createdVisit: AncVisit = {
      id: crypto.randomUUID(),
      date: newVisit.date,
      clinician: newVisit.clinician || userName,
      gaWeeks: Number(newVisit.gaWeeks),
      gaDays: 0,
      weightKg: newVisit.weightKg ? Number(newVisit.weightKg) : null,
      systolic: newVisit.systolic ? Number(newVisit.systolic) : null,
      diastolic: newVisit.diastolic ? Number(newVisit.diastolic) : null,
      fundalHeightCm: newVisit.fundalHeightCm ? Number(newVisit.fundalHeightCm) : null,
      fetalHeartRateBpm: newVisit.fetalHeartRateBpm ? Number(newVisit.fetalHeartRateBpm) : null,
      fetalPresentation: newVisit.fetalPresentation,
      fetalMovements: newVisit.fetalMovements,
      pallor: newVisit.pallor,
      pedalEdema: newVisit.pedalEdema,
      urine: newVisit.urine || 'nil',
      symptoms: '',
      examination: `Weight: ${newVisit.weightKg || '—'}kg, BP: ${newVisit.systolic || '—'}/${newVisit.diastolic || '—'}`,
      assessment: `Intrauterine pregnancy at ${newVisit.gaWeeks} weeks`,
      plan: newVisit.plan || 'Routine prenatal vitamins and follow up.',
      nextVisit: newVisit.nextVisit || '',
    }

    const updatedVisits = [...(record.visits || []), createdVisit]
    await persistUpdate({ visits: updatedVisits }, 'Antenatal visit logged and persisted successfully.')
    setShowAddVisit(false)
  }

  // Quick Ultrasound Form State
  const [newScan, setNewScan] = useState({
    date: new Date().toISOString().slice(0, 10),
    gaWeeks: record.pregnancy.gaWeeks || 20,
    purpose: 'Level II Anomaly Scan',
    fetalPresentation: 'cephalic',
    placentalPosition: 'anterior' as const,
    amnioticFluid: 'Adequate',
    fetalWeightGrams: 2100,
    findings: 'Normal fetal anatomy and interval growth.',
  })

  const handleAddUltrasoundSubmit = async () => {
    if (!newScan.date) {
      showToast('error', 'Ultrasound scan date is required.')
      return
    }
    const createdScan: AncUltrasound = {
      id: crypto.randomUUID(),
      date: newScan.date,
      scanDate: newScan.date,
      gaWeeks: newScan.gaWeeks ? Number(newScan.gaWeeks) : null,
      gaDays: 0,
      purpose: newScan.purpose,
      findings: newScan.findings,
      placentation: newScan.placentalPosition,
      impression: 'Satisfactory fetal growth',
      reportReference: `USG-${Date.now().toString().slice(-4)}`,
      fetalPresentation: newScan.fetalPresentation,
      placentalPosition: newScan.placentalPosition,
      amnioticFluid: newScan.amnioticFluid,
      fetalWeightGrams: newScan.fetalWeightGrams ? Number(newScan.fetalWeightGrams) : null,
    }
    const updatedUltrasounds = [...(record.ultrasounds || []), createdScan]
    await persistUpdate({ ultrasounds: updatedUltrasounds }, 'Ultrasound report added successfully.')
    setShowAddUltrasound(false)
  }

  const safeVal = (v: unknown, fallback = 'Not recorded'): string => {
    if (v === null || v === undefined || v === '') return fallback
    return String(v)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950 border-red-500/50 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/anc"
            className="p-2 rounded-xl border border-slate-200 dark:border-[#164C60] hover:bg-slate-100 dark:hover:bg-[#102B43] text-slate-600 dark:text-[#A9BDCA] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {record.booking.name}
              </h1>
              {record.status === 'DRAFT' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  DRAFT
                </span>
              )}
              {isHighRisk && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  HIGH RISK
                </span>
              )}
              {record.status === 'ACTIVE' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE CARE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A9BDCA] font-mono mt-0.5">
              ANC ID: {record.booking.identifier} • MRN: {record.booking.hospitalRegNumber || 'Not recorded'} • Patient ID: {record.booking.patientId || record.booking.identifier}
            </p>
          </div>
        </div>

        {/* Global Record Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] hover:shadow-[0_0_15px_rgba(0,216,195,0.35)] transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{generatingReport ? 'Generating PDF...' : 'Generate ANC Report'}</span>
          </button>

          <button
            onClick={() => setShowAddVisit(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#08243B] text-slate-700 dark:text-white border border-slate-200 dark:border-[#164C60] hover:border-[#00D8C3] transition-all"
          >
            <Plus className="w-4 h-4 text-[#00D8C3]" />
            <span>Log Visit</span>
          </button>
        </div>
      </div>

      {/* 15 Clinical Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-[#164C60] overflow-x-auto">
        <nav className="flex space-x-2 text-xs font-semibold whitespace-nowrap pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'patient_info', label: 'Patient Info', icon: User },
            { id: 'pregnancy', label: 'Pregnancy Details', icon: Baby },
            { id: 'obstetric', label: 'Obstetric History', icon: History },
            { id: 'medical', label: 'Medical History', icon: Activity },
            { id: 'risk', label: 'Risk Stratification', icon: AlertTriangle },
            { id: 'exam', label: 'General Examination', icon: Stethoscope },
            { id: 'visits', label: `Visits (${record.visits?.length || 0})`, icon: Calendar },
            { id: 'investigations', label: 'Investigations', icon: Heart },
            { id: 'hemogram', label: 'Hemogram (CBC)', icon: Activity },
            { id: 'ultrasounds', label: `Ultrasounds (${record.ultrasounds?.length || 0})`, icon: Eye },
            { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
            { id: 'birth_plan', label: 'Birth Plan', icon: ShieldCheck },
            { id: 'pedigree', label: 'Pedigree & Genetics', icon: Dna },
            { id: 'referrals', label: 'Referrals', icon: ExternalLink },
            { id: 'reports', label: `Reports (${reports.length})`, icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#00D8C3] text-[#031525] font-bold shadow-sm'
                    : 'text-slate-600 dark:text-[#A9BDCA] hover:text-white hover:bg-slate-100 dark:hover:bg-[#08243B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#A9BDCA]">Gestational Age</span>
              <div className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#00D8C3]" />
                <span>{record.pregnancy.gaWeeks ? `${record.pregnancy.gaWeeks}w ${record.pregnancy.gaDays || 0}d` : 'Pending'}</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-[#A9BDCA]/70">Trimester {record.pregnancy.trimester || 1}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#A9BDCA]">Estimated Due Date</span>
              <div className="text-xl font-black text-slate-800 dark:text-white">
                {safeVal(record.pregnancy.edd)}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-[#A9BDCA]/70">LMP: {safeVal(record.pregnancy.lmp)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#A9BDCA]">Obstetric Formula</span>
              <div className="text-xl font-black text-slate-800 dark:text-white font-mono">{gpla}</div>
              <span className="text-[10px] text-slate-400 dark:text-[#A9BDCA]/70">Gravida/Para/Living/Abortions</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#A9BDCA]">Risk Level</span>
              <div className={`text-xl font-black ${isHighRisk ? 'text-red-500' : 'text-emerald-400'}`}>
                {safeVal(record.riskClassification?.riskLevel, 'LOW')}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-[#A9BDCA]/70">Pre-Eclampsia: {safeVal(record.riskClassification?.preEclampsiaRisk).toUpperCase()}</span>
            </div>
          </div>

          {record.riskClassification?.highRiskFlags && record.riskClassification.highRiskFlags.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Active Clinical Risk Triggers ({record.riskClassification.highRiskFlags.length})</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {record.riskClassification.highRiskFlags.map((flag, i) => (
                  <li key={i} className="flex items-center gap-1.5 bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-800/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
              {record.riskClassification?.aspirinRecommended && (
                <div className="mt-2 text-xs text-amber-300 font-semibold bg-amber-950/40 px-3 py-2 rounded-lg border border-amber-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Clinical Guideline: Low-dose Aspirin (75–150 mg daily) is recommended starting from 12 weeks for pre-eclampsia prevention.</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00D8C3] flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Patient Profile &amp; Contact</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#A9BDCA]">Full Name</span>
                  <p className="font-semibold text-white mt-0.5">{record.booking.name}</p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Age / DOB</span>
                  <p className="font-semibold text-white mt-0.5">{safeVal(record.booking.ageAtBooking)} yrs ({safeVal(record.booking.dateOfBirth)})</p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Blood Group &amp; Rh</span>
                  <p className="font-semibold text-white mt-0.5">{safeVal(record.booking.bloodGroup)} {safeVal(record.booking.rhesus)}</p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Mobile Phone</span>
                  <p className="font-semibold text-white mt-0.5">{safeVal(record.booking.mobileNumber)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#A9BDCA]">Residential Address</span>
                  <p className="font-semibold text-white mt-0.5">{safeVal(record.booking.address)}, {safeVal(record.booking.city)} {safeVal(record.booking.postalCode)}</p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Emergency Contact</span>
                  <p className="font-semibold text-white mt-0.5">{safeVal(record.booking.emergencyContact)}</p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Attending Clinician</span>
                  <p className="font-semibold text-white mt-0.5">{safeVal(record.booking.clinician)}</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00D8C3] flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                <span>Baseline Physical Examination</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#A9BDCA]">Height / Weight</span>
                  <p className="font-semibold text-white mt-0.5">
                    {safeVal(record.booking.heightCm)} cm / {safeVal(record.booking.weightKg)} kg
                  </p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Calculated BMI</span>
                  <p className="font-semibold text-white mt-0.5">
                    {safeVal(record.generalExam?.bmi)} ({safeVal(record.generalExam?.bmiCategory)})
                  </p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Blood Pressure</span>
                  <p className="font-semibold text-white mt-0.5">
                    {record.generalExam?.systolicBp ? `${record.generalExam.systolicBp}/${record.generalExam.diastolicBp} mmHg` : 'Not recorded'}
                  </p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Pulse / Temperature</span>
                  <p className="font-semibold text-white mt-0.5">
                    {safeVal(record.generalExam?.pulseBpm)} bpm / {safeVal(record.generalExam?.temperatureF)} °F
                  </p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Pallor / Pedal Edema</span>
                  <p className="font-semibold text-white mt-0.5">
                    {safeVal(record.generalExam?.pallor)} / {safeVal(record.generalExam?.pedalEdema)}
                  </p>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Baseline Hemoglobin (Hb)</span>
                  <p className="font-semibold text-white mt-0.5">
                    {record.investigations?.hemoglobin ? `${record.investigations.hemoglobin} g/dL` : 'Not recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: PATIENT INFO */}
      {/* ========================================================================= */}
      {activeTab === 'patient_info' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <User className="w-5 h-5 text-[#00D8C3]" />
            <span>Full Patient Registration &amp; Socio-Demographic Details</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[#A9BDCA]">Patient ID</span>
              <p className="font-mono font-bold text-white mt-1">{safeVal(record.booking.patientId, record.booking.identifier)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Hospital Reg Number (MRN)</span>
              <p className="font-mono font-bold text-white mt-1">{safeVal(record.booking.hospitalRegNumber)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Registration Date</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.bookingDate)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Full Name</span>
              <p className="font-bold text-white mt-1">{record.booking.name}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Date of Birth</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.dateOfBirth)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Age at Registration</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.ageAtBooking)} years</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Primary Mobile</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.mobileNumber)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Alternate Phone</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.alternatePhone)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Email Address</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.emailId)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Emergency Contact</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.emergencyContact)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Partner / Spouse Name</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.partnerName)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Occupation</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.booking.occupation)}</p>
            </div>
            <div className="md:col-span-3">
              <span className="text-[#A9BDCA]">Full Residential Address</span>
              <p className="font-semibold text-white mt-1">
                {safeVal(record.booking.address)}, {safeVal(record.booking.city)}, {safeVal(record.booking.state)} — {safeVal(record.booking.postalCode)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: PREGNANCY DETAILS */}
      {/* ========================================================================= */}
      {activeTab === 'pregnancy' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <Baby className="w-5 h-5 text-[#00D8C3]" />
            <span>Current Pregnancy Timeline &amp; Obstetric Index</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[#A9BDCA]">Last Menstrual Period (LMP)</span>
              <p className="font-bold text-white mt-1 text-sm">{safeVal(record.pregnancy.lmp)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Estimated Date of Delivery (EDD)</span>
              <p className="font-bold text-[#00D8C3] mt-1 text-sm">{safeVal(record.pregnancy.edd)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Calculated Gestational Age</span>
              <p className="font-bold text-white mt-1 text-sm">
                {record.pregnancy.gaWeeks ? `${record.pregnancy.gaWeeks} weeks ${record.pregnancy.gaDays || 0} days` : 'Pending'}
              </p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Menstrual Cycle Length</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.pregnancy.cycleDays, '28')} days</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Certainty of LMP</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.pregnancy.lmpCertain, 'yes')}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Pregnancy Type</span>
              <p className="font-semibold text-white mt-1">{record.pregnancy.multiplePregnancy ? 'Multiple Gestation' : 'Singleton'}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Gravida / Para</span>
              <p className="font-mono font-bold text-white mt-1">Gravida: {safeVal(record.booking.gravida)}, Para: {safeVal(record.booking.para)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Living Children / Abortions</span>
              <p className="font-mono font-bold text-white mt-1">Living: {safeVal(record.booking.living)}, Abortions: {safeVal(record.booking.abortions)}</p>
            </div>
            <div>
              <span className="text-[#A9BDCA]">Stillbirths</span>
              <p className="font-mono font-bold text-white mt-1">{safeVal(record.pregnancy.stillbirths, '0')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: OBSTETRIC HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'obstetric' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <History className="w-5 h-5 text-[#00D8C3]" />
            <span>Previous Obstetric History &amp; Delivery Outcomes</span>
          </h2>
          {record.previousOutcomes && record.previousOutcomes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#164C60] text-[#A9BDCA] bg-[#031525]/60 font-semibold">
                    <th className="py-2.5 px-3">Pregnancy #</th>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3">GA at Delivery</th>
                    <th className="py-2.5 px-3">Delivery Type</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Baby Weight</th>
                    <th className="py-2.5 px-3">Complications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#164C60]/40">
                  {record.previousOutcomes.map((po, i) => (
                    <tr key={po.id || i} className="hover:bg-[#102B43]/40">
                      <td className="py-2.5 px-3 font-bold text-white">#{po.pregnancyNumber || i + 1}</td>
                      <td className="py-2.5 px-3 text-[#A9BDCA]">{safeVal(po.year)}</td>
                      <td className="py-2.5 px-3 text-white">{po.gaWeeks ? `${po.gaWeeks}w` : 'Not recorded'}</td>
                      <td className="py-2.5 px-3 text-white">{safeVal(po.deliveryType)}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">{safeVal(po.birthOutcome)}</td>
                      <td className="py-2.5 px-3 text-white">{po.babyWeight ? `${po.babyWeight} kg` : 'Not recorded'}</td>
                      <td className="py-2.5 px-3 text-amber-300">{safeVal(po.complications, 'None')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-[#A9BDCA] space-y-2">
              <Baby className="w-8 h-8 mx-auto text-[#164C60]" />
              <p className="text-xs">Primigravida / No previous pregnancy outcomes recorded.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: MEDICAL HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'medical' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <Activity className="w-5 h-5 text-[#00D8C3]" />
            <span>Maternal Medical Conditions &amp; Surgical History</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Pre-gestational Diabetes</span>
              <p className="font-bold text-white mt-1">{record.histories.diabetes ? 'Present' : 'Absent'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Chronic Hypertension</span>
              <p className="font-bold text-white mt-1">{record.histories.hypertension ? 'Present' : 'Absent'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Thyroid Disorder</span>
              <p className="font-bold text-white mt-1">{record.histories.thyroidDisorders ? 'Present' : 'Absent'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Cardiac Disease</span>
              <p className="font-bold text-white mt-1">{record.histories.cardiacDisease ? 'Present' : 'Absent'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Renal Disease</span>
              <p className="font-bold text-white mt-1">{record.histories.renalDisease ? 'Present' : 'Absent'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Epilepsy / Seizures</span>
              <p className="font-bold text-white mt-1">{record.histories.epilepsy ? 'Present' : 'Absent'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Tuberculosis</span>
              <p className="font-bold text-white mt-1">{record.histories.tuberculosis ? 'Present' : 'Absent'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Known Drug Allergies</span>
              <p className="font-bold text-white mt-1">{safeVal(record.allergiesStatus, 'None')}</p>
            </div>
            <div className="col-span-2 md:col-span-4 p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Previous Surgeries</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.histories.previousSurgeries, 'None reported')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: RISK STRATIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'risk' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Clinical Risk Stratification &amp; Pre-Eclampsia Matrix</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-xs text-[#A9BDCA]">Calculated Overall Risk</span>
              <div className={`text-xl font-bold mt-1 ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                {safeVal(record.riskClassification?.calculatedRiskLevel, 'LOW')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-xs text-[#A9BDCA]">Pre-Eclampsia Risk</span>
              <div className="text-xl font-bold text-amber-400 mt-1 uppercase">
                {safeVal(record.riskClassification?.preEclampsiaRisk, 'LOW')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-xs text-[#A9BDCA]">Clinician Approval Status</span>
              <div className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                {record.riskClassification?.clinicianApproved ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Approved by {record.riskClassification.approvedByClinicianName}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>Pending Clinician Sign-Off</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {isDoctor && !record.riskClassification?.clinicianApproved && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-300">Clinician Review Authority</p>
                <p className="text-[11px] text-[#A9BDCA]">Confirm and approve this patient's risk evaluation.</p>
              </div>
              <button
                onClick={() =>
                  persistUpdate(
                    {
                      riskClassification: {
                        ...record.riskClassification!,
                        clinicianApproved: true,
                        approvedByClinicianName: userName,
                        approvedAt: new Date().toISOString().slice(0, 10),
                      },
                    },
                    'Risk assessment approved by attending clinician.',
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
              >
                Sign &amp; Approve Risk
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: GENERAL EXAMINATION */}
      {/* ========================================================================= */}
      {activeTab === 'exam' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <Stethoscope className="w-5 h-5 text-[#00D8C3]" />
            <span>General Examination &amp; Vitals Assessment</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Height</span>
              <p className="font-bold text-white mt-1">{safeVal(record.booking.heightCm)} cm</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Weight</span>
              <p className="font-bold text-white mt-1">{safeVal(record.booking.weightKg)} kg</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Calculated BMI</span>
              <p className="font-bold text-[#00D8C3] mt-1">{safeVal(record.generalExam?.bmi)} ({safeVal(record.generalExam?.bmiCategory)})</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Blood Pressure</span>
              <p className="font-bold text-white mt-1">{record.generalExam?.systolicBp ? `${record.generalExam.systolicBp}/${record.generalExam.diastolicBp} mmHg` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Pulse Rate</span>
              <p className="font-bold text-white mt-1">{safeVal(record.generalExam?.pulseBpm)} bpm</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Temperature</span>
              <p className="font-bold text-white mt-1">{safeVal(record.generalExam?.temperatureF)} °F</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Pallor (Anemia)</span>
              <p className="font-bold text-white mt-1 capitalize">{safeVal(record.generalExam?.pallor)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Pedal Edema</span>
              <p className="font-bold text-white mt-1 capitalize">{safeVal(record.generalExam?.pedalEdema)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: ANTENATAL CARE VISITS */}
      {/* ========================================================================= */}
      {activeTab === 'visits' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#164C60] pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00D8C3]" />
              <span>Chronological Antenatal Visit Log ({record.visits?.length || 0})</span>
            </h2>
            <button
              onClick={() => setShowAddVisit(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525]"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Visit</span>
            </button>
          </div>

          {record.visits && record.visits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#164C60] text-[#A9BDCA] bg-[#031525]/60 font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">GA (Wks)</th>
                    <th className="py-2.5 px-3">BP (mmHg)</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Fundal Ht</th>
                    <th className="py-2.5 px-3">FHR</th>
                    <th className="py-2.5 px-3">Advice / Plan</th>
                    <th className="py-2.5 px-3">Clinician</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#164C60]/40">
                  {record.visits.map((v, i) => (
                    <tr key={v.id || i} className="hover:bg-[#102B43]/40">
                      <td className="py-2.5 px-3 font-bold text-white">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{v.date}</td>
                      <td className="py-2.5 px-3 font-mono text-[#00D8C3]">{v.gaWeeks}w</td>
                      <td className="py-2.5 px-3 font-mono text-white">
                        {v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-white">{v.weightKg ? `${v.weightKg} kg` : '—'}</td>
                      <td className="py-2.5 px-3 text-white">{v.fundalHeightCm ? `${v.fundalHeightCm} cm` : '—'}</td>
                      <td className="py-2.5 px-3 text-white">{v.fetalHeartRateBpm ? `${v.fetalHeartRateBpm} bpm` : '—'}</td>
                      <td className="py-2.5 px-3 text-[#A9BDCA]">
                        {v.plan || 'Routine care'} {v.nextVisit ? `(Next: ${v.nextVisit})` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{v.clinician || 'Attending Staff'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-[#A9BDCA] space-y-3">
              <Calendar className="w-8 h-8 mx-auto text-[#164C60]" />
              <p className="text-xs">No follow-up visits logged yet. Click above to log the first antenatal visit.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: INVESTIGATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'investigations' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <Heart className="w-5 h-5 text-[#00D8C3]" />
            <span>Laboratory &amp; Serological Investigations</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Blood Group &amp; Rh</span>
              <p className="font-bold text-white mt-1">{safeVal(record.booking.bloodGroup)} {safeVal(record.booking.rhesus)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Hemoglobin (Hb)</span>
              <p className="font-bold text-[#00D8C3] mt-1">{record.investigations?.hemoglobin ? `${record.investigations.hemoglobin} g/dL` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Fasting Blood Sugar</span>
              <p className="font-bold text-white mt-1">{record.investigations?.fastingBloodSugarMgDl ? `${record.investigations.fastingBloodSugarMgDl} mg/dL` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">DIPSI 75g Sugar</span>
              <p className="font-bold text-white mt-1">{record.investigations?.dipsiBloodSugarMgDl ? `${record.investigations.dipsiBloodSugarMgDl} mg/dL` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">HIV Serology</span>
              <p className="font-bold text-white mt-1 capitalize">{safeVal(record.investigations?.hivStatus)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">HBsAg (Hepatitis B)</span>
              <p className="font-bold text-white mt-1 capitalize">{safeVal(record.investigations?.hbsAgStatus)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">VDRL / RPR (Syphilis)</span>
              <p className="font-bold text-white mt-1 capitalize">{safeVal(record.investigations?.vdrlRprStatus)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Serum TSH</span>
              <p className="font-bold text-white mt-1">{record.investigations?.tshValueMiuL ? `${record.investigations.tshValueMiuL} mIU/L` : 'Not recorded'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: HEMOGRAM (CBC) */}
      {/* ========================================================================= */}
      {activeTab === 'hemogram' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <Activity className="w-5 h-5 text-[#00D8C3]" />
            <span>Complete Blood Count (CBC) / Hemogram Profile</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Hemoglobin (Hb)</span>
              <p className="font-bold text-[#00D8C3] mt-1">{record.cbc?.[0]?.haemoglobin ? `${record.cbc[0].haemoglobin} g/dL` : safeVal(record.investigations?.hemoglobin)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">RDW (%)</span>
              <p className="font-bold text-white mt-1">{record.cbc?.[0]?.rdw ? `${record.cbc[0].rdw} %` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">MCV</span>
              <p className="font-bold text-white mt-1">{record.cbc?.[0]?.mcv ? `${record.cbc[0].mcv} fL` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">MCH</span>
              <p className="font-bold text-white mt-1">{record.cbc?.[0]?.mch ? `${record.cbc[0].mch} pg` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Platelet Count</span>
              <p className="font-bold text-white mt-1">{record.cbc?.[0]?.platelets ? `${record.cbc[0].platelets} × 10³/µL` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Total WBC Count</span>
              <p className="font-bold text-white mt-1">{record.cbc?.[0]?.wbc ? `${record.cbc[0].wbc} /µL` : 'Not recorded'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Peripheral Smear</span>
              <p className="font-bold text-white mt-1">{record.cbc?.[0]?.peripheralSmear || 'Normocytic normochromic'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">MCHC</span>
              <p className="font-bold text-white mt-1">{record.cbc?.[0]?.mchc ? `${record.cbc[0].mchc} g/dL` : 'Not recorded'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: ULTRASOUNDS */}
      {/* ========================================================================= */}
      {activeTab === 'ultrasounds' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#164C60] pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#00D8C3]" />
              <span>Obstetric Ultrasound Reports ({record.ultrasounds?.length || 0})</span>
            </h2>
            <button
              onClick={() => setShowAddUltrasound(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ultrasound Report</span>
            </button>
          </div>

          {record.ultrasounds && record.ultrasounds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.ultrasounds.map((u, i) => (
                <div key={u.id || i} className="p-4 rounded-xl bg-[#031525] border border-[#164C60] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#164C60]/60 pb-2">
                    <span className="font-bold text-white">Scan #{i + 1} ({u.date})</span>
                    <span className="font-mono text-[#00D8C3] font-bold">GA: {u.gaWeeks}w</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#A9BDCA]">Presentation:</span> <span className="text-white">{safeVal(u.fetalPresentation)}</span>
                    </div>
                    <div>
                      <span className="text-[#A9BDCA]">Placenta:</span> <span className="text-white">{safeVal(u.placentalPosition)}</span>
                    </div>
                    <div>
                      <span className="text-[#A9BDCA]">Amniotic Fluid:</span> <span className="text-white">{safeVal(u.amnioticFluid)}</span>
                    </div>
                    <div>
                      <span className="text-[#A9BDCA]">Estimated Weight:</span> <span className="text-white">{u.fetalWeightGrams ? `${u.fetalWeightGrams} g` : 'Not recorded'}</span>
                    </div>
                  </div>
                  {u.findings && (
                    <div className="pt-2 text-[11px] text-[#A9BDCA] border-t border-[#164C60]/40">
                      <span className="font-semibold text-white">Findings:</span> {u.findings}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[#A9BDCA] space-y-3">
              <Eye className="w-8 h-8 mx-auto text-[#164C60]" />
              <p className="text-xs">No ultrasound scans recorded yet. Click above to log dating or anomaly scan.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: VACCINATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'vaccinations' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <Syringe className="w-5 h-5 text-[#00D8C3]" />
            <span>Maternal Immunization &amp; Tetanus Prophylaxis</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60] space-y-1">
              <span className="text-[#A9BDCA]">Tetanus-Diphtheria Dose 1 (Td 1)</span>
              <p className="font-bold text-white text-sm mt-1">{safeVal(record.vaccinations?.td1Date)}</p>
              <p className="text-[10px] text-[#A9BDCA]/70">Given early in pregnancy</p>
            </div>
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60] space-y-1">
              <span className="text-[#A9BDCA]">Tetanus-Diphtheria Dose 2 (Td 2)</span>
              <p className="font-bold text-white text-sm mt-1">{safeVal(record.vaccinations?.td2Date)}</p>
              <p className="text-[10px] text-[#A9BDCA]/70">Minimum 4 weeks after Td 1</p>
            </div>
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60] space-y-1">
              <span className="text-[#A9BDCA]">Td Booster / Tdap</span>
              <p className="font-bold text-white text-sm mt-1">{safeVal(record.vaccinations?.tdapDate)}</p>
              <p className="text-[10px] text-[#A9BDCA]/70">27–36 weeks gestation</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: BIRTH PLAN */}
      {/* ========================================================================= */}
      {activeTab === 'birth_plan' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <ShieldCheck className="w-5 h-5 text-[#00D8C3]" />
            <span>Birth Preparedness &amp; Delivery Planning</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Preferred Delivery Facility</span>
              <p className="font-bold text-white mt-1 text-sm">{safeVal(record.birthPlan?.expectedDeliveryFacility || record.birthPlan?.identifiedHospitalName)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Identified Birth Companion</span>
              <p className="font-bold text-white mt-1 text-sm">{safeVal(record.birthPlan?.identifiedBirthCompanion)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Transport Arrangement</span>
              <p className="font-semibold text-white mt-1">{safeVal(record.birthPlan?.emergencyTransportContact)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-[#A9BDCA]">Emergency Blood Donor Identified</span>
              <p className="font-semibold text-white mt-1">{record.birthPlan?.bloodDonorIdentified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: PEDIGREE & GENETICS */}
      {/* ========================================================================= */}
      {activeTab === 'pedigree' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Dna className="w-5 h-5 text-[#00D8C3]" />
                <span>Antenatal Genetic Pedigree &amp; Family History</span>
              </h2>
              <p className="text-xs text-slate-400 dark:text-[#A9BDCA] mt-1">
                Deterministic multi-generation pedigree model synchronized with antenatal booking, consanguinity, and obstetric history.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={syncPedigree}
                disabled={pedigreeLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#031525] text-[#00D8C3] border border-[#00D8C3]/40 hover:bg-[#00D8C3]/10 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${pedigreeLoading ? 'animate-spin' : ''}`} />
                <span>{pedigreeLoading ? 'Syncing...' : 'Sync from ANC'}</span>
              </button>
              <Link
                href={`/pedigree-studio?patientId=${encodeURIComponent(record.booking.identifier)}&mrn=${encodeURIComponent(record.booking.hospitalRegNumber || '')}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] transition-all shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Pedigree Studio</span>
              </Link>
            </div>
          </div>

          {/* Genetic Risk Signals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-xs text-[#A9BDCA] block font-medium">Consanguinity Status</span>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    Boolean((record as any).booking?.consanguinity || (record as any).medicalHistory?.consanguineousMarriage || (record as any).familyHistory?.consanguinity)
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {Boolean((record as any).booking?.consanguinity || (record as any).medicalHistory?.consanguineousMarriage || (record as any).familyHistory?.consanguinity)
                    ? 'Consanguineous Partnership'
                    : 'Non-Consanguineous'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Double marriage line rendered in Pedigree Studio for consanguineous unions per NSGC standards.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-xs text-[#A9BDCA] block font-medium">Carrier Screening &amp; Hemoglobin</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-white font-semibold text-sm">
                  {(record.investigations as any)?.thalassemiaScreening || 'Screened at Booking'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                MCV: {(record.cbc as any)?.[0]?.mcv || (record.investigations as any)?.mcv ? `${(record.cbc as any)?.[0]?.mcv || (record.investigations as any)?.mcv} fL` : 'Routine'} · Hb: {record.investigations?.hemoglobin ? `${record.investigations.hemoglobin} g/dL` : 'Recorded'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#031525] border border-[#164C60]">
              <span className="text-xs text-[#A9BDCA] block font-medium">Obstetric Pedigree Progeny</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-white font-semibold text-sm">
                  {record.booking?.living ?? 0} Living · {record.booking?.abortions ?? 0} Pregnancy Losses
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Offspring and prior gestational events mapped into Generation III with sex and status.
              </p>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-xl bg-[#031525] border border-[#164C60] overflow-hidden">
            <div className="px-4 py-3 bg-[#08243B] border-b border-[#164C60] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Synchronized Pedigree Members ({pedigreeData?.members?.length || '4 Auto-generated'})
              </span>
              <span className="text-[11px] text-[#00D8C3]">ACMG / NSGC Standard Notation</span>
            </div>
            <div className="divide-y divide-[#164C60]/50 text-xs">
              {(pedigreeData?.members || [
                {
                  id: 'proband',
                  label: record.booking?.name || 'Patient (Proband)',
                  generation: 2,
                  sex: 'female',
                  status: 'affected',
                  isProband: true,
                  relationship: 'proband',
                  condition: 'Consultation Subject',
                },
                {
                  id: 'partner',
                  label: record.booking?.partnerName || 'Spouse / Partner',
                  generation: 2,
                  sex: 'male',
                  status: 'unknown',
                  relationship: 'partner',
                  condition: 'Partner',
                },
                {
                  id: 'current_pregnancy',
                  label: 'Current Gestation (Pregnancy)',
                  generation: 3,
                  sex: 'unknown',
                  status: 'unknown',
                  relationship: 'child',
                  condition: `Gestational Age: ${record.pregnancy?.gaWeeks || 12} Weeks`,
                },
              ]).map((m: any, idx: number) => (
                <div key={m.id || idx} className="p-3.5 flex items-center justify-between hover:bg-[#08243B]/60 transition">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        m.sex === 'female'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                          : m.sex === 'male'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {m.sex === 'female' ? 'O' : m.sex === 'male' ? '[]' : '<>'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{m.label || m.name}</span>
                        {m.isProband && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00D8C3]/20 text-[#00D8C3] font-bold border border-[#00D8C3]/40">
                            Proband [P]
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Generation {m.generation === 1 ? 'I' : m.generation === 2 ? 'II' : 'III'} · {m.relationship || 'Relative'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        m.status === 'affected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : m.status === 'carrier'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {m.status ? m.status.toUpperCase() : 'UNAFFECTED'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{m.condition || m.notes || 'Routine'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: REFERRALS */}
      {/* ========================================================================= */}
      {activeTab === 'referrals' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-4">
            <ExternalLink className="w-5 h-5 text-[#00D8C3]" />
            <span>Tertiary Genetic &amp; Obstetric Referral Tracking</span>
          </h2>
          {record.referralOutcome?.isReferred ? (
            <div className="p-4 rounded-xl bg-[#031525] border border-amber-500/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">Active Referral Dispatched</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {safeVal(record.referralOutcome.referralStatus, 'PENDING_CONSULT')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#A9BDCA]">Target Facility:</span> <span className="font-bold text-white">{safeVal(record.referralOutcome.referredFacilityName)}</span>
                </div>
                <div>
                  <span className="text-[#A9BDCA]">Referral Date:</span> <span className="text-white">{safeVal(record.referralOutcome.referralDate)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#A9BDCA]">Clinical Indication:</span> <span className="text-white">{safeVal(record.referralOutcome.referralReason)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#A9BDCA] space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-xs">No active tertiary referral required. Patient is managed under routine primary/secondary care.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: REPORTS & AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#164C60] pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#00D8C3]" />
                  <span>Generated Clinical Reports ({reports.length})</span>
                </h2>
                <p className="text-xs text-[#A9BDCA] mt-0.5">
                  Official immutable A4 PDF snapshots compiled from stored patient JSON data.
                </p>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] transition-all disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{generatingReport ? 'Generating...' : 'Generate New Report'}</span>
              </button>
            </div>

            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#164C60] text-[#A9BDCA] bg-[#031525]/60 font-semibold">
                      <th className="py-2.5 px-3">Report File</th>
                      <th className="py-2.5 px-3">Generated Date</th>
                      <th className="py-2.5 px-3">Clinician</th>
                      <th className="py-2.5 px-3">Visits / Tests</th>
                      <th className="py-2.5 px-3">File Size</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#164C60]/40">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-[#102B43]/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#00D8C3]" />
                          <span>{rep.fileName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[#A9BDCA]">
                          {new Date(rep.generatedAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-white">
                          {rep.generatedBy?.name} ({rep.generatedBy?.role})
                        </td>
                        <td className="py-2.5 px-3 text-[#A9BDCA]">
                          {rep.summary?.visitCount} visits • {rep.summary?.ultrasoundCount} scans
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#A9BDCA]">
                          {(rep.fileSize / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedReportForPreview(rep)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#102B43] text-[#00D8C3] border border-[#164C60] hover:bg-[#164C60]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <a
                            href={`/api/anc/${encodeURIComponent(record.booking.identifier)}/report/${rep.id}?download=true`}
                            download={rep.fileName}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[#A9BDCA] space-y-2">
                <FileText className="w-8 h-8 mx-auto text-[#164C60]" />
                <p className="text-xs">No reports generated yet. Click "Generate New Report" to create the first official A4 PDF.</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#08243B] border border-slate-200 dark:border-[#164C60] space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-200 dark:border-[#164C60] pb-3">
              <History className="w-4 h-4 text-[#00D8C3]" />
              <span>Immutable Audit Trail ({auditLogs.length} events)</span>
            </h2>
            {auditLogs.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-[#031525] border border-[#164C60]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#00D8C3]"></span>
                      <span className="font-bold text-white">{log.action}</span>
                      <span className="text-[#A9BDCA] text-[11px]">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-[#A9BDCA]">
                      by <span className="font-semibold text-white">{log.actor?.name}</span> ({log.actor?.role})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A9BDCA]">Audit logging initialized.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG NEW ANTENATAL VISIT */}
      {/* ========================================================================= */}
      {showAddVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#08243B] border border-[#164C60] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#164C60] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00D8C3]" />
                <span>Log Antenatal Care Visit #{ (record.visits?.length || 0) + 1 }</span>
              </h3>
              <button onClick={() => setShowAddVisit(false)} className="text-[#A9BDCA] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[#A9BDCA] block mb-1">Visit Date *</label>
                <input
                  type="date"
                  value={newVisit.date || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Gestational Age (Weeks) *</label>
                <input
                  type="number"
                  value={newVisit.gaWeeks || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, gaWeeks: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Maternal Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newVisit.weightKg || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, weightKg: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Blood Pressure (Systolic / Diastolic)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Sys"
                    value={newVisit.systolic || ''}
                    onChange={(e) => setNewVisit({ ...newVisit, systolic: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    placeholder="Dia"
                    value={newVisit.diastolic || ''}
                    onChange={(e) => setNewVisit({ ...newVisit, diastolic: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Fundal Height (cm)</label>
                <input
                  type="number"
                  value={newVisit.fundalHeightCm || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, fundalHeightCm: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Fetal Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={newVisit.fetalHeartRateBpm || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, fetalHeartRateBpm: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Fetal Presentation</label>
                <select
                  value={newVisit.fetalPresentation}
                  onChange={(e) => setNewVisit({ ...newVisit, fetalPresentation: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                >
                  <option value="cephalic">Cephalic (Vertex)</option>
                  <option value="breech">Breech</option>
                  <option value="transverse">Transverse</option>
                  <option value="unstable">Unstable / Variable</option>
                </select>
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={newVisit.nextVisit || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, nextVisit: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[#A9BDCA] block mb-1">Clinical Advice &amp; Medications</label>
                <textarea
                  rows={2}
                  value={newVisit.plan || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, plan: e.target.value })}
                  placeholder="Iron/Folic Acid prescribed, calcium advice, warning signs discussed..."
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#164C60]">
              <button
                onClick={() => setShowAddVisit(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A9BDCA] hover:bg-[#102B43]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVisitSubmit}
                disabled={savingSection}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE]"
              >
                {savingSection ? 'Saving...' : 'Save Antenatal Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD ULTRASOUND SCAN */}
      {/* ========================================================================= */}
      {showAddUltrasound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#08243B] border border-[#164C60] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#164C60] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00D8C3]" />
                <span>Add Obstetric Ultrasound Report</span>
              </h3>
              <button onClick={() => setShowAddUltrasound(false)} className="text-[#A9BDCA] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[#A9BDCA] block mb-1">Scan Date *</label>
                <input
                  type="date"
                  value={newScan.date || ''}
                  onChange={(e) => setNewScan({ ...newScan, date: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">GA at Scan (Weeks)</label>
                <input
                  type="number"
                  value={newScan.gaWeeks || ''}
                  onChange={(e) => setNewScan({ ...newScan, gaWeeks: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Fetal Presentation</label>
                <input
                  type="text"
                  value={newScan.fetalPresentation || ''}
                  onChange={(e) => setNewScan({ ...newScan, fetalPresentation: e.target.value })}
                  placeholder="Cephalic"
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Placental Position</label>
                <select
                  value={newScan.placentalPosition}
                  onChange={(e) => setNewScan({ ...newScan, placentalPosition: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                >
                  <option value="anterior">Anterior</option>
                  <option value="posterior">Posterior</option>
                  <option value="fundal">Fundal</option>
                  <option value="low_lying">Low Lying</option>
                  <option value="previa">Placenta Previa</option>
                </select>
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Amniotic Fluid / Liquor</label>
                <input
                  type="text"
                  value={newScan.amnioticFluid || ''}
                  onChange={(e) => setNewScan({ ...newScan, amnioticFluid: e.target.value })}
                  placeholder="Adequate (AFI 14 cm)"
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div>
                <label className="text-[#A9BDCA] block mb-1">Estimated Fetal Wt (g)</label>
                <input
                  type="number"
                  value={newScan.fetalWeightGrams || ''}
                  onChange={(e) => setNewScan({ ...newScan, fetalWeightGrams: Number(e.target.value) })}
                  placeholder="e.g. 2100"
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[#A9BDCA] block mb-1">Diagnostic Findings &amp; Summary</label>
                <textarea
                  rows={2}
                  value={newScan.findings || ''}
                  onChange={(e) => setNewScan({ ...newScan, findings: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#031525] border border-[#164C60] text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#164C60]">
              <button
                onClick={() => setShowAddUltrasound(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A9BDCA] hover:bg-[#102B43]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUltrasoundSubmit}
                disabled={savingSection}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE]"
              >
                {savingSection ? 'Saving...' : 'Save Ultrasound Scan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIVE A4 PDF REPORT PREVIEW */}
      {/* ========================================================================= */}
      {selectedReportForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl h-[90vh] rounded-2xl bg-[#08243B] border border-[#164C60] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#164C60] bg-[#031525]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#00D8C3]" />
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedReportForPreview.fileName}</h3>
                  <p className="text-[10px] text-[#A9BDCA]">
                    Generated {new Date(selectedReportForPreview.generatedAt).toLocaleString()} by {selectedReportForPreview.generatedBy?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/api/anc/${encodeURIComponent(record.booking.identifier)}/report/${selectedReportForPreview.id}?download=true`}
                  download={selectedReportForPreview.fileName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00D8C3] text-[#031525]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={() => setSelectedReportForPreview(null)}
                  className="p-1 rounded-lg text-[#A9BDCA] hover:text-white hover:bg-[#102B43]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-slate-900">
              <iframe
                src={`/api/anc/${encodeURIComponent(record.booking.identifier)}/report/${selectedReportForPreview.id}`}
                className="w-full h-full border-none"
                title="ANC Clinical Report PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
