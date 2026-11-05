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
  { icon: Dna, tone: 'bg-[#033424] text-[#00e5ce] border border-[#0e5c3e]' },
  { icon: Users, tone: 'bg-[#062c38] text-[#38d8f0] border border-[#12586e]' },
  { icon: Bean, tone: 'bg-[#2b172a] text-[#f472b6] border border-[#5c244f]' },
  { icon: FamilyTree, tone: 'bg-[#2e1d0c] text-[#fbbf24] border border-[#6b4217]' },
  { icon: UltrasoundScan, tone: 'bg-[#0d233a] text-[#60a5fa] border border-[#1e4976]' },
  { icon: ClipboardPlus, tone: 'bg-[#033424] text-[#34d399] border border-[#0e5c3e]' },
]

/** Sentence-case for display only (acronyms kept); stored pathway titles are unchanged. */
function sentenceCase(title: string) {
  return title
    .split(' ')
    .map((w, i) => (i === 0 || /^[A-Z0-9]{2,}$/.test(w) ? w : w.toLowerCase()))
    .join(' ')
}

const pill =
  'inline-flex h-[34px] shrink-0 items-center gap-2.5 rounded-full px-5 text-[13px] font-bold transition duration-200'
const pillPrimary = `${pill} bg-[linear-gradient(180deg,#1db342_0%,#0c7f2e_52%,#04561c_100%)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_8px_16px_-8px_rgb(4_86_28/0.7)] hover:brightness-110`
const pillOutline = `${pill} border border-[#0e4331] bg-[#032a1f] text-white shadow-sm hover:border-[#00e5ce]/60 hover:bg-[#063825] hover:text-[#00e5ce]`

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
  const featured = index === 0
  const title = sentenceCase(pathway.title)
  const surface = featured
    ? 'border-2 border-[#10b981] bg-[linear-gradient(165deg,#032b1f_35%,#011912_100%)] shadow-[0_0_0_2px_rgb(16_185_129/0.2),0_16px_32px_-20px_rgb(0_0_0/0.8)] text-white'
    : 'border border-[#0e4331] bg-[#021f17] shadow-hx hover:border-[#10b981]/50 hover:bg-[#03261c] hover:shadow-hx-lift text-white'
  const tile = (
    <span
      className={`relative flex h-[45px] w-[57px] shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      <Icon size={24} strokeWidth={1.8} />
    </span>
  )
  const guidelines = (
    <span className="flex items-center gap-[13px] text-[13px] font-medium text-slate-300">
      <BookOpen size={18} strokeWidth={1.7} className="text-[#00e5ce]" />
      {pathway.guidelines}
    </span>
  )
  const cta = (
    <Link href={`/assessment/${pathway.slug}`} className={featured ? pillPrimary : pillOutline}>
      Start assessment
      <ArrowRight
        size={16}
        strokeWidth={2}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  )

  if (layout === 'list') {
    return (
      <article
        className={`group relative flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[14px] py-4 pr-4 pl-5 transition duration-300 ${surface}`}
      >
        {tile}
        <div className="min-w-[220px] flex-1">
          <h3 className="text-[16px] leading-snug font-bold tracking-[-0.01em] text-white">
            {title}
          </h3>
          <p className="mt-1 text-[13px] leading-[18px] text-slate-300">{pathway.description}</p>
        </div>
        <span className="hidden lg:block">{guidelines}</span>
        {cta}
      </article>
    )
  }

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[14px] pt-[13px] pr-4 pb-3 pl-[26px] transition duration-300 hover:-translate-y-0.5 ${surface}`}
    >
      <CardArt index={index} />
      {tile}
      <h3 className="relative mt-[11px] text-[17px] leading-[22px] font-bold tracking-[-0.01em] text-white">
        {title}
      </h3>
      <p className="relative mt-[6px] max-w-[285px] text-[13px] leading-[17px] text-slate-300">
        {pathway.description}
      </p>
      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 pt-[27px]">
        {guidelines}
        {cta}
      </div>
    </article>
  )
}
