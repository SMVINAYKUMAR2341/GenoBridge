'use client'

import React, { useState } from 'react'
import {
  Mail,
  Send,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react'

export interface EmailReferralModalProps {
  isOpen: boolean
  onClose: () => void
  referralId: string
  patientName?: string
  pathwayTitle?: string
  decisionLabel?: string
  onSent?: (details: { to: string; status: string }) => void
}

const PRESET_CLINICS = [
  { name: 'AIIMS Dept of Medical Genetics', email: 'genetics.triage@aiims.edu' },
  { name: 'Tata Memorial Hereditary Cancer Center', email: 'cancertriage@tmc.gov.in' },
  { name: 'Sanjay Gandhi PGIMS Medical Genetics', email: 'clinicalgenetics@sgpgi.ac.in' },
  { name: 'Manipal Fetal Medicine & Genetics Unit', email: 'fetalgenetics@manipalhospitals.com' },
]

export default function EmailReferralModal({
  isOpen,
  onClose,
  referralId,
  patientName = 'Patient Record',
  pathwayTitle = 'Clinical Genetics Pathway',
  decisionLabel = 'Urgent Genetic Referral',
  onSent,
}: EmailReferralModalProps) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(
    `[GENOBRIDGE Referral] ${decisionLabel} — ${patientName} (${pathwayTitle})`
  )
  const [note, setNote] = useState(
    `Dear Clinical Genetics Team,\n\nPlease find attached the clinical genetic referral package and decision support summary for ${patientName}.\n\nCriteria evaluation and pedigree risk stratification indicate ${decisionLabel}.\n\nThank you,\nAttending Obstetric & Gynecology Service`
  )
  const [isSending, setIsSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!to || !to.includes('@')) {
      setError('A valid recipient email address is required.')
      return
    }

    setIsSending(true)
    setError('')

    try {
      const res = await fetch('/api/referrals/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId,
          to,
          cc: cc || null,
          subject,
          note,
          patientName,
          pathwayTitle,
          decisionLabel,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to dispatch email.')
      }

      setSuccess(true)
      onSent?.({ to, status: 'sent' })
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1800)
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch referral email.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-[#031525] border border-[#164C60] shadow-2xl p-6 sm:p-7 space-y-5 text-white">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D8C3]/15 border border-[#00D8C3]/30 flex items-center justify-center text-[#00D8C3]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Email Specialist Referral</h2>
              <p className="text-xs text-[#A9BDCA]">
                Direct electronic dispatch of referral summary &amp; clinical brief
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#8aaec3] hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#00D8C3] mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">Referral Dispatched Successfully</h3>
            <p className="text-xs text-[#A9BDCA]">
              Referral package transmitted to <strong className="text-white">{to}</strong>. Status updated to <span className="text-[#00D8C3] font-semibold">Sent</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Clinic Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8aaec3] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00D8C3]" />
                <span>Quick Select Partner Genetics Center</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_CLINICS.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => setTo(c.email)}
                    className="p-2 rounded-xl text-left border border-[#164C60]/60 bg-[#08243B]/60 hover:border-[#00D8C3] hover:bg-[#08243B] transition-all text-[11px]"
                  >
                    <div className="font-semibold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-[#00D8C3] font-mono truncate">{c.email}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A9BDCA]">
                To: Genetic Counselor / Genetics Clinic Email *
              </label>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g. genetics.consultant@hospital.org"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#08243B] border border-[#164C60] text-xs text-white placeholder:text-[#5a7f96] focus:outline-none focus:border-[#00D8C3]"
              />
            </div>

            {/* CC Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A9BDCA]">
                CC: Hospital Department / Medical Records (Optional)
              </label>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="e.g. obgyn.referrals@hospital.org"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#08243B] border border-[#164C60] text-xs text-white placeholder:text-[#5a7f96] focus:outline-none focus:border-[#00D8C3]"
              />
            </div>

            {/* Subject Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A9BDCA]">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#08243B] border border-[#164C60] text-xs text-white focus:outline-none focus:border-[#00D8C3]"
              />
            </div>

            {/* Notes Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A9BDCA]">
                Clinical Handover Note
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#08243B] border border-[#164C60] text-xs text-white focus:outline-none focus:border-[#00D8C3] leading-relaxed resize-none"
              />
            </div>

            {/* Attachment Badge */}
            <div className="p-3 rounded-xl bg-[#08243B]/80 border border-[#164C60] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#00D8C3]">
                <FileText className="w-4 h-4" />
                <span className="font-semibold text-white">GENOBRIDGE_Referral_Package.pdf</span>
              </div>
              <span className="text-[10px] font-mono text-[#8aaec3]">Automated Attachment</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A9BDCA] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Referral via Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

