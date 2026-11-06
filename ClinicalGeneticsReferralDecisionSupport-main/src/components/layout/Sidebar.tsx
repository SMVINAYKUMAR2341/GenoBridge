'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftRight,
  Check,
  House,
  PanelLeftClose,
  ShieldCheck,
  User,
  UserCheck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ChartBars, FamilyTree } from '@/components/ui/Icons'

type NavLink = { href: string; label: string; icon: LucideIcon }

export const NAV: NavLink[] = [
  { href: '/assessment', label: 'New Assessment', icon: House },
  { href: '/pedigree', label: 'Pedigree & ANC', icon: FamilyTree },
  { href: '/referrals', label: 'Referrals', icon: ArrowLeftRight },
  { href: '/history', label: 'Patient History', icon: User },
  { href: '/analytics', label: 'Reports & Analytics', icon: ChartBars },
  { href: '/account', label: 'Staff & Account', icon: UserCheck },
]

const ASSURANCES = [
  'Guideline aligned (ACOG, NCCN, FOGSI, ACMG)',
  'Transparent & traceable',
  'Specialist-reviewed',
]

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
      className={`flex items-center gap-4 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 ${
        compact ? 'h-10' : 'h-11'
      } ${
        active
          ? 'bg-[#b8125d] text-white shadow-xs'
          : 'text-slate-700 hover:bg-[#fce7f3] hover:text-[#b8125d]'
      } ${className}`}
    >
      <Icon size={19} strokeWidth={2} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export default function Sidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  open: boolean
  onClose: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const path = usePathname()
  const isActive = (h: string) => {
    if (h === '/assessment') return path === '/' || path.startsWith('/assessment')
    if (h === '/pedigree') return path.startsWith('/pedigree') || path.startsWith('/anc')
    return path.startsWith(h)
  }

  return (
    <>
      {open && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col overflow-y-auto border-r border-slate-200 bg-white px-5 pt-5 pb-6 shadow-xs transition-transform duration-300 ${
          collapsed ? '-translate-x-full lg:-translate-x-full' : 'translate-x-0 lg:translate-x-0'
        } ${open ? '!translate-x-0' : ''}`}
      >
        {/* Brand Header */}
        <div className="relative mb-6 flex items-center justify-between pl-1">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b8125d] text-white font-extrabold text-sm shadow-sm">
              H
            </span>
            <div className="text-left leading-tight">
              <span className="block font-heading font-extrabold text-[18px] text-[#b8125d] tracking-tight">
                HistoNe
              </span>
              <span className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-slate-500">
                GENETICS DSS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar for full screen workspace"
                className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Core Navigation Items */}
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

        {/* Quick Clinical References */}
        <div className="relative mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-slate-500">
            <Link href="/guidelines" onClick={onClose} className="hover:text-[#b8125d] transition">
              Guidelines
            </Link>
            <span>·</span>
            <Link href="/calculator" onClick={onClose} className="hover:text-[#b8125d] transition">
              Risk Calc
            </Link>
            <span>·</span>
            <Link href="/knowledge" onClick={onClose} className="hover:text-[#b8125d] transition">
              Knowledge
            </Link>
            <span>·</span>
            <Link href="/saved" onClick={onClose} className="hover:text-[#b8125d] transition">
              Saved
            </Link>
          </div>
        </div>

        {/* Clinical Quality Assurance Card */}
        <div className="relative mt-auto pt-6">
          <div className="rounded-xl border border-rose-100 bg-[#fef2f2] p-4 text-slate-900 shadow-xs">
            <div className="flex items-center gap-2 text-[#b8125d] font-bold text-sm">
              <ShieldCheck size={20} />
              <span>Evidence-based decision support</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              {ASSURANCES.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#b8125d] text-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span className="leading-tight">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  )
}
