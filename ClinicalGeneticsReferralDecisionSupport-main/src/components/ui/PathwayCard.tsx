import Link from 'next/link'
import {
  ArrowRight,
  Dna,
  Users,
  Baby,
  Waves,
  Activity,
  GitBranch,
  type LucideIcon,
} from 'lucide-react'
import type { Pathway } from '@/data/pathways'

const ICONS_MAP: Record<string, { icon: LucideIcon; category: string; shortDesc: string }> = {
  'hereditary-cancer-risk': {
    icon: Dna,
    category: 'CANCER',
    shortDesc: 'BRCA1/2, Lynch, HBOC — family/personal cancer history.',
  },
  'preconception-carrier-screening': {
    icon: Users,
    category: 'CARRIER',
    shortDesc: 'Ethnicity, consanguinity, known carrier status.',
  },
  'nipt-results': {
    icon: Activity,
    category: 'NIPT',
    shortDesc: 'High-risk, discordant, or no-call cfDNA screens.',
  },
  'abnormal-ultrasound-findings': {
    icon: Waves,
    category: 'ULTRASOUND',
    shortDesc: 'Structural anomalies or multiple soft markers.',
  },
  'infertility-recurrent-pregnancy-loss': {
    icon: Baby,
    category: 'RPL',
    shortDesc: 'Chromosomal or genetic causes of RPL and infertility.',
  },
  'positive-family-history': {
    icon: GitBranch,
    category: 'FAMILY HX',
    shortDesc: 'Non-cancer heritable conditions surfaced on history-taking.',
  },
}

export default function PathwayCard({
  pathway,
  index,
  layout = 'grid',
}: {
  pathway: Pathway
  index: number
  layout?: 'grid' | 'list'
}) {
  const meta = ICONS_MAP[pathway.slug] || {
    icon: Dna,
    category: 'PATHWAY',
    shortDesc: pathway.description,
  }
  const Icon = meta.icon

  return (
    <Link
      href={`/assessment/${pathway.slug}`}
      data-testid={`pathway-card-${pathway.slug}`}
      className="group text-left rounded-lg border border-slate-200 bg-white p-6 hover:border-[#b8125d] hover:shadow-md transition-all duration-150 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-md bg-[#fce7f3] text-[#b8125d] group-hover:bg-[#b8125d] group-hover:text-white flex items-center justify-center transition-colors duration-150">
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400 font-bold">
            {meta.category}
          </span>
        </div>
        <div className="mt-5 font-heading font-semibold text-xl leading-tight text-slate-900 group-hover:text-[#b8125d] transition-colors">
          {pathway.title}
        </div>
        <div className="mt-2 text-sm text-slate-600 leading-relaxed">
          {meta.shortDesc || pathway.description}
        </div>
      </div>
      <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-slate-900 group-hover:text-[#b8125d] transition-colors">
        <span>Start</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" />
      </div>
    </Link>
  )
}
