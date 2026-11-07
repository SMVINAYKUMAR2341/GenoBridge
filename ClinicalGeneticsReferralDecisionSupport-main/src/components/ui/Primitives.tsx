import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { Priority } from '@/components/providers/AssessmentsProvider'

export const card = 'rounded-[14px] border border-slate-200 bg-white shadow-xs text-slate-900'
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-slate-800 active:translate-y-0 disabled:opacity-50'
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-xs transition duration-200 hover:bg-slate-50 active:translate-y-0'
export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0'

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
  return null
}
const pri: Record<Priority, string> = {
  routine: 'bg-slate-100 text-slate-800 ring-slate-200',
  priority: 'bg-amber-50 text-amber-800 ring-amber-200',
  urgent: 'bg-red-50 text-red-800 ring-red-200',
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
    <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-900 shadow-xs">
      <p className="font-bold text-base text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">{text}</p>
    </div>
  )
}
