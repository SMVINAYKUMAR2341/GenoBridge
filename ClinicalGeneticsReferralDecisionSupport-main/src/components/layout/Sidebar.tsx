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
import { GenoBridgeLogo, SidebarWave } from '@/components/ui/Graphics'
import { ChartBars, FamilyTree } from '@/components/ui/Icons'

type NavLink = { href: string; label: string; icon: LucideIcon }

// Exact 6 core items consolidated for GenoBridge clinical workflow:
// 1. New Assessment, 2. Pedigree & ANC, 3. Referrals, 4. Patient History, 5. Reports & Analytics, 6. Staff & Account
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
      className={`flex items-center gap-[24px] rounded-xl pl-[21px] text-[15px] transition duration-200 ${compact ? 'h-[44px]' : 'h-[48px]'} ${active ? 'bg-[linear-gradient(90deg,#f1fff2_0%,#d6fbdd_50%,#a9f6b9_100%)] font-bold text-[#0b1f17] shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_0_26px_-4px_rgb(74_222_128/0.5)]' : 'font-medium text-white/90 hover:bg-white/[0.06] hover:text-white'} ${className}`}
    >
      <Icon size={22} strokeWidth={1.8} className="shrink-0" />
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col overflow-y-auto bg-hx-sidebar px-5 pt-[22px] pb-6 shadow-[inset_-1px_0_0_rgb(0_0_0/0.35)] transition-transform duration-300 ${
          collapsed ? '-translate-x-full lg:-translate-x-full' : 'translate-x-0 lg:translate-x-0'
        } ${open ? '!translate-x-0' : ''}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(18rem_12rem_at_35%_100%,rgb(22_163_74/0.2),transparent_70%)]"
        />
        
        {/* Brand Header & Collapse Toggles */}
        <div className="relative mb-[36px] flex items-center justify-between pl-[6px]">
          <Link href="/" onClick={onClose} className="flex items-center gap-[12px]">
            <GenoBridgeLogo />
            <span>
              <span className="flex items-end text-[26px] leading-none font-extrabold tracking-[-0.02em] text-white">
                GENOBRIDGE
                <span className="mb-[4px] ml-[5px] h-[6px] w-[6px] rounded-full bg-[#22d34a] shadow-[0_0_8px_rgb(34_211_74/0.8)]" />
              </span>
              <span className="mt-[6px] block text-[12px] font-medium text-white/80">
                Clinical Decision Support
              </span>
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar for full screen workspace"
                className="hidden lg:flex items-center justify-center rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-lg p-1.5 text-white hover:bg-white/10 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Core 6 Histone-Aligned Navigation Items */}
        <nav aria-label="Main navigation" className="relative space-y-1.5">
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
        <div className="relative mt-5 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between px-2 text-[11px] font-medium text-white/60">
            <Link href="/guidelines" onClick={onClose} className="hover:text-[#00D8C3] transition">
              Guidelines
            </Link>
            <span>·</span>
            <Link href="/calculator" onClick={onClose} className="hover:text-[#00D8C3] transition">
              Risk Calc
            </Link>
            <span>·</span>
            <Link href="/knowledge" onClick={onClose} className="hover:text-[#00D8C3] transition">
              Knowledge
            </Link>
            <span>·</span>
            <Link href="/saved" onClick={onClose} className="hover:text-[#00D8C3] transition">
              Saved
            </Link>
          </div>
        </div>

        {/* Evidence Card: GenoBridge Emerald Aesthetic (Image 2) */}
        <div className="relative mt-auto pt-5">
          <Link
            href="/safety"
            onClick={onClose}
            className="group relative block overflow-hidden rounded-2xl border border-[#3ccf6d]/40 bg-[linear-gradient(160deg,#034128_0%,#022e1f_42%,#03482a_100%)] px-4 pt-[18px] pb-[44px] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_24px_40px_-24px_rgb(0_0_0/0.7)] transition duration-300 hover:border-[#4ade80]/70"
          >
            <SidebarWave className="absolute inset-x-0 bottom-0 h-[90px] w-full" />
            <ShieldCheck
              size={34}
              strokeWidth={1.6}
              className="relative text-[#96fbac] drop-shadow-[0_0_10px_rgb(134_239_172/0.45)]"
            />
            <p className="relative mt-2 text-[18px] leading-[23px] font-extrabold tracking-[-0.01em] text-white">
              Evidence-based genetic decision support
            </p>
            <ul className="relative mt-3 space-y-[8px] text-[12px] text-white/85">
              {ASSURANCES.map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1ccf3c] shadow-[0_0_10px_rgb(34_197_94/0.5)]">
                    <Check size={11} strokeWidth={3.2} className="text-white" />
                  </span>
                  <span className="leading-tight">{t}</span>
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
