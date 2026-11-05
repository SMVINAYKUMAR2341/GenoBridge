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
  ShieldCheck,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import { HelixLogo, SidebarWave } from '@/components/ui/Graphics'
import { ChartBars } from '@/components/ui/Icons'

type NavLink = { href: string; label: string; icon: LucideIcon }

export const NAV: NavLink[] = [
  { href: '/assessment', label: 'New Assessment', icon: House },
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
const ASSURANCES = ['Guideline aligned (ACOG, NCCN)', 'Transparent & traceable', 'Specialist-reviewed']

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
      className={`flex items-center gap-[29px] rounded-xl pl-[21px] text-[15px] transition duration-200 ${compact ? 'h-[42px]' : 'h-[47px]'} ${active ? 'bg-[linear-gradient(90deg,#f1fff2_0%,#d6fbdd_50%,#a9f6b9_100%)] font-bold text-[#0b1f17] shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_0_26px_-4px_rgb(74_222_128/0.5)]' : 'font-medium text-white/90 hover:bg-white/[0.06] hover:text-white'} ${className}`}
    >
      <Icon size={22} strokeWidth={1.7} className="shrink-0" />
      {label}
    </Link>
  )
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname()
  const isActive = (h: string) =>
    h === '/' ? path === '/' || path.startsWith('/assessment') : path.startsWith(h)
  return (
    <>
      {open && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col overflow-y-auto bg-hx-sidebar px-5 pt-[25px] pb-6 shadow-[inset_-1px_0_0_rgb(0_0_0/0.35)] transition-transform duration-300 lg:translate-x-0 [@media(min-height:940px)]:pb-[52px] ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(18rem_12rem_at_35%_100%,rgb(22_163_74/0.2),transparent_70%)]"
        />
        <div className="relative mb-[52px] flex items-start justify-between pl-[10px]">
          <Link href="/" onClick={onClose} className="flex items-center gap-[15px]">
            <HelixLogo />
            <span>
              <span className="flex items-end text-[30px] leading-none font-extrabold tracking-[-0.02em] text-white">
                Helix
                <span className="mb-[5px] ml-[6px] h-[7px] w-[7px] rounded-full bg-[#22d34a] shadow-[0_0_8px_rgb(34_211_74/0.8)]" />
              </span>
              <span className="mt-[10px] block text-[13.5px] font-medium text-white/90">
                Clinical Decision Support
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-white hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav aria-label="Main navigation" className="relative">
          {NAV.map((n, i) => (
            <Item
              key={n.href}
              {...n}
              active={isActive(n.href)}
              className={i === 0 ? 'mb-[13px]' : ''}
              onNavigate={onClose}
            />
          ))}
        </nav>
        <div className="relative mt-[17px] h-px shrink-0 bg-white/10" />
        <p className="relative mt-[21px] mb-2 pl-[22px] text-[10.5px] font-bold tracking-[0.12em] text-white/85 uppercase">
          Tools
        </p>
        <nav aria-label="Tools" className="relative">
          {TOOLS.map((n) => (
            <Item key={n.href} {...n} compact active={isActive(n.href)} onNavigate={onClose} />
          ))}
        </nav>
        <div className="relative mt-auto pt-6">
          <Link
            href="/safety"
            onClick={onClose}
            className="group relative block overflow-hidden rounded-2xl border border-[#3ccf6d]/40 bg-[linear-gradient(160deg,#034128_0%,#022e1f_42%,#03482a_100%)] px-5 pt-[19px] pb-[61px] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_24px_40px_-24px_rgb(0_0_0/0.7)] transition duration-300 hover:border-[#4ade80]/70"
          >
            <SidebarWave className="absolute inset-x-0 bottom-0 h-[110px] w-full" />
            <ShieldCheck
              size={38}
              strokeWidth={1.6}
              className="relative text-[#96fbac] drop-shadow-[0_0_10px_rgb(134_239_172/0.45)]"
            />
            <p className="relative mt-2.5 text-[21px] leading-[26px] font-extrabold tracking-[-0.01em] text-white">
              Evidence-based genetic decision support
            </p>
            <ul className="relative mt-4 space-y-[9.5px] text-[12.5px] text-white/85">
              {ASSURANCES.map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1ccf3c] shadow-[0_0_10px_rgb(34_197_94/0.5)]">
                    <Check size={12} strokeWidth={3.2} className="text-white" />
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
