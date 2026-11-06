import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Dna,
  Users,
  Baby,
  Waves,
  Activity,
  GitBranch,
  type LucideIcon,
} from 'lucide-react'
import type { Pathway } from '@/data/pathways'
import { FamilyTree, UltrasoundScan } from './Icons'

const ICONS_MAP: Record<string, { icon: LucideIcon; tone: string }> = {
  'hereditary-cancer-risk': {
    icon: Dna,
    tone: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
  'preconception-carrier-screening': {
    icon: Users,
    tone: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  },
  'nipt-results': {
    icon: Baby,
    tone: 'bg-pink-500/15 text-pink-300 border border-pink-500/30',
  },
  'abnormal-ultrasound-findings': {
    icon: UltrasoundScan,
    tone: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  },
  'infertility-recurrent-pregnancy-loss': {
    icon: Activity,
    tone: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  'positive-family-history': {
    icon: FamilyTree,
    tone: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
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
    tone: 'bg-[#00D8C3]/15 text-[#00D8C3] border border-[#00D8C3]/30',
  }
  const Icon = meta.icon

  const surface =
    'border border-[#164C60] bg-[#031525] hover:border-[#00D8C3] hover:shadow-lg hover:shadow-[#00D8C3]/10 text-white transition-all duration-200 group'

  const tile = (
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.tone} group-hover:scale-105 transition-transform`}>
      <Icon size={22} strokeWidth={1.8} />
    </div>
  )

  const shortTag = pathway.short ? (
    <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#8aaec3] px-2.5 py-1 rounded-full bg-[#08243B] border border-[#164C60] group-hover:border-[#00D8C3]/50 group-hover:text-[#00D8C3] transition-colors">
      {pathway.short}
    </span>
  ) : null

  const guidelines = (
    <div className="flex items-center gap-2 text-xs font-medium text-[#8aaec3]">
      <BookOpen size={14} className="text-[#00D8C3] shrink-0" />
      <span className="truncate">{pathway.guidelines}</span>
    </div>
  )

  const cta = (
    <Link
      href={`/assessment/${pathway.slug}`}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00D8C3] group-hover:text-white transition-colors"
    >
      <span>Start assessment</span>
      <ArrowRight
        size={14}
        className="transition-transform duration-200 group-hover:translate-x-1 text-[#00D8C3]"
      />
    </Link>
  )

  if (layout === 'list') {
    return (
      <article
        className={`relative flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl p-5 ${surface}`}
      >
        {tile}
        <div className="min-w-[240px] flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white group-hover:text-[#00D8C3] transition-colors">
              {pathway.title}
            </h3>
            {shortTag}
          </div>
          <p className="text-xs text-[#A9BDCA] leading-relaxed">{pathway.description}</p>
        </div>
        <div className="hidden lg:block">{guidelines}</div>
        <div className="ml-auto">{cta}</div>
      </article>
    )
  }

  return (
    <article
      className={`relative flex flex-col justify-between rounded-2xl p-6 ${surface}`}
    >
      <div className="space-y-4">
        {/* Top Header Row with Icon and Category Tag */}
        <div className="flex items-center justify-between">
          {tile}
          {shortTag}
        </div>

        {/* Title and Histone Clinical Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#00D8C3] transition-colors">
            {pathway.title}
          </h3>
          <p className="text-xs text-[#A9BDCA] leading-relaxed min-h-[38px]">
            {pathway.description}
          </p>
        </div>
      </div>

      {/* Bottom Footer with Guideline and Start Link */}
      <div className="pt-5 mt-4 border-t border-[#164C60]/60 flex items-center justify-between gap-3">
        {guidelines}
        {cta}
      </div>
    </article>
  )
}
