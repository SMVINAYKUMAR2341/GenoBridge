'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  History as HistoryIcon,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User as UserIcon,
  UserCheck,
  Users,
} from 'lucide-react'
import { PATHWAYS } from '@/data/pathways'
import { GUIDELINES, KNOWLEDGE, PATIENTS } from '@/data/content'
import { useAssessments } from '@/components/providers/AssessmentsProvider'

type AuthUser = {
  id?: string | number
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  category?: string
  designation?: string
  medicalRegistrationNumber?: string
  stateMedicalCouncil?: string
}

function computeInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'S'
}

export default function Topbar({
  onMenu,
  collapsed = false,
  onToggleCollapse,
}: {
  onMenu: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const path = usePathname()
  const router = useRouter()
  const { items } = useAssessments()
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState<null | 'search' | 'notif' | 'profile'>(null)
  const ref = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [currentUser, setCurrentUser] = useState<AuthUser | null>({
    name: 'SM VINAY KUMAR',
    role: 'provider',
    category: 'gynecologist',
    designation: 'Consultant Gynecologist & Fetal Medicine Specialist',
    medicalRegistrationNumber: 'KMC-89241-DSS',
    stateMedicalCouncil: 'Karnataka Medical Council / FOGSI',
  })

  useEffect(() => {
    let active = true
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (active && data.authenticated && data.user) {
            setCurrentUser(data.user)
          }
        }
      } catch {}
    }
    checkUser()
    window.addEventListener('clinical-workspace-refresh', checkUser)
    return () => {
      active = false
      window.removeEventListener('clinical-workspace-refresh', checkUser)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    router.push('/login')
  }

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(null)
    }
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setMenu('search')
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        onToggleCollapse?.()
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', keys)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', keys)
    }
  }, [onToggleCollapse])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    const hit = (s: string) => s.toLowerCase().includes(t)
    return [
      ...PATIENTS.filter((p) => hit(p.label)).map((p) => ({
        k: 'Patient',
        label: p.label,
        href: '/history',
      })),
      ...PATHWAYS.filter((p) => hit(p.title + p.description)).map((p) => ({
        k: 'Pathway',
        label: p.title,
        href: `/assessment/${p.slug}`,
      })),
      ...items
        .filter((a) => hit(a.title + a.patientId))
        .slice(0, 3)
        .map((a) => ({ k: 'Assessment', label: `${a.title} · ${a.patientId}`, href: '/history' })),
      ...GUIDELINES.filter((g) => hit(g.org + g.full + g.topics.join(' '))).map((g) => ({
        k: 'Guideline',
        label: `${g.org} — ${g.full}`,
        href: '/guidelines',
      })),
      ...KNOWLEDGE.filter((k) => hit(k.term + k.body)).map((k) => ({
        k: 'Knowledge',
        label: k.term,
        href: '/knowledge',
      })),
    ].slice(0, 8)
  }, [q, items])

  const go = (href: string) => {
    setMenu(null)
    setQ('')
    router.push(href)
  }

  const isAssessment = path === '/' || path.startsWith('/assessment')
  const isReferrals = path.startsWith('/referrals')
  const isPatients = path.startsWith('/pedigree') || path.startsWith('/anc')
  const isHistory = path.startsWith('/history')
  const isAnalytics = path.startsWith('/analytics')

  return (
    <header
      ref={ref}
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md text-slate-900 shadow-xs"
    >
      {/* Brand & Sidebar Toggles */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenu}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Desktop collapsible toggle button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar for full-screen mode (Ctrl+B)'}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b8125d] text-white font-extrabold text-sm shadow-sm">
            H
          </span>
          <div className="text-left leading-tight hidden sm:block">
            <div className="font-heading font-extrabold text-[16px] text-[#b8125d] tracking-tight">
              HistoNe
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-slate-500">
              GENETICS DSS
            </div>
          </div>
        </Link>
      </div>

      {/* Histone Parity Top Navigation Tabs */}
      <nav aria-label="Top navigation" className="hidden md:flex items-center gap-1.5 lg:gap-2">
        {/* New assessment tab (Rich Magenta Pill matching Histone) */}
        <Link
          href="/assessment"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150 ${
            isAssessment
              ? 'bg-[#b8125d] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#fce7f3] hover:text-[#b8125d]'
          }`}
        >
          <LayoutGrid size={15} className="shrink-0" />
          <span>New assessment</span>
        </Link>

        {/* Referrals */}
        <Link
          href="/referrals"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150 ${
            isReferrals
              ? 'bg-[#b8125d] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#fce7f3] hover:text-[#b8125d]'
          }`}
        >
          <ArrowLeftRight size={15} className="shrink-0" />
          <span>Referrals</span>
        </Link>

        {/* Patients & Pedigree */}
        <Link
          href="/pedigree"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150 ${
            isPatients
              ? 'bg-[#b8125d] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#fce7f3] hover:text-[#b8125d]'
          }`}
        >
          <Users size={15} className="shrink-0" />
          <span>Patients</span>
        </Link>

        {/* History */}
        <Link
          href="/history"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150 ${
            isHistory
              ? 'bg-[#b8125d] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#fce7f3] hover:text-[#b8125d]'
          }`}
        >
          <HistoryIcon size={15} className="shrink-0" />
          <span>History</span>
        </Link>

        {/* Reports & Analytics */}
        <Link
          href="/analytics"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150 ${
            isAnalytics
              ? 'bg-[#b8125d] text-white shadow-xs'
              : 'text-slate-700 hover:bg-[#fce7f3] hover:text-[#b8125d]'
          }`}
        >
          <BarChart3 size={15} className="shrink-0" />
          <span>Analytics</span>
        </Link>
      </nav>

      {/* Right Section: Quick Search & Histone Provider Badge [ S ] SM VINAY KUMAR */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="relative hidden xl:block w-[240px]">
          <Search
            size={15}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-slate-400"
          />
          <input
            ref={searchRef}
            aria-label="Search"
            value={q}
            onFocus={() => setMenu('search')}
            onChange={(e) => {
              setQ(e.target.value)
              setMenu('search')
            }}
            placeholder="Search guidelines, rules..."
            className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pr-3 pl-[34px] text-xs text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-[#b8125d] focus:bg-white"
          />
          {menu === 'search' && q.trim() && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50 text-slate-900">
              {results.length ? (
                results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => go(r.href)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-100"
                  >
                    <span className="w-16 shrink-0 text-[9px] font-bold tracking-wider text-[#b8125d] uppercase">
                      {r.k}
                    </span>
                    <span className="truncate">{r.label}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-slate-500">No matches found.</p>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          onClick={() => setMenu(menu === 'notif' ? null : 'notif')}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <Bell size={18} />
          <span className="absolute top-[6px] right-[6px] h-2 w-2 rounded-full bg-[#b8125d]" />
        </button>

        {menu === 'notif' && (
          <div className="absolute right-4 top-16 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-slate-900">
            <p className="text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
              <span>Guidelines &amp; Decision Status</span>
              <span className="text-[10px] font-semibold text-emerald-600">Active</span>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed rounded-lg bg-slate-50 p-2.5 border border-slate-100">
              Deterministic clinical decision engine running all 6 pathways calibrated against ACOG, NCCN, ACMG, and FOGSI clinical criteria.
            </p>
            <Link
              href="/account"
              onClick={() => setMenu(null)}
              className="mt-2.5 block text-center text-xs font-bold text-[#b8125d] hover:underline"
            >
              Review OPD Staff &amp; Council Details &rarr;
            </Link>
          </div>
        )}

        {/* Histone Provider Badge [ S ] SM VINAY KUMAR · PROVIDER */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === 'profile' ? null : 'profile')}
            aria-label="Clinician Profile"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#b8125d] text-xs font-bold text-white shadow-xs">
              {computeInitials(currentUser?.name, currentUser?.email)}
            </span>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'SM VINAY KUMAR'}
              </span>
              <span className="block text-[9.5px] font-bold text-slate-500 tracking-wider uppercase leading-tight">
                PROVIDER
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 ml-0.5" />
          </button>

          {/* Profile Dropdown */}
          {menu === 'profile' && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50 text-slate-900">
              <div className="border-b border-slate-100 pb-3 mb-2 px-1">
                <p className="text-sm font-bold text-slate-900">
                  {currentUser?.name || 'SM VINAY KUMAR'}
                </p>
                <p className="text-xs text-[#b8125d] font-semibold mt-0.5">
                  {currentUser?.designation || 'Consultant Gynecologist & Fetal Medicine'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Reg: {currentUser?.medicalRegistrationNumber || 'KMC-89241-DSS'} · Karnataka Medical Council
                </p>
              </div>

              {/* Quick links */}
              <div className="space-y-1">
                <Link
                  href="/doctor/dashboard"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
                >
                  <Stethoscope size={15} className="text-[#b8125d]" />
                  <span>Doctor Dashboard (Gynecologist)</span>
                </Link>
                <Link
                  href="/nurse/dashboard"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
                >
                  <UserCheck size={15} className="text-[#b8125d]" />
                  <span>Nurse Dashboard (Intake OPD)</span>
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
                >
                  <UserIcon size={15} className="text-[#b8125d]" />
                  <span>Staff &amp; Account Delegation</span>
                </Link>
                <Link
                  href="/guidelines"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
                >
                  <ShieldCheck size={15} className="text-[#b8125d]" />
                  <span>Clinical Guidelines (FOGSI / ACOG)</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-2 mt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
