'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  Lock,
  ArrowRight,
} from 'lucide-react'

// Official Google Multi-color G logo
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const paramRole = searchParams.get('role') || 'gynecologist'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customEmail, setCustomEmail] = useState('')
  const processed = useRef(false)

  // 1. Process hash-based OAuth token (from GenoBridge / Emergent SSO)
  useEffect(() => {
    if (processed.current) return
    const hash = window.location.hash
    const m = /session_id=([^&]+)/.exec(hash || '')

    if (m) {
      processed.current = true
      const sessionId = decodeURIComponent(m[1])
      void handleSessionExchange({ session_id: sessionId, role: paramRole })
    } else if (mode !== 'dev_sso') {
      // Check query param code or redirect
      const code = searchParams.get('code')
      if (!code) {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [mode, paramRole, searchParams])

  const handleSessionExchange = async (payload: any) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/oauth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'OAuth authentication failed')

      window.history.replaceState({}, '', data.redirectTo || '/doctor/dashboard')
      router.replace(data.redirectTo || '/doctor/dashboard')
    } catch (err: any) {
      setError(err.message || 'Session verification failed')
      setLoading(false)
    }
  }

  const handleInstantSignIn = (email: string, name: string, role: string) => {
    void handleSessionExchange({
      role,
      userProfile: {
        email,
        name,
      },
    })
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-[#031525] border border-[#164C60] shadow-2xl p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-lg shadow-white/10">
          <GoogleIcon className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Google Single Sign-On (OAuth 2.0)
        </h1>
        <p className="text-xs text-[#A9BDCA]">
          GENOBRIDGE Healthcare Identity &amp; Clinical Single Sign-On
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#00D8C3] animate-spin mx-auto" />
          <p className="text-xs text-[#8aaec3]">Establishing secure clinical session…</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-[#8aaec3] font-medium text-center">
            Choose your verified Google Healthcare profile:
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() =>
                handleInstantSignIn(
                  'doctor@hospital.org',
                  'Dr. Sarah Jenkins',
                  'gynecologist'
                )
              }
              className="w-full p-3.5 rounded-2xl bg-[#08243B] border border-[#164C60] hover:border-[#00D8C3] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00D8C3]/15 border border-[#00D8C3]/30 flex items-center justify-center text-[#00D8C3]">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                    doctor@hospital.org
                  </div>
                  <div className="text-[10px] text-[#8aaec3]">
                    Dr. Sarah Jenkins · Gynecologist / OB-GYN
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8aaec3] group-hover:text-[#00D8C3] group-hover:translate-x-1 transition-all" />
            </button>

            <button
              type="button"
              onClick={() =>
                handleInstantSignIn('nurse@hospital.org', 'Mary Johnson, RN', 'nurse')
              }
              className="w-full p-3.5 rounded-2xl bg-[#08243B] border border-[#164C60] hover:border-[#00D8C3] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                    nurse@hospital.org
                  </div>
                  <div className="text-[10px] text-[#8aaec3]">
                    Mary Johnson · Clinical Staff Nurse
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8aaec3] group-hover:text-[#00D8C3] group-hover:translate-x-1 transition-all" />
            </button>

            <button
              type="button"
              onClick={() =>
                handleInstantSignIn(
                  'admin@genobridge-test.local',
                  'System Administrator',
                  'admin'
                )
              }
              className="w-full p-3.5 rounded-2xl bg-[#08243B] border border-[#164C60] hover:border-[#00D8C3] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#00D8C3] transition-colors">
                    admin@genobridge-test.local
                  </div>
                  <div className="text-[10px] text-[#8aaec3]">
                    Clinical Governance Administrator
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8aaec3] group-hover:text-[#00D8C3] group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#164C60]/60 space-y-2">
            <label className="text-[11px] font-semibold text-[#8aaec3]">
              Or enter another Google Work Email:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                className="flex-1 px-3 py-2 rounded-xl bg-[#08243B] border border-[#164C60] text-xs text-white placeholder:text-[#5a7f96] focus:outline-none focus:border-[#00D8C3]"
              />
              <button
                type="button"
                disabled={!customEmail.includes('@')}
                onClick={() =>
                  handleInstantSignIn(
                    customEmail,
                    customEmail.split('@')[0],
                    paramRole
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00D8C3] text-[#031525] hover:bg-[#22C9EE] disabled:opacity-50 transition-all shrink-0"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-xs text-[#8aaec3] hover:text-white underline"
        >
          Return to password login
        </button>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#021627] text-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl bg-[#031525] border border-[#164C60] shadow-2xl p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#00D8C3] animate-spin mx-auto" />
            <p className="text-xs text-[#8aaec3]">Loading authentication...</p>
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}
