export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { BookOpen, ShieldAlert } from 'lucide-react'
import { ReferenceCatalog } from '@/components/clinical/GovernancePanel'
import { btnGhost, card, PageHeader } from '@/components/ui/Primitives'
import { KNOWLEDGE } from '@/data/content'

export default function KnowledgePage() {
  return (
    <>
      <PageHeader
        eyebrow="Learning resources"
        title="Knowledge base"
        subtitle="General terminology and reference-discovery metadata. This is not an approved clinical protocol or a substitute for specialist advice."
      />
      <div
        role="note"
        className="mb-6 flex items-start gap-3 rounded-xl border border-hx-warn-line bg-hx-warn-bg p-5 text-sm text-hx-warn"
      >
        <ShieldAlert size={20} className="shrink-0" />
        <p>
          Educational preview only. Terminology has not been independently clinically validated for
          this deployment. Do not use this catalog to infer clinical eligibility, current guideline
          recommendations, or patient-specific risk.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {KNOWLEDGE.map((item) => (
          <section key={item.term} className={`${card} p-5`}>
            <BookOpen size={19} className="text-hx-emerald" />
            <h2 className="mt-3 font-bold text-hx-ink">{item.term}</h2>
            <p className="mt-2 text-sm leading-relaxed text-hx-slate">{item.body}</p>
          </section>
        ))}
      </div>
      <ReferenceCatalog />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/guidelines" className={btnGhost}>
          Open governed source records
        </Link>
        <Link href="/safety" className={btnGhost}>
          Review safety limitations
        </Link>
      </div>
    </>
  )
}
