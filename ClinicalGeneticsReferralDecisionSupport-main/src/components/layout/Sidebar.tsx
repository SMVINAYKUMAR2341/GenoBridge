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
  Layers,
  Network,
  ShieldCheck,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
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
  const isActive = (h: string) => {
    if (h === '/assessment') {
      return path.startsWith('/assessment') || path.startsWith('/doctor/dashboard') || path.startsWith('/nurse/dashboard')
    }
    if (h === '/') {
      return path === '/' || path.startsWith('/assessment')
    }
    return path.startsWith(h)
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
        <div className="relative mt-auto pt-6">
          <Link
            href="/safety"
            onClick={onClose}
            className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-5 pt-[19px] pb-[28px] shadow-xs transition duration-300 hover:border-slate-300"
          >
            <ShieldCheck
              size={32}
              strokeWidth={1.8}
              className="relative text-slate-900"
            />
            <p className="relative mt-2 text-[16px] leading-[22px] font-extrabold tracking-[-0.01em] text-slate-900">
              Evidence-based clinical decision support
            </p>
            <ul className="relative mt-3 space-y-[8px] text-[11px] text-slate-600">
              {ASSURANCES.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <span className="sr-only">Open Safety &amp; Setup</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
