import Link from 'next/link'
import { Calculator, ShieldAlert } from 'lucide-react'
import { btnGhost, card, PageHeader } from '@/components/ui/Primitives'

export default function CalculatorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clinical tools"
        title="Risk calculator"
        subtitle="No validated patient-specific risk model is provisioned in this workspace. A referral decision is not a numerical probability of disease."
      />
      <section className={`${card} p-7`}>
        <Calculator size={28} className="text-hx-emerald" />
        <h2 className="mt-5 text-xl font-bold text-hx-ink">
          Numerical risk estimation is unavailable
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-hx-slate">
          There is no configured, versioned, clinically validated calculator with an approved
          population, inputs, calibration, or source license. This page does not invent risk scores,
          cutoffs, sensitivity, or estimated benefit.
        </p>
        <div
          role="note"
          className="mt-5 flex items-start gap-3 rounded-xl border border-[#0e5c3e] bg-[#033424] p-4 text-sm text-[#6ee7b7]"
        >
          <ShieldAlert size={19} className="shrink-0 text-[#00e5ce]" />
          <p>
            Use the structured assessment workflow for reviewer-governed referral support, subject
            to its clinical-preview limitations. Saved drafts and finalized decisions can be
            inspected in the workspace; they are not a validated risk calculator.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/saved" className={btnGhost}>
            Resume saved assessments
          </Link>
          <Link href="/guidelines" className={btnGhost}>
            Inspect governed criteria
          </Link>
          <Link href="/safety" className={btnGhost}>
            Safety & readiness
          </Link>
        </div>
      </section>
    </>
  )
}
