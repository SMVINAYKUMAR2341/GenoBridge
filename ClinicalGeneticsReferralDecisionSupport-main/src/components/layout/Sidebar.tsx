'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftRight,
  Baby,
  BookOpen,
  Bookmark,
  Calculator,
  Check,
  House,
  KeyRound,
  Layers,
  LogOut,
  Network,
  ShieldCheck,
  User,
  UserCog,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { GenoBridgeLogo, SidebarWave } from '@/components/ui/Graphics'
import { ChartBars } from '@/components/ui/Icons'

type NavLink = { href: string; label: string; icon: LucideIcon }

export const NAV: NavLink[] = [
  { href: '/assessment', label: 'New Assessment', icon: House },
  { href: '/pedigree', label: 'Pedigree Studio', icon: Network },
  { href: '/anc', label: 'Antenatal Care (ANC)', icon: Baby },
  { href: '/history', label: 'Patient History', icon: User },
  { href: '/referrals', label: 'Referral Overview', icon: ArrowLeftRight },
  { href: '/analytics', label: 'Reports & Analytics', icon: ChartBars },
  { href: '/account', label: 'Account & Security', icon: UserCog },
]
export const TOOLS: NavLink[] = [
  { href: '/guidelines', label: 'Clinical Guidelines', icon: BookOpen },
  { href: '/calculator', label: 'Risk Calculator', icon: Calculator },
  { href: '/saved', label: 'Saved Assessments', icon: Bookmark },
  { href: '/knowledge', label: 'Knowledge Base', icon: Layers },
]
const ASSURANCES = [
  'Guideline aligned (FOGSI · ACOG · ACMG · ASRM · NCCN)',
  'Transparent & traceable',
  'Specialist-reviewed',
]

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
  return 'DR'
}

function Item({
  href,
  label,
  icon: Icon,
  active,
  compact = false,
  className = '',
  onNavigate,
}: NavLink & { active: boolean; compact?: boolean; className?: string; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-[22px] rounded-xl pl-[21px] text-[15px] transition duration-200 ${
        compact ? 'h-[42px]' : 'h-[47px]'
      } ${
        active
          ? 'bg-slate-900 font-bold text-white shadow-sm'
          : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950'
      } ${className}`}
    >
      <Icon size={21} strokeWidth={1.8} className="shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname()
  const [user, setUser] = useState<{
    id?: string | number
    name?: string
    email?: string
    role?: string
    category?: string
  } | null>(null)

  useEffect(() => {
    let active = true
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (active && data.authenticated && data.user) {
            setUser(data.user)
          }
        }
      } catch {
        // Unauthenticated or network issue
      }
    }
    fetchUser()
    return () => {
      active = false
    }
  }, [path])

  const isActive = (h: string) => {
    if (h === '/assessment') {
      return path.startsWith('/assessment') || path.startsWith('/doctor/dashboard') || path.startsWith('/nurse/dashboard')
    }
    if (h === '/') {
      return path === '/' || path.startsWith('/assessment')
    }
    return path.startsWith(h)
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }
  return (
    <>
      {open && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col overflow-y-auto bg-white border-r border-slate-200 px-5 pt-[25px] pb-6 shadow-xs transition-transform duration-300 lg:translate-x-0 [@media(min-height:940px)]:pb-[52px] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative mb-[36px] flex items-start justify-between pl-[10px]">
          <Link href="/" onClick={onClose} className="flex items-center gap-[15px]">
            <GenoBridgeLogo />
            <span>
              <span className="flex items-end text-[24px] leading-none font-extrabold tracking-[-0.02em] text-slate-900">
                GENOBRIDGE
                <span className="mb-[5px] ml-[6px] h-[7px] w-[7px] rounded-full bg-slate-900 shadow-xs" />
              </span>
              <span className="mt-[6px] block text-[12px] font-semibold text-slate-500">
                Clinical Decision Support
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav aria-label="Main navigation" className="relative space-y-1">
          {NAV.map((n) => (
            <Item
              key={n.href}
              {...n}
              active={isActive(n.href)}
              onNavigate={onClose}
            />
          ))}
        </nav>
        <div className="relative mt-[17px] h-px shrink-0 bg-slate-200" />
        <p className="relative mt-[18px] mb-2 pl-[22px] text-[10.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">
          Tools
        </p>
        <nav aria-label="Tools" className="relative space-y-1">
          {TOOLS.map((n) => (
            <Item key={n.href} {...n} compact active={isActive(n.href)} onNavigate={onClose} />
          ))}
        </nav>
        {/* User Account & Security Card */}
        <div className="relative mt-auto pt-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs">
                {computeInitials(user?.name, user?.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.name || 'Dr. Attending Clinician'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="truncate text-[10.5px] font-medium text-slate-500">
                    {user?.category === 'nurse' || user?.role === 'nurse' ? 'Staff Nurse' : 'Attending OB/GYN'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/80 text-[11px]">
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-950 transition shadow-2xs"
              >
                <User size={13} className="text-slate-500" />
                <span>Account</span>
              </Link>
              <Link
                href="/account#password"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-950 transition shadow-2xs"
              >
                <KeyRound size={13} className="text-slate-500" />
                <span>Password</span>
              </Link>
            </div>

            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-200/80 text-[10.5px]">
              <Link
                href="/forgot-password"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-900 font-medium hover:underline flex items-center gap-1"
              >
                <ShieldCheck size={12} />
                <span>Recovery</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-rose-600 hover:text-rose-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative pt-3">
          <Link
            href="/safety"
            onClick={onClose}
            className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-xs transition duration-300 hover:border-slate-300"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={18}
                strokeWidth={2}
                className="text-slate-900 shrink-0"
              />
              <p className="text-[12px] font-bold text-slate-900">
                Evidence-Based CDS
              </p>
            </div>
            <p className="mt-1 text-[10.5px] text-slate-500 line-clamp-1">
              FOGSI · ACOG · ACMG · ASRM · NCCN
            </p>
            <span className="sr-only">Open Safety &amp; Setup</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
