import { CLINICAL_INTAKE_FIELDS, type InputField } from '@/lib/form-fields'
import type { PathwaySlug } from '@/lib/decision-engine'

export type FieldDef = InputField & { name: string }
export type Pathway = {
  slug: PathwaySlug
  title: string
  description: string
  guidelines: string
  fields: FieldDef[]
}
const catalog: Omit<Pathway, 'fields'>[] = [
  {
    slug: 'hereditary-cancer-risk',
    title: 'Hereditary Cancer Risk',
    description:
      'Record personal cancer history, tumour and germline reports, family history and care-planning context.',
    guidelines: 'Governed cancer genetics criteria',
  },
  {
    slug: 'preconception-carrier-screening',
    title: 'Preconception Carrier Screening',
    description:
      'Document patient and reproductive partner screening, exact variants, test limitations and reproductive context.',
    guidelines: 'Governed carrier-screening criteria',
  },
  {
    slug: 'nipt-results',
    title: 'NIPT Results',
    description:
      'Record prenatal screening results, no-call details, pregnancy context and diagnostic investigations without inferring risk.',
    guidelines: 'Governed prenatal screening criteria',
  },
  {
    slug: 'abnormal-ultrasound-findings',
    title: 'Abnormal Ultrasound Findings',
    description:
      'Document exact ultrasound observations, raw measurements, prior screening and diagnostic reports.',
    guidelines: 'Governed fetal imaging criteria',
  },
  {
    slug: 'infertility-recurrent-pregnancy-loss',
    title: 'Infertility & Recurrent Pregnancy Loss',
    description:
      'Use independent infertility and pregnancy-loss histories, with shared genetic and reproductive context.',
    guidelines: 'Governed reproductive genetics criteria',
  },
  {
    slug: 'positive-family-history',
    title: 'Positive Family History',
    description:
      'Record affected relatives, lineage, documented diagnoses and variants, and limitations in available evidence.',
    guidelines: 'Governed family-history criteria',
  },
]
export const PATHWAYS: Pathway[] = catalog.map((pathway) => ({
  ...pathway,
  fields: CLINICAL_INTAKE_FIELDS[pathway.slug].map((field) => ({ ...field, name: field.key })),
}))
export const pathwayBySlug = (slug: string) => PATHWAYS.find((pathway) => pathway.slug === slug)
