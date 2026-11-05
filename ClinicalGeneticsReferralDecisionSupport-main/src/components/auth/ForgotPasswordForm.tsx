'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work email address.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing your request')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-700">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Password Reset Link Dispatched
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          If a clinical account exists for <strong className="text-slate-900">{email}</strong>, a single-use secure reset link has been dispatched. Please inspect your institutional inbox and spam folders.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          Registered Work Email <span className="text-rose-500">*</span>
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
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full pl-10 pr-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-400 focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-sm font-semibold bg-[#00D8C3] text-slate-950 hover:bg-[#22C9EE] shadow-md shadow-[#00D8C3]/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending Reset Link...</span>
          </>
        ) : (
          <>
            <span>Send Password Reset Link</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-center pt-3 border-t border-slate-200">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </form>
  )
}

export default ForgotPasswordForm
