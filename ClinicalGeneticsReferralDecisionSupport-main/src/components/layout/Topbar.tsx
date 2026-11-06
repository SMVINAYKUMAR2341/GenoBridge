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
import { GenoBridgeLogo } from '@/components/ui/Graphics'

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
      } catch {
        // Keep active mock user if offline/unauthenticated so zero permission blocks occur
      }
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
      className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#0e4331]/80 bg-[#00261c]/95 px-4 backdrop-blur-xl lg:px-6 text-white"
    >
      {/* Left section: Toggle Button & Brand Icon when sidebar collapsed */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenu}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Desktop collapsible toggle button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar for full-screen mode (Ctrl+B)'}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-800/40 hover:text-white transition"
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

        {/* When sidebar is collapsed or on smaller screen, show mini brand header */}
        {collapsed && (
          <Link href="/" className="hidden lg:flex items-center gap-2 pl-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b8125d] text-white font-extrabold text-sm shadow-sm">
              G
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] font-black tracking-wider text-white">GENOBRIDGE</span>
              <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">GENETICS DSS</span>
            </span>
          </Link>
        )}
      </div>

      {/* Histone Parity Top Navigation Bar (Image 4 & 10) */}
      <nav aria-label="Top navigation" className="hidden md:flex items-center gap-1.5 lg:gap-2">
        {/* New assessment tab (Rich Magenta Pill matching Histone Image 4) */}
        <Link
          href="/assessment"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
            isAssessment
              ? 'bg-[#b8125d] text-white shadow-[#b8125d]/30 ring-1 ring-white/20'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <LayoutGrid size={14} className="shrink-0" />
          <span>New assessment</span>
        </Link>

        {/* Referrals */}
        <Link
          href="/referrals"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
            isReferrals
              ? 'bg-emerald-500/20 text-[#00D8C3] ring-1 ring-[#00D8C3]/40'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <ArrowLeftRight size={14} className="shrink-0" />
          <span>Referrals</span>
        </Link>

        {/* Patients / Pedigree & ANC */}
        <Link
          href="/pedigree"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
            isPatients
              ? 'bg-emerald-500/20 text-[#00D8C3] ring-1 ring-[#00D8C3]/40'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users size={14} className="shrink-0" />
          <span>Patients</span>
        </Link>

        {/* History */}
        <Link
          href="/history"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
            isHistory
              ? 'bg-emerald-500/20 text-[#00D8C3] ring-1 ring-[#00D8C3]/40'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <HistoryIcon size={14} className="shrink-0" />
          <span>History</span>
        </Link>

        {/* Reports & Analytics */}
        <Link
          href="/analytics"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            isAnalytics
              ? 'bg-emerald-500/20 text-[#00D8C3] ring-1 ring-[#00D8C3]/40'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <BarChart3 size={14} className="shrink-0" />
          <span>Analytics</span>
        </Link>
      </nav>

      {/* Right Section: Search, Bell, and Histone Provider Avatar Badge (Image 4 & 10) */}
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
            placeholder="Search guidelines, cases..."
            className="h-8.5 w-full rounded-full border border-[#0e4331] bg-[#021f17] pr-3 pl-[34px] text-[12px] text-white outline-none placeholder:text-slate-400 hover:border-emerald-500/40 focus:border-emerald-400"
          />
          {menu === 'search' && q.trim() && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[#0e4331] bg-[#00261c] p-2 shadow-2xl backdrop-blur-xl z-50 text-white">
              {results.length ? (
                results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => go(r.href)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-white hover:bg-white/10"
                  >
                    <span className="w-16 shrink-0 text-[9px] font-bold tracking-wider text-[#00D8C3] uppercase">
                      {r.k}
                    </span>
                    <span className="truncate">{r.label}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-slate-400">No matches found.</p>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          onClick={() => setMenu(menu === 'notif' ? null : 'notif')}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          <Bell size={18} />
          <span className="absolute top-[6px] right-[6px] h-2 w-2 rounded-full bg-emerald-400" />
        </button>

        {menu === 'notif' && (
          <div className="absolute right-4 top-[64px] w-80 rounded-2xl border border-[#0e4331] bg-[#00261c] p-3 shadow-2xl z-50 text-white">
            <p className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
              <span>System &amp; Guideline Status</span>
              <span className="text-[10px] font-medium text-emerald-400">Active</span>
            </p>
            <p className="text-xs text-[#A9BDCA] leading-relaxed rounded-xl bg-white/[0.04] p-2.5 border border-white/5">
              Deterministic genetic decision support indexed to published FOGSI, ACOG, and ACMG criteria. All calculations operate client-side.
            </p>
            <Link
              href="/account"
              onClick={() => setMenu(null)}
              className="mt-2 block text-center text-xs font-bold text-[#00D8C3] hover:underline"
            >
              Review OPD Delegation &amp; Staff Roles &rarr;
            </Link>
          </div>
        )}

        {/* Histone Provider Badge [ S ] SM VINAY KUMAR · PROVIDER (Image 4 & 10) */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu === 'profile' ? null : 'profile')}
            aria-label="Clinician Profile"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full border border-emerald-500/30 bg-[#021f17] hover:border-emerald-400/60 hover:bg-[#032a20] transition cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#008f82] text-xs font-black text-white shadow-sm ring-1 ring-emerald-300/40">
              {computeInitials(currentUser?.name, currentUser?.email)}
            </span>
            <div className="text-left hidden sm:block">
              <span className="block text-[12px] font-extrabold text-white leading-tight">
                {currentUser?.name || 'SM VINAY KUMAR'}
              </span>
              <span className="block text-[9.5px] font-bold text-[#00D8C3] tracking-widest uppercase leading-tight">
                PROVIDER
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 ml-0.5" />
          </button>

          {/* Clinician Profile Dropdown */}
          {menu === 'profile' && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[#0e4331] bg-[#00261c] p-3 shadow-2xl backdrop-blur-xl z-50 text-white">
              <div className="border-b border-[#0e4331] pb-3 mb-2 px-1">
                <p className="text-sm font-extrabold text-white">
                  {currentUser?.name || 'SM VINAY KUMAR'}
                </p>
                <p className="text-xs text-[#00D8C3] font-semibold mt-0.5">
                  {currentUser?.designation || 'Consultant Gynecologist & Fetal Medicine'}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  Reg: {currentUser?.medicalRegistrationNumber || 'KMC-89241-DSS'} · Karnataka Medical Council
                </p>
              </div>

              {/* Direct Workspace Views */}
              <div className="space-y-1">
                <Link
                  href="/doctor/dashboard"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <Stethoscope size={15} className="text-[#00D8C3]" />
                  <span>Doctor Dashboard (Gynecologist)</span>
                </Link>
                <Link
                  href="/nurse/dashboard"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <UserCheck size={15} className="text-[#00D8C3]" />
                  <span>Nurse Dashboard (Intake OPD)</span>
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <UserIcon size={15} className="text-[#00D8C3]" />
                  <span>Staff &amp; Account Delegation</span>
                </Link>
                <Link
                  href="/guidelines"
                  onClick={() => setMenu(null)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <ShieldCheck size={15} className="text-[#00D8C3]" />
                  <span>Clinical Guidelines (FOGSI/ACOG)</span>
                </Link>
              </div>

              <div className="border-t border-[#0e4331] pt-2 mt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
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
