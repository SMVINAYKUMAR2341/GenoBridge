import Link from 'next/link'
import {
  ArrowRight,
  Bean,
  BookOpen,
  ClipboardPlus,
  Dna,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Pathway } from '@/data/pathways'
import { CardArt } from './Graphics'
import { FamilyTree, UltrasoundScan } from './Icons'

const TILES: { icon: LucideIcon; tone: string }[] = [
  { icon: Dna, tone: 'bg-slate-100 text-slate-900 border border-slate-200' },
  { icon: Users, tone: 'bg-slate-100 text-slate-900 border border-slate-200' },
  { icon: Bean, tone: 'bg-slate-100 text-slate-900 border border-slate-200' },
  { icon: FamilyTree, tone: 'bg-slate-100 text-slate-900 border border-slate-200' },
  { icon: UltrasoundScan, tone: 'bg-slate-100 text-slate-900 border border-slate-200' },
  { icon: ClipboardPlus, tone: 'bg-slate-100 text-slate-900 border border-slate-200' },
]

/** Sentence-case for display only (acronyms kept); stored pathway titles are unchanged. */
function sentenceCase(title: string) {
  return title
    .split(' ')
    .map((w, i) => (i === 0 || /^[A-Z0-9]{2,}$/.test(w) ? w : w.toLowerCase()))
    .join(' ')
}

const pill =
  'inline-flex h-[36px] shrink-0 items-center gap-2 rounded-xl px-4 text-[13px] font-bold transition duration-200'
const pillPrimary = `${pill} bg-slate-900 text-white hover:bg-slate-800 shadow-xs`
const pillOutline = `${pill} border border-slate-300 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-400`

export default function PathwayCard({
  pathway,
  index,
  layout = 'grid',
}: {
  pathway: Pathway
  index: number
  layout?: 'grid' | 'list'
}) {
  const { icon: Icon, tone } = TILES[index % TILES.length]
  const title = sentenceCase(pathway.title)
  const surface = 'border border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm text-slate-900'
  const tile = (
    <span
      className={`relative flex h-[45px] w-[57px] shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      <Icon size={24} strokeWidth={1.8} />
    </span>
  )
  const guidelines = (
    <span className="flex items-center gap-[10px] text-[13px] font-medium text-slate-500">
      <BookOpen size={16} strokeWidth={1.7} className="text-slate-700" />
      {pathway.guidelines}
    </span>
  )
  const cta = (
    <Link href={`/assessment/${pathway.slug}`} className={pillPrimary}>
      Start assessment
      <ArrowRight
        size={15}
        strokeWidth={2}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  )

  if (layout === 'list') {
    return (
      <article
        className={`group relative flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[14px] py-4 pr-4 pl-5 transition duration-200 ${surface}`}
      >
        {tile}
        <div className="min-w-[220px] flex-1">
          <h3 className="text-[16px] leading-snug font-bold tracking-[-0.01em] text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-[13px] leading-[18px] text-slate-600">{pathway.description}</p>
        </div>
        <span className="hidden lg:block">{guidelines}</span>
        {cta}
      </article>
    )
  }

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[14px] pt-[15px] pr-4 pb-4 pl-[24px] transition duration-200 hover:-translate-y-0.5 ${surface}`}
    >
      {tile}
      <h3 className="relative mt-[12px] text-[17px] leading-[22px] font-bold tracking-[-0.01em] text-slate-900">
        {title}
      </h3>
      <p className="relative mt-[6px] max-w-[285px] text-[13px] leading-[18px] text-slate-600">
        {pathway.description}
      </p>
      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 pt-[24px]">
        {guidelines}
        {cta}
      </div>
    </article>
  )
}
