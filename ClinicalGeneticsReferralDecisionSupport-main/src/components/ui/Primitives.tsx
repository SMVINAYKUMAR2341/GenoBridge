import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { Priority } from '@/components/providers/AssessmentsProvider'

export const card = 'rounded-[14px] border border-[#0e4331] bg-[#021f17] shadow-hx text-white'
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(180deg,#1db342_0%,#0c7f2e_52%,#04561c_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_8px_18px_-8px_rgb(4_86_28/0.7)] transition duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100'
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#0e4331] bg-[#032a1f] px-5 py-2.5 text-sm font-bold text-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition duration-200 hover:-translate-y-px hover:border-hx-accent/60 hover:bg-[#063825] active:translate-y-0'
export const inputCls =
  'w-full rounded-xl border border-[#0e4331] bg-[#032a1f] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none transition hover:border-[#10b981] focus:border-[#00e5ce] focus:bg-[#033426] focus:ring-4 focus:ring-[#00e5ce]/20 [&>option]:bg-[#032a1f] [&>option]:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11.5px] font-semibold tracking-[0.3em] text-hx-ink uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-[38px] leading-[1.08] font-extrabold tracking-[-0.025em] text-hx-ink">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-hx-slate">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
export function PreviewBanner({ className = 'mb-6' }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex min-h-[50px] items-center gap-[22px] rounded-[10px] border border-hx-warn-line bg-hx-warn-bg px-[26px] py-3 text-[13px] text-hx-warn ${className}`}
    >
      <TriangleAlert size={19} strokeWidth={1.9} className="shrink-0 text-[#a4471a]" />
      <p>
        <strong className="font-bold">Clinical preview</strong> · NOT YET CLINICALLY VALIDATED. Use
        simulated inputs only until specialist approval and HIPAA hosting review are complete.
      </p>
    </div>
  )
}
const pri: Record<Priority, string> = {
  routine: 'bg-hx-mint text-hx-emerald ring-[#cdeed6]',
  priority: 'bg-hx-warn-bg text-hx-warn ring-hx-warn-line',
  urgent: 'bg-red-50 text-red-700 ring-red-100',
}
export function PriorityBadge({ value }: { value: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${pri[value]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  )
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#0e4331] bg-[#021f17] p-12 text-center text-white shadow-hx">
      <p className="font-bold text-base text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">{text}</p>
    </div>
  )
}
