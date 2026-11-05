'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronRight,
  House,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'
import { PATHWAYS } from '@/data/pathways'
import { GUIDELINES, KNOWLEDGE, PATIENTS, STAFF } from '@/data/content'
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
  return 'CS'
}

function computeRole(user: AuthUser): string {
  if (user.designation && user.designation.trim()) {
    return user.designation.trim()
  }
  if (user.category === 'gynecologist') {
    return 'Staff · OB/GYN'
  }
  if (user.category === 'nurse') {
    return 'Staff · Clinical Nurse'
  }
  if (user.role === 'provider') {
    return 'Attending Physician'
  }
  if (user.role === 'nurse') {
    return 'Clinical Nurse'
  }
  if (user.role === 'admin') {
    return 'Administrator'
  }
  return 'Clinical Staff'
}

const TITLES: Record<string, string> = {
  '/': 'New Assessment',
  '/history': 'Patient History',
  '/referrals': 'Referral Overview',
  '/analytics': 'Reports & Analytics',
  '/guidelines': 'Clinical Guidelines',
  '/calculator': 'Risk Calculator',
  '/saved': 'Saved Assessments',
  '/knowledge': 'Knowledge Base',
  '/safety': 'Safety & Setup',
}
export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const path = usePathname(),
    router = useRouter()
  const { items } = useAssessments()
  const [q, setQ] = useState(''),
    [menu, setMenu] = useState<null | 'search' | 'notif' | 'profile'>(null)
  const ref = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const title = path.startsWith('/assessment') ? 'Assessment' : (TITLES[path] ?? 'Workspace')

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let active = true
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (active) {
            if (data.authenticated && data.user) {
              setCurrentUser(data.user)
            } else {
              setCurrentUser(null)
            }
          }
        }
      } catch {
        if (active) setCurrentUser(null)
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
    setCurrentUser(null)
    setMenu(null)
    window.dispatchEvent(new Event('clinical-workspace-refresh'))
    router.push('/login')
    router.refresh()
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
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', keys)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', keys)
    }
  }, [])
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
  const pop =
    'absolute z-30 mt-2 rounded-2xl border border-[#0e4331] bg-[#00261c] p-2 shadow-2xl backdrop-blur-xl text-white'
  const iconBtn =
    'relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 hover:text-hx-accent'
  return (
    <header
      ref={ref}
      className="sticky top-0 z-30 flex h-[74px] items-center gap-3 border-b border-[#0e4331] bg-[#00261c]/95 px-4 backdrop-blur-xl lg:pr-[30px] lg:pl-[37px] text-white"
    >
      <button onClick={onMenu} aria-label="Open menu" className={`${iconBtn} lg:hidden`}>
        <Menu size={20} />
      </button>
      <nav aria-label="Breadcrumb" className="hidden shrink-0 items-center text-[14px] xl:flex">
        <Link href="/" aria-label="Home" className="text-white transition hover:text-hx-accent">
          <House size={23} strokeWidth={1.8} />
        </Link>
        <span className="ml-[21px] font-medium text-slate-400">Workspace</span>
        <ChevronRight size={15} strokeWidth={2} className="mx-4 text-slate-500" />
        <span className="font-bold text-white">{title}</span>
      </nav>
      <div className="relative mx-auto w-full max-w-[398px]">
        <Search
          size={18}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-[15px] -translate-y-1/2 text-slate-400"
        />
        <input
          ref={searchRef}
          aria-label="Search"
          aria-keyshortcuts="Control+K"
          value={q}
          onFocus={() => setMenu('search')}
          onChange={(e) => {
            setQ(e.target.value)
            setMenu('search')
          }}
          onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0].href)}
          placeholder="Search patients, assessments, guidelines..."
          className="h-11 w-full rounded-full border border-[#0e4331] bg-[#021f17] pr-4 pl-[46px] text-[13px] text-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition outline-none placeholder:text-slate-400 hover:border-[#137a2c] focus:border-hx-accent focus:ring-4 focus:ring-hx-accent/20 sm:pr-[70px]"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md bg-[#063327] border border-[#0e4331] px-2 py-[3px] font-sans text-[12px] font-medium text-slate-300 sm:block">
          Ctrl K
        </kbd>
        {menu === 'search' && q.trim() && (
          <div className={`${pop} left-0 w-full`}>
            {results.length ? (
              results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => go(r.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                >
                  <span className="w-20 shrink-0 text-[10px] font-bold tracking-wider text-hx-accent uppercase">
                    {r.k}
                  </span>
                  <span className="truncate">{r.label}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-slate-400">No matches for “{q}”.</p>
            )}
          </div>
        )}
      </div>
      <span className="hidden shrink-0 items-center gap-[9px] text-[13px] font-medium text-slate-400 2xl:flex">
        <span className="h-2.5 w-2.5 rounded-full bg-hx-accent shadow-[0_0_0_3px_rgb(22_163_74/0.2)]" />
        Decision support workspace
      </span>
      <span aria-hidden className="mx-1.5 hidden h-7 w-px bg-[#0e4331] 2xl:block" />
      <div className="relative">
        <button
          aria-label="Notifications"
          aria-expanded={menu === 'notif'}
          onClick={() => setMenu(menu === 'notif' ? null : 'notif')}
          className={iconBtn}
        >
          <Bell size={23} strokeWidth={1.8} />
          <span className="absolute top-[7px] right-[8px] h-[9px] w-[9px] rounded-full bg-hx-accent ring-2 ring-[#00261c]" />
        </button>
        {menu === 'notif' && (
          <div className={`${pop} right-0 w-72`}>
            <p className="px-3 py-2 text-xs font-bold text-slate-300">Notifications</p>
            <p className="rounded-xl border border-hx-warn-line bg-hx-warn-bg px-3 py-3 text-sm text-hx-warn">
              Clinical criteria are not yet clinically validated. Use simulated inputs only.
            </p>
            <Link
              href="/safety"
              onClick={() => setMenu(null)}
              className="mt-1 block rounded-xl px-3 py-2 text-sm font-semibold text-hx-accent transition hover:bg-white/10"
            >
              Review Safety &amp; Setup
            </Link>
          </div>
        )}
      </div>
      <span aria-hidden className="mx-1.5 hidden h-7 w-px bg-[#0e4331] sm:block" />
      <div className="relative">
        <button
          aria-label="User menu"
          aria-expanded={menu === 'profile'}
          onClick={() => setMenu(menu === 'profile' ? null : 'profile')}
          className="flex items-center gap-[18px] rounded-2xl p-1 transition hover:bg-white/10 sm:pr-2"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#13703a,#0b4f26_70%)] text-[15px] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] ring-2 ring-[#00e5ce]/40">
            {computeInitials(currentUser?.name, currentUser?.email)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[13.5px] leading-tight font-extrabold text-white">
              {currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Clinical Staff')}
            </span>
            <span className="mt-0.5 block text-[13px] leading-tight text-slate-400">
              {currentUser ? computeRole(currentUser) : 'Staff · OB/GYN'}
            </span>
          </span>
          <ChevronDown size={17} strokeWidth={2} className="hidden text-slate-400 sm:block" />
        </button>
        {menu === 'profile' && (
          <div className={`${pop} right-0 w-64`}>
            <div className="border-b border-[#0e4331] px-3 pt-1 pb-3">
              <p className="text-sm font-extrabold text-white">
                {currentUser?.name || 'Clinical Staff'}
              </p>
              <p className="text-xs text-slate-300">
                {currentUser ? computeRole(currentUser) : 'Staff · OB/GYN'}
              </p>
              {currentUser?.email && (
                <p className="mt-1 text-[11px] font-medium text-[#00e5ce] truncate">
                  {currentUser.email}
                </p>
              )}
            </div>
            {[
              ['/saved', 'Saved assessments', Settings],
              ['/safety', 'Safety & setup', ShieldCheck],
            ].map(([h, l, I]) => {
              const Icon = I as typeof Settings
              return (
                <Link
                  key={h as string}
                  href={h as string}
                  onClick={() => setMenu(null)}
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  <Icon size={15} className="text-[#00e5ce]" />
                  {l as string}
                </Link>
              )
            })}
            {currentUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 flex w-full items-center gap-2 rounded-xl border-t border-[#0e4331] px-3 pt-3 pb-1 text-sm font-semibold text-red-400 hover:text-red-300 transition"
              >
                <LogOut size={15} /> Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenu(null)}
                className="mt-2 flex w-full items-center gap-2 rounded-xl border-t border-[#0e4331] px-3 pt-3 pb-1 text-sm font-semibold text-[#00e5ce] hover:brightness-110 transition"
              >
                <UserIcon size={15} /> Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
