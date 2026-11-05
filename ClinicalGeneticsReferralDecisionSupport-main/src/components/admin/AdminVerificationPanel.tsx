'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Building,
  Award,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react'

interface Applicant {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  category: 'gynecologist' | 'nurse'
  role: string
  medicalRegistrationNumber?: string
  stateMedicalCouncil?: string
  registrationState?: string
  nursingRegistrationNumber?: string
  stateNursingCouncil?: string
  hospitalClinicName?: string
  department?: string
  designation?: string
  submittedAt: string
  verificationStatus: string
  emailVerified: boolean
  enabled: boolean
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: string
  additionalInfoRequested?: string
}

export function AdminVerificationPanel() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)

  // Action modals state
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchApplicants = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/verifications?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setApplicants(data.applicants || [])
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchApplicants()
  }, [statusFilter])

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') => {
    if (!selectedApplicant) return
    setActionLoading(true)
    setActionSuccess(null)
    setActionError(null)

    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedApplicant.id,
          action,
          reason: action === 'REJECT' ? rejectionReason : undefined,
          notes: action === 'REQUEST_INFO' ? additionalNotes : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Action failed')
      }

      setActionSuccess(data.message)
      await fetchApplicants()

      // Update selected applicant view
      setSelectedApplicant((prev) =>
        prev
          ? {
              ...prev,
              verificationStatus:
                action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : prev.verificationStatus,
              enabled: action === 'APPROVE' ? true : action === 'REJECT' ? false : prev.enabled,
              rejectionReason: action === 'REJECT' ? rejectionReason : prev.rejectionReason,
            }
          : null
      )
    } catch (err: any) {
      setActionError(err.message || 'Operation failed')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = applicants.filter((a) => {
    const term = searchQuery.toLowerCase()
    return (
      a.name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      (a.medicalRegistrationNumber && a.medicalRegistrationNumber.toLowerCase().includes(term)) ||
      (a.hospitalClinicName && a.hospitalClinicName.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      {/* Search and Filter Strip */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-4 rounded-2xl bg-[#08243B]/60 border border-[#164C60]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A9BDCA] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by clinician name, email, reg number, hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#031525] border border-[#164C60] text-xs text-white placeholder-[#5d7383] focus:outline-none focus:border-[#00D8C3]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#031525] border border-[#164C60] text-xs text-white focus:outline-none focus:border-[#00D8C3]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PROFESSIONAL_VERIFICATION_PENDING">Pending Verification</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <button
            onClick={() => fetchApplicants()}
            className="p-2 rounded-xl bg-[#031525] border border-[#164C60] text-[#00D8C3] hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left List, Right Detailed Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Applicants List */}
        <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {loading && applicants.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A9BDCA] bg-[#08243B]/40 rounded-2xl border border-[#164C60]">
              Loading professional verification queue...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A9BDCA] bg-[#08243B]/40 rounded-2xl border border-[#164C60]">
              No applicants found matching filter criteria.
            </div>
          ) : (
            filtered.map((app) => {
              const isSelected = selectedApplicant?.id === app.id
              const isPending = app.verificationStatus === 'PROFESSIONAL_VERIFICATION_PENDING'
              const isApproved = app.verificationStatus === 'APPROVED'
              const isRejected = app.verificationStatus === 'REJECTED'

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedApplicant(app)
                    setActionSuccess(null)
                    setActionError(null)
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#08243B] border-[#00D8C3] shadow-lg shadow-[#00D8C3]/10'
                      : 'bg-[#08243B]/50 border-[#164C60] hover:border-[#00D8C3]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{app.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#031525] border border-[#164C60] uppercase text-[#00D8C3]">
                          {app.category === 'gynecologist' ? 'OB-GYN' : 'Nurse'}
                        </span>
                      </div>
                      <div className="text-xs text-[#A9BDCA]">{app.email}</div>
                      <div className="text-xs text-[#5d7383]">{app.hospitalClinicName || 'Hospital not specified'}</div>
                    </div>

                    <div>
                      {isPending && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          PENDING
                        </span>
                      )}
                      {isApproved && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          APPROVED
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#164C60]/40 flex items-center justify-between text-[11px] text-[#A9BDCA]">
                    <span>Reg: {app.medicalRegistrationNumber || app.nursingRegistrationNumber || 'N/A'}</span>
                    <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Detailed Verification & Decision Card */}
        <div className="lg:col-span-7">
          {selectedApplicant ? (
            <div className="p-6 rounded-2xl bg-[#08243B] border border-[#164C60] space-y-6 shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#164C60]/60 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedApplicant.name}</h3>
                  <div className="text-xs text-[#A9BDCA] mt-0.5">
                    {selectedApplicant.designation} • {selectedApplicant.department}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono uppercase text-[#00D8C3] font-bold">
                    {selectedApplicant.verificationStatus}
                  </div>
                  <div className="text-[11px] text-[#A9BDCA]">
                    Submitted: {new Date(selectedApplicant.submittedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Success / Error Feedback */}
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
                  {actionError}
                </div>
              )}

              {/* Credentials Inspection Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]/70 space-y-1">
                  <span className="text-[#A9BDCA] block text-[10px] uppercase font-semibold">Contact Details</span>
                  <div className="text-white font-medium">{selectedApplicant.email}</div>
                  <div className="text-[#A9BDCA]">{selectedApplicant.phone || 'Phone not provided'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]/70 space-y-1">
                  <span className="text-[#A9BDCA] block text-[10px] uppercase font-semibold">Clinical Category</span>
                  <div className="text-[#00D8C3] font-bold uppercase">{selectedApplicant.category}</div>
                  <div className="text-[#A9BDCA]">System Role: {selectedApplicant.role}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]/70 space-y-1">
                  <span className="text-[#A9BDCA] block text-[10px] uppercase font-semibold">Registration Number</span>
                  <div className="text-white font-mono font-bold text-sm">
                    {selectedApplicant.medicalRegistrationNumber || selectedApplicant.nursingRegistrationNumber || 'None'}
                  </div>
                  <div className="text-[#A9BDCA]">State: {selectedApplicant.registrationState || 'N/A'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#031525] border border-[#164C60]/70 space-y-1">
                  <span className="text-[#A9BDCA] block text-[10px] uppercase font-semibold">Designated Council</span>
                  <div className="text-white font-medium">
                    {selectedApplicant.stateMedicalCouncil || selectedApplicant.stateNursingCouncil || 'N/A'}
                  </div>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#031525] border border-[#164C60]/70 space-y-1">
                  <span className="text-[#A9BDCA] block text-[10px] uppercase font-semibold">Hospital / Healthcare Facility</span>
                  <div className="text-white font-semibold">{selectedApplicant.hospitalClinicName || 'N/A'}</div>
                  <div className="text-[#A9BDCA]">Department: {selectedApplicant.department || 'N/A'}</div>
                </div>
              </div>

              {/* Manual Verification Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Documented Manual Verification Protocol:</strong> Direct API lookup with NMC / SMC registries is pending national integration. As an administrator, cross-check the registration number against the published State Medical Council / Indian Nursing Council gazette registry before issuing approval.
                </div>
              </div>

              {/* Rejection / Review History */}
              {selectedApplicant.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200 space-y-1">
                  <div className="font-bold uppercase text-[10px] text-red-400">Previous Rejection Reason</div>
                  <div>{selectedApplicant.rejectionReason}</div>
                  {selectedApplicant.reviewedBy && (
                    <div className="text-[10px] text-[#A9BDCA]">Reviewed by: {selectedApplicant.reviewedBy} on {new Date(selectedApplicant.reviewedAt || '').toLocaleDateString()}</div>
                  )}
                </div>
              )}

              {/* Review Actions Form */}
              <div className="pt-2 border-t border-[#164C60]/60 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#00D8C3]">
                  Reviewer Decision &amp; Audit Trail
                </h4>

                <div className="space-y-2">
                  <label className="block text-xs text-[#A9BDCA]">
                    Rejection Reason (Required if rejecting):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. State Medical Council registration could not be verified in official registry"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#031525] border border-[#164C60] text-xs text-white placeholder-[#5d7383] focus:outline-none focus:border-[#00D8C3]"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    disabled={actionLoading || selectedApplicant.verificationStatus === 'APPROVED'}
                    onClick={() => handleAction('APPROVE')}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold bg-emerald-500 text-[#031525] hover:bg-emerald-400 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve &amp; Activate Account</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction('REJECT')}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold bg-red-600/90 text-white hover:bg-red-500 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Credentials</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction('REQUEST_INFO')}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold bg-[#031525] text-[#A9BDCA] border border-[#164C60] hover:border-[#00D8C3] hover:text-white transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Request Details</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#08243B]/40 border border-[#164C60] text-[#A9BDCA] space-y-3">
              <UserCheck className="w-10 h-10 text-[#164C60]" />
              <div className="text-sm font-semibold text-white">Select a Clinician from the Queue</div>
              <p className="text-xs max-w-sm">
                Click on any applicant from the list to inspect their Indian medical or nursing council credentials and issue an approval or rejection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

