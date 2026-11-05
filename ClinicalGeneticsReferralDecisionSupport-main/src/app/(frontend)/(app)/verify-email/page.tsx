'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react'
import { AuthCardShell } from '@/components/auth/AuthCardShell'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenParam = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [token, setToken] = useState(tokenParam || '')
  const [email, setEmail] = useState(emailParam || '')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleVerify = async (tokenToVerify?: string) => {
    const finalToken = tokenToVerify || token
    if (!finalToken && !email) {
      setStatus('error')
      setMessage('Please enter your verification token or registered work email.')
      return
    }

    setLoading(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: finalToken || undefined, email: email || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }

      setStatus('success')
      setMessage(data.message || 'Your work email has been successfully verified.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Verification token is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokenParam) {
      void handleVerify(tokenParam)
    }
  }, [tokenParam])

  return (
    <div className="max-w-xl mx-auto w-full my-auto py-2">
      <div className="mb-7">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium mb-3">
          <Mail className="w-3.5 h-3.5 text-teal-600" />
          <span>Workplace Email Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Verify Your Work Email
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          As part of clinical security standards, verify your official hospital or institutional email address before clinical access is granted.
        </p>
      </div>

      {status === 'success' ? (
        <div className="p-6 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-4">
          <div className="flex items-center gap-2.5 text-teal-800">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <span className="font-semibold text-sm">Work Email Confirmed</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/account-pending"
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold bg-[#00D8C3] text-slate-950 hover:bg-[#22C9EE] transition-all shadow-md shadow-[#00D8C3]/20"
            >
              <span>View Account Review Status</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {status === 'error' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="token"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Verification Token
            </label>
            <input
              id="token"
              type="text"
              placeholder="Paste 64-character verification code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="h-11 w-full px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-mono outline-none transition-all hover:border-slate-400 focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Or Registered Work Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                type="email"
                placeholder="doctor@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full pl-10 pr-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-400 focus:border-[#00D8C3] focus:ring-2 focus:ring-[#00D8C3]/20"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-sm font-semibold bg-[#00D8C3] text-slate-950 hover:bg-[#22C9EE] shadow-md shadow-[#00D8C3]/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Confirm Work Email</span>
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
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default function VerifyEmailPage() {
  return (
    <AuthCardShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </AuthCardShell>
  )
}
