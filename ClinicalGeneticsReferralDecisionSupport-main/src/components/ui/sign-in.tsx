'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Stethoscope,
  HeartPulse,
  CheckCircle2,
} from 'lucide-react'
import { AuthCardShell } from '@/components/auth/AuthCardShell'
import { AuthVisualPanel } from '@/components/auth/AuthVisualPanel'

// Re-export for any backward-compatible imports
export { AuthVisualPanel as DnaVisualPanel }

export type ProfessionalRole = 'gynecologist' | 'nurse'

export interface SignInProps {
  onSuccessRedirect?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignIn({ onSuccessRedirect }: SignInProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRoleParam = searchParams?.get('role')
  const initialRole: ProfessionalRole | null =
    initialRoleParam === 'gynecologist' || initialRoleParam === 'nurse'
      ? initialRoleParam
      : null

  // 1. Role Selection First
  const [selectedRole, setSelectedRole] = useState<ProfessionalRole | null>(initialRole)

  // 2. Credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Status & Feedback
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusNotice, setStatusNotice] = useState<{
    message: string
    type: 'error' | 'warning' | 'info'
    actionLink?: { href: string; label: string }
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatusNotice(null)

    // Validation: Role Selection Required
    if (!selectedRole) {
      setErrorMessage('Please select your professional role before signing in.')
      return
    }

    const cleanEmail = email.trim().toLowerCase()

    // Validation: Email Required & Format
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered work email.')
      return
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid work email address (e.g., doctor@hospital.org).')
      return
    }

    // Validation: Password Required
    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          email: cleanEmail,
          password,
          rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Scenario B: Role mismatch
        if (data.status === 'ROLE_MISMATCH' || response.status === 403 && data.message?.includes('does not match')) {
          setErrorMessage(data.message || 'The selected professional role does not match your registered account.')
          return
        }

        // Scenario D: Professional verification pending
        if (data.status === 'PROFESSIONAL_VERIFICATION_PENDING' || data.message?.includes('awaiting administrator verification')) {
          setStatusNotice({
            message: data.message || 'Your professional account is awaiting administrator verification.',
            type: 'warning',
            actionLink: data.redirectTo
              ? { href: data.redirectTo, label: 'View Verification Status →' }
              : undefined,
          })
          return
        }

        // Scenario E: Suspended account
        if (data.status === 'SUSPENDED') {
          setErrorMessage(data.message || 'Your account has been suspended by clinical administration. Please contact clinical governance.')
          return
        }

        // Scenario E: Rejected account
        if (data.status === 'REJECTED') {
          setStatusNotice({
            message: data.message || 'Your professional verification was not approved.',
            type: 'error',
            actionLink: data.redirectTo
              ? { href: data.redirectTo, label: 'View Rejection Details & Appeal →' }
              : undefined,
          })
          return
        }

        // Scenario C / Generic Bad Credentials
        if (response.status === 401) {
          setErrorMessage('Invalid email or password.')
          return
        }

        // Rate Limited
        if (response.status === 429) {
          setErrorMessage(data.message || 'Account is temporarily locked due to repeated failed login attempts. Please try again later.')
          return
        }

        throw new Error(data.message || 'Authentication failed. Please verify your credentials.')
      }

      // Scenario A: Approved account - create session and open clinical workspace
      const destination = onSuccessRedirect || data.redirectTo || (selectedRole === 'nurse' ? '/nurse/dashboard' : '/doctor/dashboard')
      router.push(destination)
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCardShell>
      <div className="max-w-xl mx-auto w-full my-auto py-2">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Clinical Genetics Portal Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Sign In to Workspace
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Select your registered clinical role and enter your authorized credentials to access genetic decision support workflows.
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Status Notice (Pending / Rejected) */}
        {statusNotice && (
          <div
            className={`mb-5 p-4 rounded-xl border text-xs animate-in fade-in duration-200 space-y-2 ${
              statusNotice.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  statusNotice.type === 'warning' ? 'text-amber-600' : 'text-rose-600'
                }`}
              />
              <div className="leading-relaxed font-medium">{statusNotice.message}</div>
            </div>
            {statusNotice.actionLink && (
              <div className="pt-1 pl-6.5">
                <Link
                  href={statusNotice.actionLink.href}
                  className="font-semibold underline hover:no-underline text-teal-800 hover:text-teal-950 transition-colors"
                >
                  {statusNotice.actionLink.label}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Sign In Form */}
        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
          {/* =========================================================================
              1. ROLE SELECTION FIRST (Two Equal-Width Cards)
              ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-800">
                1. Select Professional Role <span className="text-rose-500">*</span>
              </label>
              {selectedRole && (
                <span className="text-[11px] font-medium text-teal-700 capitalize flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Role Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Select Professional Role">
              {/* Role Card 1: Gynecologist / OB-GYN */}
              <button
                type="button"
                role="radio"
                aria-checked={selectedRole === 'gynecologist'}
                onClick={() => {
                  setSelectedRole('gynecologist')
                  setErrorMessage(null)
                }}
                className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl text-left transition-all duration-200 ease-in-out cursor-pointer relative ${
                  selectedRole === 'gynecologist'
                    ? 'border-2 border-[#00D8C3] bg-[#00D8C3]/10 text-slate-900 shadow-sm shadow-[#00D8C3]/20'
                    : 'border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      selectedRole === 'gynecologist'
                        ? 'bg-[#00D8C3] text-slate-950 font-bold'
                        : 'bg-slate-200/80 text-slate-500'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      selectedRole === 'gynecologist'
                        ? 'border-[#00D8C3] bg-[#00D8C3]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedRole === 'gynecologist' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    )}
                  </div>
                </div>
                <div className="font-bold text-xs sm:text-[13px] text-slate-900 leading-snug">
                  Gynecologist / OB-GYN
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Doctor / Clinical Specialist
                </div>
              </button>

              {/* Role Card 2: Nurse / Medical Assistant */}
              <button
                type="button"
                role="radio"
                aria-checked={selectedRole === 'nurse'}
                onClick={() => {
                  setSelectedRole('nurse')
                  setErrorMessage(null)
                }}
                className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl text-left transition-all duration-200 ease-in-out cursor-pointer relative ${
                  selectedRole === 'nurse'
                    ? 'border-2 border-[#00D8C3] bg-[#00D8C3]/10 text-slate-900 shadow-sm shadow-[#00D8C3]/20'
                    : 'border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      selectedRole === 'nurse'
                        ? 'bg-[#00D8C3] text-slate-950 font-bold'
                        : 'bg-slate-200/80 text-slate-500'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      selectedRole === 'nurse'
                        ? 'border-[#00D8C3] bg-[#00D8C3]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedRole === 'nurse' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    )}
                  </div>
                </div>
                <div className="font-bold text-xs sm:text-[13px] text-slate-900 leading-snug">
                  Nurse / Medical Assistant
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Clinical Staff / Coordinator
                </div>
              </button>
            </div>
          </div>

          {/* =========================================================================
              2. WORK EMAIL FIELD
              ========================================================================= */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              2. Registered Work Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="doctor@hospital.org"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                className="h-11 w-full pl-10 pr-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-400 focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20"
              />
            </div>
          </div>

          {/* =========================================================================
              3. PASSWORD FIELD WITH TOGGLE & FORGOT PASSWORD LINK
              ========================================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                3. Password <span className="text-rose-500">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                className="h-11 w-full pl-10 pr-11 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-400 focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* =========================================================================
              4. KEEP CLINICAL SESSION ACTIVE CHECKBOX
              ========================================================================= */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600">
                Keep Clinical Session Active on this workstation
              </span>
            </label>
          </div>

          {/* =========================================================================
              5. SUBMIT BUTTON: SIGN IN TO WORKSPACE
              ========================================================================= */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-sm font-semibold bg-[#00D8C3] text-slate-950 hover:bg-[#22C9EE] shadow-md shadow-[#00D8C3]/20 hover:shadow-lg hover:shadow-[#00D8C3]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Professional Role &amp; Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* =========================================================================
            6. REGISTRATION LINK (No Demo Bypass Buttons)
            ========================================================================= */}
        <div className="mt-7 pt-5 text-center border-t border-slate-200">
          <p className="text-xs text-slate-600">
            Don&apos;t have a verified clinical account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-teal-700 hover:text-teal-900 hover:underline transition-colors"
            >
              Register as Healthcare Professional
            </Link>
          </p>
        </div>
      </div>
    </AuthCardShell>
  )
}

export default SignIn
