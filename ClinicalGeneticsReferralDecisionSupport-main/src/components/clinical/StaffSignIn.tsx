'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, RefreshCw } from 'lucide-react'
import { signInAction, signOutAction } from '@/app/(frontend)/actions'
import { loadClinicalWorkspaceAction } from '@/app/(frontend)/workflow-actions'
import { btnGhost, btnPrimary, card, inputCls } from '@/components/ui/Primitives'
import type { ClinicalWorkspaceResult } from '@/lib/workflow-store'

const refreshEvent = 'clinical-workspace-refresh'

export function refreshClinicalWorkspace() {
  window.dispatchEvent(new Event(refreshEvent))
}

export function useClinicalWorkspace() {
  const [workspace, setWorkspace] = useState<Extract<ClinicalWorkspaceResult, { ok: true }> | null>(
    null,
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [generation, setGeneration] = useState(0)
  const reload = useCallback(() => {
    setWorkspace(null)
    setLoading(true)
    setGeneration((value) => value + 1)
  }, [])
  useEffect(() => {
    window.addEventListener(refreshEvent, reload)
    return () => window.removeEventListener(refreshEvent, reload)
  }, [reload])
  useEffect(() => {
    let active = true
    setLoading(true)
    setWorkspace(null)
    setError('')
    void loadClinicalWorkspaceAction()
      .then((result) => {
        if (!active) return
        if (!result.ok) {
          setError(result.error)
          return
        }
        setWorkspace(result)
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Unable to load the workspace. Retry or contact your administrator.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [generation])
  return { workspace, error, loading, reload }
}

export default function StaffSignIn() {
  const router = useRouter()
  const { workspace, error: loadError, loading } = useClinicalWorkspace()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    setError('')
    try {
      const result = await signInAction({
        email: String(fields.get('email') ?? ''),
        password: String(fields.get('password') ?? ''),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      form.reset()
      refreshClinicalWorkspace()
      router.refresh()
    } catch {
      setError('Sign-in could not be completed. Retry or contact your administrator.')
    } finally {
      setBusy(false)
    }
  }
  async function signOut() {
    setBusy(true)
    setError('')
    try {
      await signOutAction()
      refreshClinicalWorkspace()
      router.refresh()
    } catch {
      setError('Sign-out could not be confirmed. Retry before leaving this device.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section aria-label="Staff access" className="mb-6 rounded-[14px] border border-slate-200 bg-white p-5 shadow-xs text-slate-900">
      {loading ? (
        <p role="status" className="flex items-center gap-2 text-sm text-slate-300">
          <RefreshCw size={16} className="animate-spin text-[#00e5ce]" /> Checking staff session…
        </p>
      ) : workspace?.user ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white">
            <strong className="text-[#34d399] font-bold">{workspace.user.name}</strong> ·{' '}
            <span className="text-slate-300 capitalize">{workspace.user.role}</span>
          </p>
          <button type="button" onClick={signOut} disabled={busy} className={btnGhost}>
            <LogOut size={16} className="text-[#00e5ce]" /> Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="w-full">
            <h2 className="font-bold text-white text-base">Staff sign-in</h2>
            <p className="mt-1 text-sm text-slate-300">
              Use an existing authorized app account. CMS admin access is separate.
            </p>
          </div>
          <label className="min-w-48 flex-1 text-sm font-semibold text-slate-200">
            Email
            <input
              className={`${inputCls} mt-1`}
              name="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
              disabled={busy}
            />
          </label>
          <label className="min-w-48 flex-1 text-sm font-semibold text-slate-200">
            Password
            <input
              className={`${inputCls} mt-1`}
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={200}
              required
              disabled={busy}
            />
          </label>
          <button className={btnPrimary} disabled={busy}>
            <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}
      {(error || loadError) && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error || loadError}
        </p>
      )}
    </section>
  )
}
