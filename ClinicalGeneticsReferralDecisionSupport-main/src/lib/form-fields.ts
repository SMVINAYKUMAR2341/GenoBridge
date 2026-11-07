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
  dependsOn?: string
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
      key: 'reported_ancestries',
      label: 'Reported ancestries (gnomAD populations)',
      type: 'multi',
      options: [
        ['ASJ', 'Ashkenazi Jewish (ASJ)'],
        ['SAS', 'South Asian (SAS)'],
        ['AFR', 'African / African-American (AFR)'],
        ['AMR', 'Latino / Admixed American (AMR)'],
        ['EAS', 'East Asian (EAS)'],
        ['FIN', 'Finnish (FIN)'],
        ['NFE', 'Non-Finnish European (NFE)'],
        ['OTH', 'Other / Admixed (OTH)'],
      ],
    },
  ],
  'hereditary-cancer-risk': [
    { key: 'personal_breast_cancer', label: 'Personal history of breast cancer', type: 'bool' },
    {
      key: 'personal_breast_cancer_age',
      label: 'Age at breast cancer diagnosis (if any)',
      type: 'number',
      dependsOn: 'personal_breast_cancer',
    },
    {
      key: 'personal_ovarian_cancer',
      label: 'Personal ovarian / fallopian / peritoneal cancer',
      type: 'bool',
    },
    { key: 'ashkenazi_ancestry', label: 'Ashkenazi Jewish ancestry', type: 'bool' },
    {
      key: 'family_breast_cancer_first_degree_count',
      label: 'First-degree relatives with breast cancer',
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
    {
      key: 'family_ovarian_cancer_count',
      label: 'Relatives (any degree) with ovarian cancer',
      type: 'number',
      min: 0,
      default: 0,
    },
    { key: 'male_breast_cancer_family', label: 'Male breast cancer in family', type: 'bool' },
  ],
  'abnormal-ultrasound-findings': [
    { key: 'gestational_age_weeks', label: 'Gestational age (weeks)', type: 'number', step: 0.1 },
    { key: 'nuchal_translucency_mm', label: 'Nuchal translucency (mm)', type: 'number', step: 0.1 },
    { key: 'major_structural_anomaly', label: 'Major structural anomaly identified', type: 'bool' },
    {
      key: 'soft_markers_array',
      label: 'Soft markers present',
      type: 'multi',
      options: [
        ['echogenic_bowel', 'Echogenic bowel'],
        ['echogenic_intracardiac_focus', 'Echogenic intracardiac focus'],
        ['choroid_plexus_cyst', 'Choroid plexus cyst'],
        ['single_umbilical_artery', 'Single umbilical artery'],
        ['absent_nasal_bone', 'Absent nasal bone'],
        ['ventriculomegaly', 'Ventriculomegaly'],
        ['renal_pyelectasis', 'Renal pyelectasis'],
      ],
    },
  ],
  'nipt-results': [
    {
      key: 'result_type',
      label: 'Result type',
      type: 'select',
      options: [
        ['LOW_RISK', 'Negative / low-risk'],
        ['HIGH_RISK_T21', 'Screen positive — Trisomy 21'],
        ['HIGH_RISK_T18', 'Screen positive — Trisomy 18'],
        ['HIGH_RISK_T13', 'Screen positive — Trisomy 13'],
        ['SEX_CHROMOSOME_ANEUPLOIDY', 'Screen positive — sex chromosome aneuploidy'],
        ['MICRODELETION_22Q11', 'Screen positive — 22q11.2 microdeletion'],
        ['no_call', 'No-call / uninformative'],
      ],
    },
    { key: 'fetal_fraction_percentage', label: 'Fetal fraction (%)', type: 'number', step: 0.1 },
    { key: 'no_call_flag', label: 'Result was flagged as no-call / low FF', type: 'bool' },
    {
      key: 'discordant_with_ultrasound',
      label: 'Discordant with ultrasound findings',
      type: 'bool',
    },
  ],
  'infertility-recurrent-pregnancy-loss': [
    {
      key: 'clinically_recognized_losses',
      label: 'Number of clinically recognized pregnancy losses',
      type: 'number',
      min: 0,
      default: 0,
    },
    {
      key: 'known_parental_karyotype_abnormality',
      label: 'Known parental karyotype abnormality (balanced translocation)',
      type: 'bool',
    },
    {
      key: 'primary_ovarian_insufficiency_under_40',
      label: 'Primary ovarian insufficiency (< 40y)',
      type: 'bool',
    },
    {
      key: 'azoospermia_or_severe_oligo',
      label: 'Severe male factor: non-obstructive azoospermia',
      type: 'bool',
    },
  ],
  'positive-family-history': [
    {
      key: 'condition_omim_id',
      label: 'Condition OMIM ID or Disease Name',
      type: 'text',
      hint: 'e.g., #104760, Marfan syndrome, or Neurofibromatosis',
    },
    {
      key: 'closest_affected_degree',
      label: 'Closest affected relative degree',
      type: 'select',
      options: [
        ['1', '1st degree — Parent, sibling, or child'],
        ['2', '2nd degree — Grandparent, aunt, uncle, niece, nephew'],
        ['3', '3rd degree — First cousin'],
      ],
    },
    {
      key: 'reproductive_planning_status',
      label: 'Patient is actively planning pregnancy or currently pregnant',
      type: 'bool',
    },
    { key: 'multiple_affected', label: 'Multiple affected relatives in pedigree', type: 'bool' },
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
  return (CLINICAL_INTAKE_FIELDS[slug] ?? []).filter((f) => {
    if (f.dependsOn && !Boolean(inputs[f.dependsOn])) return false
    if (f.showIf && !f.showIf(inputs)) return false
    return true
  })
}
