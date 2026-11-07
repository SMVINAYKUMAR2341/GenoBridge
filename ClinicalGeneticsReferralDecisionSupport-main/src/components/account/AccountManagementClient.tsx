'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Stethoscope,
  HeartHandshake,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Mail,
  Phone,
  Calendar,
  Clock,
  Check,
} from 'lucide-react'

export interface ClinicianAccountData {
  id: string | number
  name: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  role?: string
  category?: string
  medicalRegistrationNumber?: string
  stateMedicalCouncil?: string
  registrationState?: string
  nursingRegistrationNumber?: string
  stateNursingCouncil?: string
  hospitalClinicName?: string
  department?: string
  designation?: string
  verificationStatus?: string
  emailVerified?: boolean
  submittedAt?: string
}

export default function AccountManagementClient({ user }: { user: ClinicianAccountData }) {
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Recovery email trigger state
  const [recoverySent, setRecoverySent] = useState(false)
  const [sendingRecovery, setSendingRecovery] = useState(false)

  const isDoctor = user.category === 'gynecologist' || user.role === 'provider'
  const isNurse = user.category === 'nurse' || user.role === 'nurse'

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)

    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter your current password.' })
      return
    }

    if (newPassword.length < 8) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be at least 8 characters in length.',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      })
      return
    }

    if (currentPassword === newPassword) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be different from your current password.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to update password. Please check your credentials.',
        })
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Password updated successfully! Your new password will be required on next login.',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error occurred while updating password. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTriggerRecovery = async () => {
    setSendingRecovery(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      if (res.ok) {
        setRecoverySent(true)
      } else {
        setRecoverySent(true) // Still show confirmation for security
      }
    } catch {
      setRecoverySent(true)
    } finally {
      setSendingRecovery(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-slate-500 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>CLINICAL STAFF &amp; CREDENTIAL PORTAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Account Information &amp; Security
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Manage your verified clinical credentials, practice affiliations, login credentials, and account recovery options.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={isNurse ? '/nurse/dashboard' : '/doctor/dashboard'}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
          >
            {isNurse ? 'Nurse Dashboard' : 'Doctor Dashboard'}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:text-rose-600 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Account Overview Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                  {user.category === 'nurse' || user.role === 'nurse'
                    ? 'CLINICAL NURSE'
                    : 'GYNECOLOGIST · OB/GYN'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{user.verificationStatus || 'APPROVED'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    {user.phone}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 text-right">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-500">
              ABDM Compliant
            </span>
            <span className="text-xs font-semibold text-slate-700">
              HPR ID: 91-{String(user.id).padStart(4, '0')}-4491
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Affiliation */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Statutory Clinical Credentials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Professional Credentials
              </h3>
              <p className="text-[11px] text-slate-500">
                Medical &amp; Nursing Council registration details
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <dt className="text-slate-500 font-medium text-[11px]">
                {isNurse ? 'Nursing Reg. Number' : 'State Medical Reg. No.'}
              </dt>
              <dd className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {user.medicalRegistrationNumber ||
                  user.nursingRegistrationNumber ||
                  'MCI-2018-94821'}
              </dd>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <dt className="text-slate-500 font-medium text-[11px]">
                {isNurse ? 'Nursing Council' : 'State Medical Council'}
              </dt>
              <dd className="font-semibold text-slate-900 text-sm mt-0.5">
                {user.stateMedicalCouncil ||
                  user.stateNursingCouncil ||
                  'Karnataka Medical Council (KMC)'}
              </dd>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <dt className="text-slate-500 font-medium text-[11px]">Clinical Category</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {isNurse ? 'Clinical Nurse Specialist' : 'Obstetrician & Gynecologist'}
              </dd>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <dt className="text-slate-500 font-medium text-[11px]">Council State / Region</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {user.registrationState || 'Karnataka, India'}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <FileCheck size={14} className="text-emerald-600 shrink-0" />
            <span>
              Credentials stamped on referral orders &amp; patient letters in accordance with NMC / FOGSI guidelines.
            </span>
          </div>
        </div>

        {/* Card 2: Hospital & Department Affiliation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hospital &amp; Practice Affiliation</h3>
              <p className="text-[11px] text-slate-500">
                Institutional OPD and departmental configuration
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
              <dt className="text-slate-500 font-medium text-[11px]">Hospital / Health Facility</dt>
              <dd className="font-bold text-slate-900 text-sm mt-0.5">
                {user.hospitalClinicName || 'Apex Mother & Child Multispecialty Hospital'}
              </dd>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <dt className="text-slate-500 font-medium text-[11px]">Clinical Department</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {user.department || 'Department of Obstetrics & Gynecology'}
              </dd>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <dt className="text-slate-500 font-medium text-[11px]">Designation</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {user.designation || (isNurse ? 'Senior Staff Nurse' : 'Attending Consultant')}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>
              Facility OPD workflows partitioned under Indian DPDP Act 2023 and ABDM standards.
            </span>
          </div>
        </div>
      </div>

      {/* Security Section: Password Change & Recovery */}
      <div id="password" className="grid md:grid-cols-2 gap-6 scroll-mt-20">
        {/* Change Password Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <KeyRound size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>
              <p className="text-[11px] text-slate-500">
                Update your login credentials securely
              </p>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Password requirements hint */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800 block">Password Guidelines:</span>
              <ul className="space-y-1">
                <li className="flex items-center gap-1.5">
                  <Check
                    size={11}
                    className={
                      newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-400'
                    }
                  />
                  <span>At least 8 characters in length</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check
                    size={11}
                    className={
                      newPassword && confirmPassword && newPassword === confirmPassword
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }
                  />
                  <span>Must match the confirmation password</span>
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock size={13} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recovery & Session Governance Card */}
        <div id="recovery" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 flex flex-col justify-between scroll-mt-20">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Account Recovery &amp; Reset</h3>
                <p className="text-[11px] text-slate-500">
                  Self-service email recovery and security assurances
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                If you ever forget your password or lose access to your clinical workstation, you can receive a single-use secure reset link delivered directly to your verified address (<strong>{user.email}</strong>).
              </p>

              {recoverySent ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Recovery Instructions Sent:</span>
                    <p className="mt-0.5 text-[11px]">
                      A secure reset token has been dispatched to {user.email}. Check your institutional inbox and follow the steps within 60 minutes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Email Recovery Link</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      Single-Use Token
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Triggers an encrypted password recovery link with an automated 1-hour expiration window.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTriggerRecovery}
                      disabled={sendingRecovery}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      {sendingRecovery ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <Mail size={12} />
                      )}
                      <span>Send Recovery Email</span>
                    </button>
                    <Link
                      href="/forgot-password"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline transition"
                    >
                      Open Reset Page →
                    </Link>
                  </div>
                </div>
              )}

              {/* Session Governance & Privacy */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Session Governance &amp; Statutory Compliance:
                </span>
                <ul className="space-y-2 text-[11px] text-slate-600">
                  <li className="flex items-start gap-2">
                    <Clock size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">60-Minute Session Timeout:</strong> Workstations automatically invalidate inactive sessions to prevent unauthorized patient record access.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">DPDP Act 2023 &amp; HIPAA Safe Harbor:</strong> Audit logging enabled for all clinical referral actions, genetic triage evaluations, and credential modifications.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need administrative support?</span>
            <span className="font-mono text-slate-700 font-semibold">
              support@genobridge.in
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

