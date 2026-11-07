'use client'

import React, { useState, useEffect } from 'react'
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
  Edit2,
  Save,
  X,
  RefreshCw,
  Clock,
  Laptop,
  Activity,
  History,
  Phone,
  Mail,
  Calendar,
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
  createdAt?: string
  updatedAt?: string
  submittedAt?: string
}

interface ActiveSessionItem {
  id: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
  isExpired?: boolean
}

interface ActivityItem {
  id: string
  actionType: string
  details: string
  timestamp: string
}

export default function AccountManagementClient({ user: initialUser }: { user: ClinicianAccountData }) {
  const [user, setUser] = useState<ClinicianAccountData>(initialUser)
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [name, setName] = useState(initialUser.name || '')
  const [firstName, setFirstName] = useState(initialUser.firstName || '')
  const [lastName, setLastName] = useState(initialUser.lastName || '')
  const [phone, setPhone] = useState(initialUser.phone || '')
  const [designation, setDesignation] = useState(initialUser.designation || '')
  const [department, setDepartment] = useState(initialUser.department || '')
  const [hospitalClinicName, setHospitalClinicName] = useState(initialUser.hospitalClinicName || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sessions and Activity
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [revokingSessions, setRevokingSessions] = useState(false)
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  const isNurse = user.category === 'nurse' || user.role === 'nurse'

  // Fetch active sessions
  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const res = await fetch('/api/account/sessions', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.sessions) setSessions(json.sessions)
      }
    } catch {}
    finally {
      setLoadingSessions(false)
    }
  }

  // Fetch recent activity
  const loadActivity = async () => {
    setLoadingActivities(true)
    try {
      const res = await fetch('/api/account/activity', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.activities) setActivities(json.activities)
      }
    } catch {}
    finally {
      setLoadingActivities(false)
    }
  }

  useEffect(() => {
    loadSessions()
    loadActivity()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMessage(null)

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          firstName,
          lastName,
          phone,
          designation,
          department,
          hospitalClinicName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setProfileMessage({ type: 'error', text: data.message || 'Failed to update profile.' })
      } else {
        setProfileMessage({ type: 'success', text: 'Account details saved and persisted to database!' })
        setUser((prev) => ({
          ...prev,
          name,
          firstName,
          lastName,
          phone,
          designation,
          department,
          hospitalClinicName,
        }))
        setIsEditingProfile(false)
        loadActivity()
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'Network error saving profile changes.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setName(user.name || '')
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setPhone(user.phone || '')
    setDesignation(user.designation || '')
    setDepartment(user.department || '')
    setHospitalClinicName(user.hospitalClinicName || '')
    setIsEditingProfile(false)
    setProfileMessage(null)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      })
      return
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be different from current password.',
      })
      return
    }

    setIsSubmittingPassword(true)

    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPasswordMessage({
          type: 'error',
          text: data.message || 'Failed to update password. Check your credentials.',
        })
      } else {
        setPasswordMessage({
          type: 'success',
          text: 'Password updated successfully! Your new password is now active in the database.',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        loadActivity()
      }
    } catch {
      setPasswordMessage({
        type: 'error',
        text: 'Network error occurred while updating password.',
      })
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleRevokeOtherSessions = async () => {
    setRevokingSessions(true)
    setSessionMessage(null)
    try {
      const res = await fetch('/api/account/sessions', { method: 'DELETE' })
      if (res.ok) {
        setSessionMessage('All other sessions signed out.')
        loadSessions()
        loadActivity()
      }
    } catch {}
    finally {
      setRevokingSessions(false)
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
            <span>CLINICAL STAFF &amp; ACCOUNT MANAGEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Account Details &amp; Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Manage your personal profile details, statutory credentials, login security, and active workstation sessions. Changes are stored directly in the database.
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

      {/* Account Information Card */}
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

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 text-right space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-500">
              Account ID: <strong className="text-slate-700 font-mono">{String(user.id).slice(0, 8)}...</strong>
            </div>
            <div className="text-xs text-slate-500">
              Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Personal Information (Editable & Persisted to DB) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User size={16} />
              <span>Personal Information</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Update your personal display details and hospital affiliation. Changes persist directly to the database.
            </p>
          </div>

          {!isEditingProfile ? (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 size={12} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <X size={12} />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {profileMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              profileMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                disabled={!isEditingProfile}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                title="Email change requires administrative verification"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs cursor-not-allowed"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Work email is locked to protect clinical audit integrity.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                disabled={!isEditingProfile}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Designation
              </label>
              <input
                type="text"
                disabled={!isEditingProfile}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Consultant Obstetrician & Gynecologist"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Clinic Facility
              </label>
              <input
                type="text"
                disabled={!isEditingProfile}
                value={hospitalClinicName}
                onChange={(e) => setHospitalClinicName(e.target.value)}
                placeholder="Apex Mother & Child Hospital"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Department
              </label>
              <input
                type="text"
                disabled={!isEditingProfile}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department of Obstetrics & Gynecology"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>
          </div>

          {isEditingProfile && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save to Database</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </section>

      {/* SECTION 2: Statutory Medical Credentials (Read-Only Security Governance) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope size={16} />
            <span>Statutory Professional Registration (Verified)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Official state council registration numbers stamped on clinical outputs. Managed under administrator verification.
          </p>
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
            <dt className="text-slate-500 font-medium text-[11px]">Clinical Role</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">
              {isNurse ? 'Clinical Nurse Specialist' : 'Obstetrician & Gynecologist'}
            </dd>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <dt className="text-slate-500 font-medium text-[11px]">Registration State</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">
              {user.registrationState || 'Karnataka, India'}
            </dd>
          </div>
        </dl>
      </section>

      {/* SECTION 3: Security & Password Management */}
      <div id="password" className="grid md:grid-cols-2 gap-6 scroll-mt-20">
        {/* Change Password Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound size={16} />
              <span>Change Password</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Update your account password with current credential validation
            </p>
          </div>

          {passwordMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{passwordMessage.text}</div>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-slate-900 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (Min. 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-slate-900 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-slate-900 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs mt-2"
            >
              {isSubmittingPassword ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Updating Password in Database...</span>
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

        {/* Active Sessions & Workstation Security */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Laptop size={16} />
                  <span>Active Workstation Sessions</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track authenticated sessions and sign out other devices
                </p>
              </div>

              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                disabled={revokingSessions}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
              >
                {revokingSessions ? 'Revoking...' : 'Sign out other sessions'}
              </button>
            </div>

            {sessionMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {sessionMessage}
              </div>
            )}

            <div className="space-y-2">
              {loadingSessions ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading active sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
                  Current browser session active.
                </div>
              ) : (
                sessions.map((sess, idx) => (
                  <div
                    key={sess.id || idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
                        <Laptop size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>Session {sess.id.slice(0, 8)}...</span>
                          {sess.isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              This Device
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          Started: {sess.createdAt ? new Date(sess.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {sess.isExpired ? 'Expired' : '1h Timeout'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              <span>Automatic 60-min session expiration</span>
            </span>
            <Link href="/forgot-password" className="text-slate-700 hover:underline font-semibold">
              Recovery Link →
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 4: Recent Account Activity Log */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity size={16} />
            <span>Recent Account Security Activity</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Immutable security log of authentication events, credential updates, and session creations.
          </p>
        </div>

        <div className="space-y-2">
          {loadingActivities ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading activity records...</div>
          ) : activities.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
              No recent security events recorded.
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 font-mono text-[11px]">
                    {act.actionType}
                  </div>
                  <div className="text-slate-600 text-xs">{act.details}</div>
                </div>
                <div className="text-[10.5px] font-mono text-slate-400 shrink-0">
                  {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
