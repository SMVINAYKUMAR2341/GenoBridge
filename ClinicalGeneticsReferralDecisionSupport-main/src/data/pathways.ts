import { CLINICAL_INTAKE_FIELDS, type InputField } from '@/lib/form-fields'
import type { PathwaySlug } from '@/lib/decision-engine'

export type FieldDef = InputField & { name: string }
export type Pathway = {
  slug: PathwaySlug
  title: string
  short?: string
  description: string
  guidelines: string
  fields: FieldDef[]
}
const catalog: Omit<Pathway, 'fields'>[] = [
  {
    slug: 'hereditary-cancer-risk',
    title: 'Hereditary cancer risk',
    short: 'CANCER',
    description:
      'BRCA1/2, Lynch, HBOC — family/personal cancer history.',
    guidelines: 'ACOG No. 793 · NCCN v2.2024',
  },
  {
    slug: 'preconception-carrier-screening',
    title: 'Preconception carrier screening',
    short: 'CARRIER',
    description:
      'Ethnicity, consanguinity, known carrier status.',
    guidelines: 'ACOG No. 691 · ACMG Tier 3 · FOGSI',
  },
  {
    slug: 'nipt-results',
    title: 'NIPT results interpretation',
    short: 'NIPT',
    description:
      'High-risk, discordant, or no-call cfDNA screens.',
    guidelines: 'ACOG PB 226 · SMFM Consensus',
  },
  {
    slug: 'abnormal-ultrasound-findings',
    title: 'Abnormal ultrasound findings',
    short: 'ULTRASOUND',
    description:
      'Structural anomalies or multiple soft markers.',
    guidelines: 'ACOG PB 175 · ISUOG Standards',
  },
  {
    slug: 'infertility-recurrent-pregnancy-loss',
    title: 'Infertility / recurrent pregnancy loss',
    short: 'RPL',
    description:
      'Chromosomal or genetic causes of RPL and infertility.',
    guidelines: 'ASRM 2024 · ACOG PB 200',
  },
  {
    slug: 'positive-family-history',
    title: 'Positive family history of genetic disorder',
    short: 'FAMILY HX',
    description:
      'Non-cancer heritable conditions surfaced on history-taking.',
    guidelines: 'FOGSI GCPR · ACMG Guidelines',
  },
]
export const PATHWAYS: Pathway[] = catalog.map((pathway) => ({
  ...pathway,
  fields: (CLINICAL_INTAKE_FIELDS[pathway.slug] ?? []).map((field) => {
    const { showIf, ...serializable } = field
    return { ...serializable, name: field.key }
  }),
}))
export const pathwayBySlug = (slug: string) => PATHWAYS.find((pathway) => pathway.slug === slug)
