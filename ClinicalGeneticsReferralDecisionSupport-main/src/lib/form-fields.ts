import type { StructuredFormState } from './decision-engine'
import type { Patient } from '@/payload-types'

export type FormKey = string
export type InputField = {
  key: FormKey
  label: string
  hint?: string
  type: 'select' | 'text' | 'checkbox' | 'number' | 'textarea' | 'date' | 'bool' | 'multi'
  options?: [string, string][]
  section?: string
  subflow?: 'infertility' | 'rpl'
  required?: boolean
  legacy?: boolean
  step?: number
  min?: number
  default?: number | string | boolean
  showIf?: (inputs: StructuredFormState) => boolean
}

/** Original keys and option meanings are retained for backward compatibility with existing records. */
export const LEGACY_FORM_FIELDS: Record<string, InputField[]> = {
  'hereditary-cancer-risk': [
    {
      key: 'hcrPersonalCancer',
      label: 'Personal cancer history',
      type: 'select',
      options: [
        ['none', 'No personal cancer history'],
        ['active_surgical_planning', 'Active cancer — treatment / surgical planning'],
        ['prior_breast_ovarian_endometrial', 'Prior breast, ovarian, or endometrial cancer'],
      ],
    },
    {
      key: 'hcrKnownFamilialMutation',
      label: 'Known familial pathogenic variant',
      hint: 'For example, BRCA1/2 or a Lynch syndrome gene.',
      type: 'checkbox',
    },
    {
      key: 'hcrFirstDegreeEarlyBreastOrOvarian',
      label: 'Close relative with early breast or ovarian cancer',
      hint: 'First- or second-degree relative; breast cancer at ≤50 years.',
      type: 'checkbox',
    },
    {
      key: 'hcrMultipleRelativesOrPancreaticMaleBreast',
      label: 'Multiple affected relatives, pancreatic or male breast cancer',
      type: 'checkbox',
    },
    { key: 'hcrAshkenaziAncestry', label: 'Ashkenazi Jewish ancestry', type: 'checkbox' },
    {
      key: 'hcrLimitedFamilyOrSingleSecondDegree',
      label: 'Limited / uncertain family history',
      hint: 'Adoption, small family, or a single later-onset affected relative.',
      type: 'checkbox',
    },
    {
      key: 'hcrRelativeDetails',
      label: 'Pedigree-lite notes',
      hint: 'Relative, maternal / paternal lineage, diagnosis, age at diagnosis.',
      type: 'text',
    },
  ],
  'preconception-carrier-screening': [
    {
      key: 'pcsPatientStatus',
      label: 'Patient carrier screening result',
      type: 'select',
      options: [
        ['negative', 'Negative screen'],
        ['ar_carrier_positive', 'Autosomal recessive carrier'],
        ['xlinked_carrier_positive', 'X-linked carrier'],
        ['vus_or_mild_allele', 'VUS / mild or low-penetrance allele'],
      ],
    },
    {
      key: 'pcsPartnerStatus',
      label: 'Reproductive partner result',
      type: 'select',
      options: [
        ['not_applicable', 'Not applicable'],
        ['negative', 'Negative for the same condition'],
        ['concordant_positive', 'Carrier of the same condition'],
        ['pending_or_untested', 'Pending / not tested'],
      ],
    },
    { key: 'pcsIsPregnant', label: 'Patient is currently pregnant', type: 'checkbox' },
    { key: 'pcsGeneVariantText', label: 'Gene / variant and report details', type: 'text' },
  ],
  'nipt-results': [
    {
      key: 'niptFinding',
      label: 'Cell-free DNA screening result',
      type: 'select',
      options: [
        ['low_risk', 'Low-risk / negative'],
        ['high_risk_common_trisomy', 'High-risk trisomy 21, 18 or 13'],
        ['high_risk_sca_or_rat', 'High-risk sex chromosome / rare trisomy'],
        ['repeat_low_ff_or_microdeletion', 'Repeat low fetal fraction / microdeletion finding'],
        ['single_early_nocall', 'Single early no-call / low fetal fraction'],
      ],
    },
    { key: 'niptFetalFraction', label: 'Fetal fraction (%)', type: 'number' },
    {
      key: 'niptEstimatedPpv',
      label: 'Estimated positive predictive value (%)',
      type: 'number',
      hint: 'Optional. Use the laboratory report; do not infer from sensitivity.',
    },
    { key: 'niptGestationalWeeks', label: 'Gestational age at draw (weeks)', type: 'number' },
  ],
  'abnormal-ultrasound-findings': [
    {
      key: 'usFindingCategory',
      label: 'Primary ultrasound finding',
      type: 'select',
      options: [
        ['normal_scan', 'No abnormal finding'],
        ['major_structural_or_nt_ge_3', 'Major structural anomaly / increased NT'],
        ['multiple_soft_markers', 'Multiple soft markers'],
        ['isolated_high_lr_soft_marker_unscreened', 'Isolated higher-likelihood soft marker'],
        [
          'isolated_sua_utd_eif_with_neg_nipt',
          'Isolated SUA / UTD / EIF / CPC with low-risk cfDNA',
        ],
      ],
    },
    {
      key: 'usPriorScreening',
      label: 'Prior aneuploidy screening',
      type: 'select',
      options: [
        ['unscreened', 'Not screened'],
        ['low_risk_cfdna', 'Low-risk cfDNA'],
        ['high_risk_screen', 'High-risk screen'],
      ],
    },
    {
      key: 'usMeasurementNote',
      label: 'Findings and measurements',
      hint: 'Include NT / nuchal fold in mm, anatomy findings and gestational age.',
      type: 'text',
    },
  ],
  'infertility-recurrent-pregnancy-loss': [
    {
      key: 'rplClinicalLosses',
      label: 'Pregnancy loss history',
      type: 'select',
      options: [
        ['0_or_1', 'Zero or one clinical loss'],
        ['2_or_more_clinical', 'Two or more clinical losses'],
        ['biochemical_only', 'Recurrent biochemical losses only'],
      ],
    },
    {
      key: 'rplCytogenetics',
      label: 'Parental / products of conception cytogenetics',
      type: 'select',
      options: [
        ['none_or_normal', 'Not performed / normal'],
        [
          'parental_translocation_or_abnormal_poc',
          'Parental translocation or abnormal POC rearrangement',
        ],
      ],
    },
    {
      key: 'rplReproductiveFactor',
      label: 'Additional reproductive factors',
      type: 'select',
      options: [
        ['none', 'None identified'],
        ['poi_under_40_or_severe_male_factor', 'POI <40 years / severe male factor'],
        ['unexplained_infertility', 'Unexplained infertility >12 months'],
      ],
    },
    {
      key: 'rplActiveIvfCycle',
      label: 'Active IVF / PGT cycle or current pregnancy',
      type: 'checkbox',
    },
  ],
  'positive-family-history': [
    {
      key: 'fhxRelativeDegree',
      label: 'Closest affected relative',
      type: 'select',
      options: [
        ['first_degree', 'First degree — parent, sibling, child'],
        ['second_degree', 'Second degree — aunt, uncle, grandparent'],
        ['third_degree_or_distant', 'Third degree / distant relative'],
      ],
    },
    {
      key: 'fhxConditionType',
      label: 'Family history category',
      type: 'select',
      options: [
        ['negative_history', 'No known genetic disorder'],
        ['known_monogenic_or_xlinked', 'Known familial variant / monogenic disorder'],
        ['id_mca_or_consanguinity', 'Intellectual disability / anomalies / consanguinity'],
        ['distant_unverified_or_multifactorial', 'Distant, unverified or multifactorial condition'],
      ],
    },
    { key: 'fhxIsPregnant', label: 'Patient is currently pregnant', type: 'checkbox' },
    { key: 'fhxDisorderName', label: 'Condition and molecular report availability', type: 'text' },
  ],
}

/**
 * Standardized Point-of-Care OPD Clinical Intake Fields.
 * Exactly matched to Histone-main backend decision engine and clinical screenshots.
 */
export const CLINICAL_INTAKE_FIELDS: Record<string, InputField[]> = {
  'preconception-carrier-screening': [
    { key: 'consanguinity', label: 'Consanguineous partnership', type: 'bool' },
    {
      key: 'both_partners_same_carrier',
      label: 'Both partners known carriers of same recessive condition',
      type: 'bool',
    },
    { key: 'one_partner_carrier', label: 'One partner is a known carrier', type: 'bool' },
    {
      key: 'family_history_recessive_condition',
      label: 'Family history of a recessive genetic condition',
      type: 'bool',
    },
    {
      key: 'ancestries',
      label: 'Reported ancestries',
      type: 'multi',
      options: [
        ['ashkenazi', 'Ashkenazi Jewish'],
        ['mediterranean', 'Mediterranean'],
        ['southeast_asian', 'Southeast Asian'],
        ['african', 'African / African-American'],
        ['european', 'European (non-AJ)'],
        ['latino', 'Latino / Hispanic'],
        ['other', 'Other'],
      ],
    },
  ],
  'hereditary-cancer-risk': [
    { key: 'personal_breast_cancer', label: 'Personal history of breast cancer', type: 'bool' },
    {
      key: 'personal_breast_cancer_age',
      label: 'Age at breast cancer diagnosis (if any)',
      type: 'number',
      showIf: (v) => Boolean(v.personal_breast_cancer),
    },
    {
      key: 'personal_ovarian_cancer',
      label: 'Personal ovarian / fallopian / peritoneal cancer',
      type: 'bool',
    },
    { key: 'personal_endometrial_cancer', label: 'Personal endometrial cancer', type: 'bool' },
    {
      key: 'family_breast_cancer_first_degree_count',
      label: 'First-degree relatives with breast cancer',
      type: 'number',
      min: 0,
      default: 0,
    },
    {
      key: 'family_ovarian_cancer_count',
      label: 'Relatives (any degree) with ovarian cancer',
      type: 'number',
      min: 0,
      default: 0,
    },
    {
      key: 'family_colon_cancer_count',
      label: 'Relatives with colorectal cancer',
      type: 'number',
      min: 0,
      default: 0,
    },
    { key: 'male_breast_cancer_family', label: 'Male breast cancer in family', type: 'bool' },
    { key: 'ashkenazi_ancestry', label: 'Ashkenazi Jewish ancestry', type: 'bool' },
  ],
  'abnormal-ultrasound-findings': [
    { key: 'gestational_age_weeks', label: 'Gestational age (weeks)', type: 'number', step: 0.1 },
    { key: 'nuchal_translucency_mm', label: 'Nuchal translucency (mm)', type: 'number', step: 0.1 },
    { key: 'structural_anomaly', label: 'Major structural anomaly identified', type: 'bool' },
    { key: 'iugr_early_severe', label: 'Early-onset severe IUGR (< 32w)', type: 'bool' },
    {
      key: 'soft_markers',
      label: 'Soft markers present',
      type: 'multi',
      options: [
        ['echogenic_bowel', 'Echogenic bowel'],
        ['echogenic_intracardiac_focus', 'Echogenic intracardiac focus'],
        ['choroid_plexus_cyst', 'Choroid plexus cyst'],
        ['short_femur', 'Short femur'],
        ['short_humerus', 'Short humerus'],
        ['pyelectasis', 'Pyelectasis'],
        ['thickened_nuchal_fold', 'Thickened nuchal fold'],
      ],
    },
  ],
  'nipt-results': [
    {
      key: 'result_type',
      label: 'Result type',
      type: 'select',
      options: [
        ['negative', 'Negative / low-risk'],
        ['t21_positive', 'Screen positive — Trisomy 21'],
        ['t18_positive', 'Screen positive — Trisomy 18'],
        ['t13_positive', 'Screen positive — Trisomy 13'],
        ['sex_chromosome_positive', 'Screen positive — sex chromosome'],
        ['microdeletion_positive', 'Screen positive — microdeletion'],
        ['no_call', 'No-call / uninformative'],
      ],
    },
    { key: 'fetal_fraction', label: 'Fetal fraction (%)', type: 'number', step: 0.1 },
    { key: 'no_call', label: 'Result was flagged as no-call', type: 'bool' },
    {
      key: 'discordant_with_ultrasound',
      label: 'Discordant with ultrasound findings',
      type: 'bool',
    },
    { key: 'gestational_age_weeks', label: 'Gestational age (weeks)', type: 'number', step: 0.1 },
  ],
  'infertility-recurrent-pregnancy-loss': [
    {
      key: 'pregnancy_loss_count',
      label: 'Number of clinically recognized losses',
      type: 'number',
      min: 0,
      default: 0,
    },
    {
      key: 'parental_karyotype_abnormal',
      label: 'Known parental karyotype abnormality',
      type: 'bool',
    },
    {
      key: 'azoospermia_or_severe_oligo',
      label: 'Male factor: azoospermia or severe oligospermia',
      type: 'bool',
    },
    {
      key: 'primary_ovarian_insufficiency',
      label: 'Primary ovarian insufficiency (< 40y)',
      type: 'bool',
    },
  ],
  'positive-family-history': [
    { key: 'condition_name', label: 'Condition name (free text — for the record)', type: 'text' },
    {
      key: 'closest_affected_degree',
      label: 'Closest affected relative',
      type: 'select',
      options: [
        ['first', 'First-degree (parent/sibling/child)'],
        ['second', 'Second-degree'],
        ['third', 'Third-degree or more distant'],
      ],
    },
    { key: 'multiple_affected', label: 'Multiple affected relatives', type: 'bool' },
    {
      key: 'reproductive_planning',
      label: 'Patient is planning pregnancy or currently pregnant',
      type: 'bool',
    },
    {
      key: 'condition_severity',
      label: 'Condition severity',
      type: 'select',
      options: [
        ['mild', 'Mild'],
        ['moderate', 'Moderate'],
        ['severe', 'Severe / life-limiting'],
        ['unknown', 'Unknown'],
      ],
    },
  ],
}

/** Backward-compatible lookup containing all active intake and legacy fields */
export const FORM_FIELDS: Record<string, InputField[]> = Object.fromEntries(
  Object.entries(CLINICAL_INTAKE_FIELDS).map(([slug, fields]) => [
    slug,
    [
      ...fields,
      ...(LEGACY_FORM_FIELDS[slug] ?? []).map((f) => ({ ...f, legacy: true })),
    ],
  ]),
)

export function emptyClinicalForm(): StructuredFormState {
  return {}
}

/** Patient context is not evidence for any pathway answer. */
export function formForPatient(
  _patient?: Pick<Patient, 'pregnancyStatus' | 'gestationalAgeWeeks'>,
): StructuredFormState {
  return emptyClinicalForm()
}

export function isRealDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  )
}

export function parseClinicalInputs(slug: string, input: unknown): StructuredFormState {
  if (
    !Object.hasOwn(FORM_FIELDS, slug) ||
    !input ||
    Object.prototype.toString.call(input) !== '[object Object]'
  )
    throw new Error('Invalid structured clinical input.')
  const record = input as Record<string, unknown>
  const fields = FORM_FIELDS[slug]
  const result: StructuredFormState = {}

  for (const f of fields) {
    if (!Object.hasOwn(record, f.key) || record[f.key] === undefined) continue
    const value = record[f.key]
    if (value === '' || value === null) {
      result[f.key] = ''
      continue
    }

    let valid = false
    if (f.type === 'checkbox' || f.type === 'bool') {
      valid = typeof value === 'boolean' || value === 'true' || value === 'false'
      result[f.key] = typeof value === 'boolean' ? value : value === 'true'
    } else if (f.type === 'multi') {
      valid = Array.isArray(value) || typeof value === 'string'
      result[f.key] = Array.isArray(value)
        ? value.map(String)
        : String(value).split(',').map((s) => s.trim()).filter(Boolean)
    } else if (f.type === 'number') {
      valid =
        (typeof value === 'number' ||
          (typeof value === 'string' &&
            value.length <= 100 &&
            /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))) &&
        Number.isFinite(Number(value))
      result[f.key] = Number(value)
    } else if (typeof value === 'string') {
      if (f.type === 'select') {
        valid = !f.options || f.options.some(([key]) => key === value) || value === 'negative'
      } else if (f.type === 'date') {
        valid = isRealDate(value)
      } else {
        valid = value.length <= (f.type === 'textarea' ? 8000 : 2000)
      }
      result[f.key] = value.trim()
    }

    if (!valid && value !== '') {
      result[f.key] = typeof value === 'string' ? value.trim() : (value as any)
    }
  }
  return result
}

export function visibleIntakeFields(slug: string, inputs: StructuredFormState): InputField[] {
  return (CLINICAL_INTAKE_FIELDS[slug] ?? []).filter(
    (f) => !f.showIf || f.showIf(inputs),
  )
}
