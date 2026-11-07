'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Search,
  Calendar,
  Clock,
  Baby,
  Dna,
  FileText,
  FileCheck2,
  ChevronRight,
  ArrowLeft,
  Building2,
  Activity,
  Layers,
  Phone,
  Mail,
  MapPin,
  Heart,
  Stethoscope,
  Printer,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  AlertTriangle,
  History,
  FileCode,
} from 'lucide-react'
import type {
  UnifiedPatientSummary,
  UnifiedPatientDossier,
  PatientTimelineEvent,
} from '@/lib/patient-history-service'
import WorkspaceHistory from '@/components/clinical/WorkspaceHistory'

export default function PatientHistoryClient({ initialPatientId }: { initialPatientId?: string }) {
  const [patients, setPatients] = useState<UnifiedPatientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [portalFilter, setPortalFilter] = useState('all')

  // Selected Patient Dossier State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId || null)
  const [dossier, setDossier] = useState<UnifiedPatientDossier | null>(null)
  const [dossierLoading, setDossierLoading] = useState(false)
  const [activeDossierTab, setActiveDossierTab] = useState<
    'timeline' | 'anc' | 'genetics' | 'assessments' | 'documents'
  >('timeline')

  // Top-level View Tab: 'registry' | 'workspace_history' | 'saved_drafts' | 'referrals'
  const [mainView, setMainView] = useState<'registry' | 'workspace_history' | 'saved_drafts' | 'referrals'>('registry')

  // Fetch unified patients
  const loadPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/history/patients?q=${encodeURIComponent(search)}`)
      if (res.ok) {
        const json = await res.json()
        setPatients(json.patients || [])
      }
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  // Fetch single patient dossier
  const loadDossier = useCallback(async (id: string) => {
    setDossierLoading(true)
    try {
      const res = await fetch(`/api/history/patients/${id}`)
      if (res.ok) {
        const json = await res.json()
        setDossier(json.dossier)
      } else {
        setDossier(null)
      }
    } catch (err) {
      console.error('Error fetching dossier:', err)
      setDossier(null)
    } finally {
      setDossierLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      loadDossier(selectedPatientId)
    } else {
      setDossier(null)
    }
  }, [selectedPatientId, loadDossier])

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (portalFilter !== 'all' && !p.sourcePortals.includes(portalFilter)) {
        return false
      }
      return true
    })
  }, [patients, portalFilter])

  // Render Sub-Views (Workspace History / Saved Drafts / Referrals)
  if (mainView === 'workspace_history') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMainView('registry')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Universal Patient Registry
        </button>
        <WorkspaceHistory view="history" />
      </div>
    )
  }

  if (mainView === 'saved_drafts') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMainView('registry')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Universal Patient Registry
        </button>
        <WorkspaceHistory view="saved" />
      </div>
    )
  }

  if (mainView === 'referrals') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMainView('registry')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Universal Patient Registry
        </button>
        <WorkspaceHistory view="referrals" />
      </div>
    )
  }

  // If a Patient Dossier is active, render the Centralized Patient Dossier
  if (selectedPatientId && dossier) {
    const p = dossier.patient
    const anc = dossier.ancRecord
    const ped = dossier.pedigree

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 bg-white text-slate-900">
        {/* Back Link */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedPatientId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Universal Patient Registry</span>
          </button>
          <div className="text-xs font-mono text-slate-500">
            Universal Dossier · ID: <span className="text-slate-900 font-bold">{p.id.slice(0, 16)}</span>
          </div>
        </div>

        {/* 1. Patient Profile Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold font-mono shrink-0 shadow-sm">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{p.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-200 text-slate-800">
                    MRN: {p.mrn}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {p.pregnancyStatus}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                  <span>Age: <strong>{p.age} years</strong></span>
                  <span>DOB: <strong>{p.dob}</strong></span>
                  {p.gpla && <span>Obstetric Score: <strong>{p.gpla}</strong></span>}
                  {p.contactPhone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" />
                      <span>{p.contactPhone}</span>
                    </span>
                  )}
                  {p.hospital && (
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" />
                      <span>{p.hospital}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Across Connected Portals */}
            <div className="flex flex-wrap items-center gap-2">
              {p.ancIdentifier && (
                <Link
                  href={`/anc/${p.ancIdentifier}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition"
                >
                  <Baby size={14} />
                  <span>Open ANC Encounter</span>
                </Link>
              )}
              <Link
                href={`/pedigree?patientId=${p.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition"
              >
                <Dna size={14} />
                <span>Pedigree Studio</span>
              </Link>
              <Link
                href="/doctor/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
              >
                <Plus size={14} />
                <span>New Assessment</span>
              </Link>
            </div>
          </div>

          {/* Connected Portals Badges */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono text-[11px] uppercase">Active Portals:</span>
            {p.sourcePortals.map((portal) => (
              <span
                key={portal}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 text-[11px] font-semibold flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                <span>{portal}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 2. Dossier Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveDossierTab('timeline')}
            className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDossierTab === 'timeline'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock size={14} />
            <span>Unified Timeline ({dossier.timeline.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDossierTab('anc')}
            className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDossierTab === 'anc'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Baby size={14} />
            <span>Antenatal &amp; Obstetric Care</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDossierTab('genetics')}
            className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDossierTab === 'genetics'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Dna size={14} />
            <span>Genetics &amp; Pedigree Chart</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDossierTab('assessments')}
            className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDossierTab === 'assessments'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck2 size={14} />
            <span>Clinical Assessments ({dossier.assessments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDossierTab('documents')}
            className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeDossierTab === 'documents'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>Generated Documents ({dossier.documents.length})</span>
          </button>
        </div>

        {/* 3. Tab Contents */}

        {/* Tab: Unified Chronological Timeline (Phase 3.4) */}
        {activeDossierTab === 'timeline' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-mono uppercase font-bold text-slate-900">
                  Cross-Portal Chronological Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Every event links directly to its originating database record and portal.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600">
                {dossier.timeline.length} Recorded Events
              </span>
            </div>

            {dossier.timeline.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No events recorded for this patient yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {dossier.timeline.map((event) => (
                  <div key={event.id} className="relative group">
                    <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white bg-slate-900 ring-2 ring-slate-100" />
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{event.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                            {event.portalSource}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{event.description}</p>
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Recorded by: <strong>{event.actorName}</strong> ({event.actorRole})
                        </span>
                        {event.recordRef && (
                          <span className="font-mono text-[10px]">Ref: {event.recordRef}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Antenatal & Obstetric Care */}
        {activeDossierTab === 'anc' && (
          <div className="space-y-5">
            {anc ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-mono uppercase font-bold text-slate-900">
                      Antenatal Care Record · Case #{anc.booking.identifier}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Obstetric scoring, clinical visits, investigations, and birth plan.
                    </p>
                  </div>
                  <Link
                    href={`/anc/${anc.booking.identifier}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50"
                  >
                    <span>Full ANC View</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Blood Group &amp; Rh</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {anc.booking.bloodGroup} {anc.booking.rhesus}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Height &amp; Weight</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {anc.booking.heightCm ?? '—'} cm · {anc.booking.weightKg ?? '—'} kg
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Risk Classification</span>
                    <strong
                      className={`text-sm mt-0.5 block ${
                        anc.riskClassification?.riskLevel === 'HIGH' ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {anc.riskClassification?.riskLevel || 'STANDARD'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Partner Name</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {anc.booking.partnerName || 'Not recorded'}
                    </strong>
                  </div>
                </div>

                {/* Visits List */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] font-mono">
                    Recorded Visits ({anc.visits?.length || 0})
                  </div>
                  {anc.visits && anc.visits.length > 0 ? (
                    <div className="space-y-2">
                      {anc.visits.map((v, i) => (
                        <div
                          key={v.id || i}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-900">Visit #{i + 1}</span>
                            <span className="text-slate-500 ml-2">Date: {v.date}</span>
                          </div>
                          <div className="text-slate-700">
                            GA: {v.gaWeeks ?? '?'}w · Weight: {v.weightKg ?? '?'}kg · BP: {v.systolic ?? '?'}/{v.diastolic ?? '?'} mmHg
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500">No visits logged yet.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                No ANC registration record linked to this patient.
              </div>
            )}
          </div>
        )}

        {/* Tab: Genetics & Pedigree Chart */}
        {activeDossierTab === 'genetics' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-mono uppercase font-bold text-slate-900">
                  Genetics &amp; Family Pedigree
                </h3>
                <p className="text-xs text-slate-500">
                  Consanguinity, family disease clusters, and multi-generational pedigree.
                </p>
              </div>
              <Link
                href={`/pedigree?patientId=${p.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                <Dna size={13} />
                <span>Open Pedigree Studio</span>
              </Link>
            </div>

            {ped ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Total Relatives</span>
                    <strong className="text-slate-900 text-base mt-0.5 block">
                      {ped.members.length} members
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Consanguinity</span>
                    <strong className="text-slate-900 text-base mt-0.5 block">
                      {ped.consanguinity ? 'Yes (Documented)' : 'No'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Affected Relatives</span>
                    <strong className="text-slate-900 text-base mt-0.5 block">
                      {ped.members.filter((m) => m.geneticStatus === 'affected').length}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-slate-500 text-[11px] block">Carrier Relatives</span>
                    <strong className="text-slate-900 text-base mt-0.5 block">
                      {ped.members.filter((m) => m.geneticStatus === 'carrier' || m.geneticStatus === 'suspected_carrier').length}
                    </strong>
                  </div>
                </div>

                {/* Family Members Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Relative Name</th>
                        <th className="p-3">Relation</th>
                        <th className="p-3">Generation</th>
                        <th className="p-3">Genetic Status</th>
                        <th className="p-3">Conditions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ped.members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">
                            {m.name} {m.isProband && '(Proband)'}
                          </td>
                          <td className="p-3 capitalize text-slate-600">{m.relation.replace(/_/g, ' ')}</td>
                          <td className="p-3 font-mono text-slate-500">Gen {m.generation}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                m.geneticStatus === 'affected'
                                  ? 'bg-slate-900 text-white'
                                  : m.geneticStatus === 'carrier'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.geneticStatus.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {m.conditions.map((c) => c.name).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                No pedigree recorded yet. Click &quot;Open Pedigree Studio&quot; to chart this family.
              </div>
            )}
          </div>
        )}

        {/* Tab: Clinical Assessments */}
        {activeDossierTab === 'assessments' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-mono uppercase font-bold text-slate-900">
                  Universal Clinical Assessments
                </h3>
                <p className="text-xs text-slate-500">
                  Assessments across all clinical pathways with physician sign-off.
                </p>
              </div>
              <Link
                href="/doctor/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                <Plus size={13} />
                <span>New Assessment</span>
              </Link>
            </div>

            {dossier.assessments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No clinical assessments recorded for this patient.
              </div>
            ) : (
              <div className="space-y-3">
                {dossier.assessments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{a.type}</span>
                        <span className="text-slate-500 ml-2 font-mono text-[11px]">
                          Workflow Key: {a.code} (Rev {a.revision})
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-white">
                        {a.decision.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {a.reviewNote && (
                      <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                        &quot;{a.reviewNote}&quot;
                      </p>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Evaluated by: {a.actorName} ({a.actorRole})</span>
                      <span>{new Date(a.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Generated Documents & PDFs */}
        {activeDossierTab === 'documents' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-mono uppercase font-bold text-slate-900">
                  Generated Clinical Documents &amp; Reports
                </h3>
                <p className="text-xs text-slate-500">
                  Signed PDFs and referral summaries compiled from saved database records.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600">
                {dossier.documents.length} Available Documents
              </span>
            </div>

            {dossier.documents.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No clinical documents generated yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dossier.documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{d.fileName}</div>
                        <div className="text-[11px] text-slate-500">
                          {d.documentType} · {Math.round(d.fileSize / 1024)} KB · Generated {new Date(d.generatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/api/anc/${p.ancIdentifier || p.id}/report/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs"
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Otherwise, render the Universal Patient Registry Search & List View (Phase 3.5)
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 bg-white text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase font-bold text-slate-500">
            <Users size={15} className="text-slate-900" />
            <span>Centralized Cross-Portal Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Universal Patient History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single unified identity collecting records across ANC, Genetics, Doctor Portal, and Hospital registries.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMainView('workspace_history')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-xs"
          >
            Workspace Revisions
          </button>
          <button
            type="button"
            onClick={() => setMainView('saved_drafts')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-xs"
          >
            Saved Drafts
          </button>
          <button
            type="button"
            onClick={() => setMainView('referrals')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-xs"
          >
            Referral Triage
          </button>
          <button
            type="button"
            onClick={loadPatients}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-xs"
            title="Refresh Registry"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Search & Filters Bar (Phase 3.5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, MRN, Patient ID, Phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900 shadow-xs cursor-pointer"
          >
            <option value="all">All Connected Portals</option>
            <option value="ANC Portal">ANC Portal</option>
            <option value="Doctor Portal">Doctor Portal</option>
            <option value="Pedigree Studio">Pedigree Studio</option>
            <option value="Hospital Portal">Hospital Portal</option>
          </select>
        </div>
      </div>

      {/* 3. Patient List Grid (Phase 3.3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Found {filteredPatients.length} Unified Patient Identity Records</span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <Users size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No matching patient records found.</p>
            <p className="text-[11px] text-slate-500">
              Patients registered in ANC, Doctor Portal, or Hospital registries will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition shadow-xs cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {p.name}
                      </h3>
                      <div className="text-[11px] text-slate-500">
                        {p.age}y · DOB: {p.dob}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {p.mrn}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span>Status: <strong>{p.pregnancyStatus}</strong></span>
                  {p.gpla && <span>Score: <strong>{p.gpla}</strong></span>}
                </div>

                {/* Portals & Connected Features Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {p.sourcePortals.map((portal) => (
                    <span
                      key={portal}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                    >
                      {portal}
                    </span>
                  ))}
                  {p.hasPedigree && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                      Pedigree
                    </span>
                  )}
                  {p.hasAnc && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      ANC Active
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Last active: {new Date(p.lastActivityAt).toLocaleDateString()}</span>
                  <span className="font-bold text-slate-900 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    <span>View Dossier</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
