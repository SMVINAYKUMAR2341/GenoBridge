'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { btnGhost, PageHeader } from '@/components/ui/Primitives'

interface SecurityControlItem {
  id: string
  name: string
  status: 'Implemented and verified' | 'Partially implemented' | 'Not implemented' | 'Not verified'
  evidence: string
  limitations: string
}

interface SecurityCategoryGroup {
  category: string
  description: string
  controls: SecurityControlItem[]
}

interface SecurityStatusResponse {
  verifiedAt: string
  environment: string
  https: boolean
  databaseStatus: string
  databaseLatencyMs: number
  categories: SecurityCategoryGroup[]
  disclaimer: string
}

export default function SafetyPanel() {
  const [data, setData] = useState<SecurityStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/security-status', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to retrieve security verification evidence.')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err?.message || 'Network error verifying security controls.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const getStatusBadge = (status: SecurityControlItem['status']) => {
    switch (status) {
      case 'Implemented and verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Implemented and verified</span>
          </span>
        )
      case 'Partially implemented':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={12} className="text-amber-600" />
            <span>Partially implemented</span>
          </span>
        )
      case 'Not implemented':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle size={12} className="text-slate-500" />
            <span>Not implemented</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <HelpCircle size={12} className="text-rose-600" />
            <span>Not verified</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-slate-500 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>TECHNICAL &amp; APPLICATION ASSURANCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Security, Privacy &amp; Deployment Readiness
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
            A transparent overview of application security controls, data handling, account protection and deployment configuration. Statuses reflect actual implementation and verification evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Re-verify Controls</span>
          </button>
          <Link
            href="/history"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
          >
            Workspace History
          </Link>
        </div>
      </div>

      {/* Mandatory Statutory Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldAlert size={15} className="text-slate-800" />
          <span>Statutory Notice &amp; Scope Boundary</span>
        </div>
        <p className="leading-relaxed">
          This page provides an application-level overview of implemented security controls. It does not constitute an independent security audit, penetration test, legal compliance certification or regulatory approval.
        </p>
      </div>

      {/* Live System Diagnostics Summary */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] font-mono uppercase text-slate-500">Database Engine</div>
            <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data.databaseStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{data.databaseStatus}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">PostgreSQL Pooler ({data.databaseLatencyMs}ms)</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] font-mono uppercase text-slate-500">Transport Security</div>
            <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data.https ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{data.https ? 'HTTPS / TLS Active' : 'HTTP Local'}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">TLS termination verified</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] font-mono uppercase text-slate-500">Environment</div>
            <div className="text-sm font-bold text-slate-900 mt-1 capitalize">
              {data.environment}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Node.js / Next.js Runtime</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="text-[11px] font-mono uppercase text-slate-500">Last Verified</div>
            <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">
              {new Date(data.verifiedAt).toLocaleTimeString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Real-time probe</div>
          </div>
        </div>
      )}

      {/* Control Categories */}
      {loading && !data && (
        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-3">
          <RefreshCw size={24} className="animate-spin text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Probing system security controls and database connectivity...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <strong>Verification probe failed:</strong> {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {data.categories.map((group, groupIdx) => (
            <section key={groupIdx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{group.category}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
              </div>

              <div className="grid gap-3">
                {group.controls.map((ctrl) => (
                  <div
                    key={ctrl.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900">{ctrl.name}</span>
                      {getStatusBadge(ctrl.status)}
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed font-sans">
                      <strong className="text-slate-800 font-semibold">Implementation Evidence: </strong>
                      <span>{ctrl.evidence}</span>
                    </div>

                    {ctrl.limitations && (
                      <div className="text-[11px] text-slate-500 leading-normal pt-1 border-t border-slate-200/50">
                        <span className="font-semibold text-slate-600">Limitations &amp; Boundary: </span>
                        <span>{ctrl.limitations}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-500">
        <Link href="/account" className="hover:text-slate-900 hover:underline flex items-center gap-1 font-semibold">
          <span>Manage Account &amp; Password</span>
          <ArrowRight size={12} />
        </Link>
        <Link href="/history" className="hover:text-slate-900 hover:underline">
          Return to Patient History
        </Link>
      </div>
    </div>
  )
}
