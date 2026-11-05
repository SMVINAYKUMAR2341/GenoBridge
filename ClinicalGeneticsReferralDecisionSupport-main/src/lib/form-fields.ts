import type { StructuredFormState } from './decision-engine'
import type { Patient } from '@/payload-types'

export type FormKey = string
export type InputField = {
  key: FormKey
  label: string
  hint?: string
  type: 'select' | 'text' | 'checkbox' | 'number' | 'textarea' | 'date'
  options?: [string, string][]
  section?: string
  subflow?: 'infertility' | 'rpl'
  required?: boolean
  legacy?: boolean
}
/** Original keys and option meanings are retained for existing records only. */
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

const options = (...values: string[]): [string, string][] => values.map((value) => [value, value])
const yn: [string, string][] = [
  ['yes', 'Yes'],
  ['no', 'No'],
]
const field = (
  key: string,
  label: string,
  type: InputField['type'] = 'text',
  section = 'Clinical details',
): InputField => ({ key, label, type, section })
const select = (
  key: string,
  label: string,
  values: [string, string][],
  section?: string,
): InputField => ({ ...field(key, label, 'select', section), options: values })
const yesNo = (key: string, label: string, section?: string) => select(key, label, yn, section)
const reports = (prefix: string): InputField[] => [
  field(`${prefix}ReportDateRaw`, 'Report date', 'date', 'Source documentation'),
  field(`${prefix}LaboratoryRaw`, 'Laboratory / reporting service', 'text', 'Source documentation'),
  select(`${prefix}ReportAvailableRaw`, 'Original report available', yn, 'Source documentation'),
  field(
    `${prefix}ReportReferenceRaw`,
    'Synthetic report reference',
    'text',
    'Source documentation',
  ),
  field(
    `${prefix}ClinicalNotesRaw`,
    'Additional clinical context / uncertainty',
    'textarea',
    'Source documentation',
  ),
]
const pregnancy = (prefix: string): InputField[] => [
  select(
    `${prefix}PregnancyStatusRaw`,
    'Reproductive context',
    options('Pregnant', 'Planning pregnancy', 'Not pregnant', 'Postpartum'),
    'Reproductive context',
  ),
  field(
    `${prefix}GestationalWeeksRaw`,
    'Gestational age (completed weeks)',
    'number',
    'Reproductive context',
  ),
  field(
    `${prefix}GestationalDaysRaw`,
    'Additional gestational days',
    'number',
    'Reproductive context',
  ),
  field(
    `${prefix}DecisionDateRaw`,
    'Documented treatment / reproductive decision date',
    'date',
    'Reproductive context',
  ),
]

/** Raw observations, not threshold buckets or executable clinical recommendations. */
export const CLINICAL_INTAKE_FIELDS: Record<string, InputField[]> = {
  'hereditary-cancer-risk': [
    select(
      'hcrCancerHistoryRaw',
      'Personal cancer history recorded',
      options('Cancer reported', 'No cancer reported', 'History unavailable'),
      'Personal cancer history',
    ),
    field('hcrPrimarySiteRaw', 'Primary cancer site(s)', 'text', 'Personal cancer history'),
    field(
      'hcrHistologyRaw',
      'Histology / tumour subtype as reported',
      'text',
      'Personal cancer history',
    ),
    field('hcrDiagnosisAgeRaw', 'Age at diagnosis (years)', 'number', 'Personal cancer history'),
    field('hcrDiagnosisDateRaw', 'Diagnosis date', 'date', 'Personal cancer history'),
    yesNo('hcrBilateralRaw', 'Bilateral disease documented', 'Personal cancer history'),
    field('hcrPrimaryCountRaw', 'Number of primary cancers', 'number', 'Personal cancer history'),
    field(
      'hcrTumourTestingRaw',
      'Tumour testing / biomarkers and exact findings',
      'textarea',
      'Personal cancer history',
    ),
    select(
      'hcrGermlineStatusRaw',
      'Personal germline testing status',
      options('Not tested', 'Pending', 'Result available'),
      'Genetic testing',
    ),
    field(
      'hcrGeneVariantRaw',
      'Gene, transcript and variant as reported',
      'textarea',
      'Genetic testing',
    ),
    select(
      'hcrVariantClassRaw',
      'Laboratory variant classification',
      options(
        'Pathogenic',
        'Likely pathogenic',
        'Uncertain significance',
        'Likely benign',
        'Benign',
        'Other',
      ),
      'Genetic testing',
    ),
    yesNo(
      'hcrFamilialVariantDocumentedRaw',
      'Familial variant documented in a report',
      'Family history',
    ),
    field(
      'hcrAffectedRelativesRaw',
      'Relative, lineage, cancer site and age at diagnosis for each affected relative',
      'textarea',
      'Family history',
    ),
    field(
      'hcrAncestryRaw',
      'Self-reported ancestry relevant to this assessment',
      'text',
      'Family history',
    ),
    field(
      'hcrHistoryLimitationsRaw',
      'Family history limitations / unavailable records',
      'textarea',
      'Family history',
    ),
    field(
      'hcrTreatmentPlanRaw',
      'Current treatment / surgical plan and timing',
      'textarea',
      'Care planning',
    ),
    ...reports('hcr'),
  ],
  'preconception-carrier-screening': [
    ...pregnancy('pcs'),
    select(
      'pcsTestingStatusRaw',
      'Patient screening status',
      options('Not tested', 'Pending', 'Completed', 'Inconclusive'),
      'Patient testing',
    ),
    field(
      'pcsPanelRaw',
      'Panel / methodology and conditions covered',
      'textarea',
      'Patient testing',
    ),
    select(
      'pcsResultRaw',
      'Patient result as reported',
      options(
        'No reportable finding',
        'Carrier finding',
        'Affected finding',
        'Uncertain finding',
        'Other',
      ),
      'Patient testing',
    ),
    field('pcsConditionRaw', 'Condition / gene', 'text', 'Patient testing'),
    field('pcsVariantRaw', 'Variant, transcript and zygosity', 'textarea', 'Patient testing'),
    select(
      'pcsClassificationRaw',
      'Laboratory classification',
      options(
        'Pathogenic',
        'Likely pathogenic',
        'Uncertain significance',
        'Likely benign',
        'Benign',
        'Other',
      ),
      'Patient testing',
    ),
    select(
      'pcsInheritanceRaw',
      'Inheritance stated in report',
      options('Autosomal recessive', 'X-linked', 'Autosomal dominant', 'Other'),
      'Patient testing',
    ),
    select(
      'pcsPartnerTestingRaw',
      'Reproductive partner testing status',
      options('Not tested', 'Pending', 'Completed', 'Unavailable', 'Not applicable'),
      'Partner testing',
    ),
    field('pcsPartnerConditionRaw', 'Partner condition / gene tested', 'text', 'Partner testing'),
    select(
      'pcsPartnerResultRaw',
      'Partner result as reported',
      options(
        'No reportable finding',
        'Carrier finding',
        'Affected finding',
        'Uncertain finding',
        'Other',
      ),
      'Partner testing',
    ),
    field(
      'pcsPartnerVariantRaw',
      'Partner variant, classification and methodology',
      'textarea',
      'Partner testing',
    ),
    yesNo('pcsRelatedPartnersRaw', 'Consanguinity reported', 'Family and reproductive history'),
    field(
      'pcsFamilyHistoryRaw',
      'Relevant family history / previous affected pregnancies',
      'textarea',
      'Family and reproductive history',
    ),
    field(
      'pcsResidualRiskRaw',
      'Residual risk / limitations stated by laboratory',
      'textarea',
      'Patient testing',
    ),
    ...reports('pcs'),
  ],
  'nipt-results': [
    ...pregnancy('nipt'),
    select(
      'niptMethodRaw',
      'Screening method',
      options('Cell-free DNA', 'Serum screening', 'Combined screening', 'Other'),
      'Screening report',
    ),
    field('niptDrawDateRaw', 'Sample collection date', 'date', 'Screening report'),
    field('niptDrawWeeksRaw', 'Gestational age at draw (weeks)', 'number', 'Screening report'),
    field('niptDrawDaysRaw', 'Additional days at draw', 'number', 'Screening report'),
    select(
      'niptReportedResultRaw',
      'Laboratory result category',
      options('Screen positive', 'Screen negative', 'No result / no-call', 'Inconclusive', 'Other'),
      'Screening report',
    ),
    field(
      'niptTargetsRaw',
      'Chromosome / condition(s) and exact reported result',
      'textarea',
      'Screening report',
    ),
    field('niptFetalFractionRaw', 'Reported fetal fraction (%)', 'number', 'Screening report'),
    field(
      'niptPpvRaw',
      'Laboratory-reported positive predictive value (%)',
      'number',
      'Screening report',
    ),
    field('niptNoCallReasonRaw', 'No-call reason as reported', 'text', 'Screening report'),
    field('niptSampleCountRaw', 'Number of screening samples', 'number', 'Screening report'),
    field('niptFetusCountRaw', 'Number of fetuses', 'number', 'Pregnancy context'),
    yesNo('niptVanishingTwinRaw', 'Vanishing twin documented', 'Pregnancy context'),
    yesNo('niptDonorConceptionRaw', 'Donor conception reported', 'Pregnancy context'),
    field(
      'niptUltrasoundRaw',
      'Ultrasound findings and date',
      'textarea',
      'Additional investigations',
    ),
    select(
      'niptDiagnosticStatusRaw',
      'Diagnostic testing status',
      options('Not performed', 'Planned', 'Pending', 'Result available', 'Declined'),
      'Additional investigations',
    ),
    field(
      'niptDiagnosticReportRaw',
      'Diagnostic test, sample type and exact result',
      'textarea',
      'Additional investigations',
    ),
    ...reports('nipt'),
  ],
  'abnormal-ultrasound-findings': [
    ...pregnancy('us'),
    field('usScanDateRaw', 'Ultrasound date', 'date', 'Ultrasound observations'),
    field('usScanWeeksRaw', 'Gestational age at scan (weeks)', 'number', 'Ultrasound observations'),
    field('usScanDaysRaw', 'Additional days at scan', 'number', 'Ultrasound observations'),
    field('usFetusReferenceRaw', 'Fetus / plurality reference', 'text', 'Ultrasound observations'),
    select(
      'usObservationRaw',
      'Reported observation type',
      options(
        'Structural finding',
        'Soft marker',
        'Nuchal measurement',
        'Growth finding',
        'No abnormality reported',
        'Other',
      ),
      'Ultrasound observations',
    ),
    field(
      'usAnatomyRaw',
      'Anatomical site(s) and exact findings',
      'textarea',
      'Ultrasound observations',
    ),
    field('usFindingCountRaw', 'Number of reported findings', 'number', 'Ultrasound observations'),
    select('usIsolationRaw', 'Finding described as isolated', yn, 'Ultrasound observations'),
    field('usNtMmRaw', 'Nuchal translucency (mm)', 'number', 'Measurements'),
    field('usCrlMmRaw', 'Crown–rump length (mm)', 'number', 'Measurements'),
    field('usNuchalFoldMmRaw', 'Nuchal fold (mm)', 'number', 'Measurements'),
    field(
      'usOtherMeasurementsRaw',
      'Other measurements, units and reference used by reporter',
      'textarea',
      'Measurements',
    ),
    select(
      'usScreeningStatusRaw',
      'Prior screening status',
      options(
        'Not performed',
        'Pending',
        'Screen positive',
        'Screen negative',
        'No result / inconclusive',
      ),
      'Other investigations',
    ),
    field(
      'usScreeningDetailsRaw',
      'Screening method, date and exact result',
      'textarea',
      'Other investigations',
    ),
    field(
      'usDiagnosticDetailsRaw',
      'Diagnostic investigations / exact results',
      'textarea',
      'Other investigations',
    ),
    field(
      'usReporterPlanRaw',
      'Reporting clinician impression and follow-up plan',
      'textarea',
      'Care planning',
    ),
    ...reports('us'),
  ],
  'infertility-recurrent-pregnancy-loss': [
    select(
      'reproSubflowRaw',
      'Assessment focus',
      [
        ['infertility', 'Infertility'],
        ['rpl', 'Recurrent pregnancy loss'],
        ['both', 'Infertility and pregnancy loss'],
      ],
      'Assessment focus',
    ),
    ...pregnancy('repro'),
    ...[
      field(
        'infDurationMonthsRaw',
        'Duration attempting conception (months)',
        'number',
        'Infertility history',
      ),
      field('infAgeRaw', 'Age at evaluation (years)', 'number', 'Infertility history'),
      select(
        'infTypeRaw',
        'Infertility history',
        options('Primary', 'Secondary'),
        'Infertility history',
      ),
      field(
        'infMenstrualHistoryRaw',
        'Cycle pattern / amenorrhoea history',
        'textarea',
        'Infertility history',
      ),
      field(
        'infOvarianFunctionRaw',
        'Ovarian function investigations, dates, values and units',
        'textarea',
        'Infertility investigations',
      ),
      field(
        'infOvarianOnsetAgeRaw',
        'Age at onset of ovarian dysfunction (years)',
        'number',
        'Infertility investigations',
      ),
      field(
        'infSemenConcentrationRaw',
        'Sperm concentration (million/mL)',
        'number',
        'Infertility investigations',
      ),
      field(
        'infSemenReportRaw',
        'Semen analysis, collection date and other measured parameters',
        'textarea',
        'Infertility investigations',
      ),
      field(
        'infAnatomyRaw',
        'Reproductive anatomy / other identified factors',
        'textarea',
        'Infertility investigations',
      ),
      field(
        'infGeneticTestsRaw',
        'Karyotype / molecular tests and exact results',
        'textarea',
        'Infertility investigations',
      ),
      field(
        'infTreatmentRaw',
        'Fertility treatment / IVF / PGT plan and dates',
        'textarea',
        'Infertility care planning',
      ),
    ].map((f): InputField => ({ ...f, subflow: 'infertility' })),
    ...[
      field(
        'lossClinicalCountRaw',
        'Number of clinically documented pregnancy losses',
        'number',
        'Pregnancy loss history',
      ),
      field(
        'lossBiochemicalCountRaw',
        'Number of biochemical pregnancy losses',
        'number',
        'Pregnancy loss history',
      ),
      field('lossLiveBirthCountRaw', 'Number of live births', 'number', 'Pregnancy loss history'),
      field(
        'lossHistoryRaw',
        'For each pregnancy: date, gestational age, outcome and documentation',
        'textarea',
        'Pregnancy loss history',
      ),
      field('lossLatestDateRaw', 'Most recent loss date', 'date', 'Pregnancy loss history'),
      select(
        'lossPocTestingStatusRaw',
        'Products of conception testing status',
        options('Not tested', 'Pending', 'Result available', 'Sample unavailable'),
        'Pregnancy loss investigations',
      ),
      field(
        'lossPocResultsRaw',
        'POC method, chromosome / molecular findings and report limitations',
        'textarea',
        'Pregnancy loss investigations',
      ),
      field(
        'lossParentalTestingRaw',
        'Parental karyotypes / genetic investigations and exact results',
        'textarea',
        'Pregnancy loss investigations',
      ),
      field(
        'lossOtherInvestigationsRaw',
        'Other loss investigations and findings',
        'textarea',
        'Pregnancy loss investigations',
      ),
    ].map((f): InputField => ({ ...f, subflow: 'rpl' })),
    field(
      'reproFamilyHistoryRaw',
      'Family history / consanguinity / known familial variants',
      'textarea',
      'Shared clinical context',
    ),
    ...reports('repro'),
  ],
  'positive-family-history': [
    ...pregnancy('fhx'),
    field('fhxConditionRaw', 'Condition / phenotype as reported', 'text', 'Affected relative'),
    field('fhxRelationshipRaw', 'Relationship to consultand', 'text', 'Affected relative'),
    select(
      'fhxDegreeRaw',
      'Degree of relationship',
      options('First degree', 'Second degree', 'Third degree', 'More distant'),
      'Affected relative',
    ),
    select(
      'fhxLineageRaw',
      'Family lineage',
      options('Maternal', 'Paternal', 'Both', 'Partner family'),
      'Affected relative',
    ),
    field('fhxDiagnosisAgeRaw', 'Age at diagnosis (years)', 'number', 'Affected relative'),
    field('fhxAffectedCountRaw', 'Number of affected relatives', 'number', 'Family history'),
    field(
      'fhxOtherRelativesRaw',
      'Other affected relatives, relationships, lineage and ages',
      'textarea',
      'Family history',
    ),
    yesNo('fhxClinicalDiagnosisRaw', 'Clinical diagnosis documented', 'Documentation'),
    yesNo('fhxMolecularDiagnosisRaw', 'Molecular diagnosis documented', 'Documentation'),
    field(
      'fhxGeneVariantRaw',
      'Gene, transcript, variant and zygosity',
      'textarea',
      'Documentation',
    ),
    select(
      'fhxClassificationRaw',
      'Laboratory classification',
      options(
        'Pathogenic',
        'Likely pathogenic',
        'Uncertain significance',
        'Likely benign',
        'Benign',
        'Other',
      ),
      'Documentation',
    ),
    select(
      'fhxInheritanceRaw',
      'Documented inheritance',
      options(
        'Autosomal dominant',
        'Autosomal recessive',
        'X-linked',
        'Mitochondrial',
        'Chromosomal',
        'Other',
      ),
      'Documentation',
    ),
    yesNo('fhxConsanguinityRaw', 'Consanguinity reported', 'Family history'),
    field('fhxConsanguinityDetailsRaw', 'Parental relationship / degree', 'text', 'Family history'),
    field(
      'fhxPersonalFeaturesRaw',
      'Relevant features / testing in the consultand',
      'textarea',
      'Consultand context',
    ),
    field(
      'fhxHistoryLimitationsRaw',
      'Unverified history / unavailable relatives or records',
      'textarea',
      'Documentation',
    ),
    ...reports('fhx'),
  ],
}

// Preserve historical validation contracts without presenting or pre-populating
// threshold-derived legacy questions in new intakes. Only governed server rules
// can interpret persisted facts; this catalog contains no clinical evaluator.
export const FORM_FIELDS: Record<string, InputField[]> = Object.fromEntries(
  Object.entries(CLINICAL_INTAKE_FIELDS).map(([slug, fields]) => [
    slug,
    [...fields, ...LEGACY_FORM_FIELDS[slug].map((f) => ({ ...f, legacy: true }))],
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
  if (Object.keys(record).some((key) => !fields.some((f) => f.key === key)))
    throw new Error('Unexpected structured clinical field. Reload the current form.')
  const result: StructuredFormState = {}
  for (const f of fields) {
    if (!Object.hasOwn(record, f.key) || record[f.key] === undefined) continue
    const value = record[f.key]
    // Blank and omitted mean unknown, including historical boolean questions.
    if (value === '') {
      result[f.key] = ''
      continue
    }
    let valid = false
    if (f.type === 'checkbox') valid = typeof value === 'boolean'
    else if (f.type === 'number')
      valid =
        (typeof value === 'number' ||
          (typeof value === 'string' &&
            value.length <= 100 &&
            /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))) &&
        Number.isFinite(Number(value))
    else if (typeof value === 'string') {
      if (f.type === 'select') valid = !!f.options?.some(([key]) => key === value)
      else if (f.type === 'date') valid = isRealDate(value)
      else valid = value.length <= (f.type === 'textarea' ? 8000 : 2000)
    }
    if (!valid) throw new Error(`Review ${f.label}.`)
    result[f.key] = typeof value === 'string' ? value.trim() : (value as number | boolean)
  }
  return result
}

export function visibleIntakeFields(slug: string, inputs: StructuredFormState): InputField[] {
  return (CLINICAL_INTAKE_FIELDS[slug] ?? []).filter(
    (f) => !f.subflow || inputs.reproSubflowRaw === 'both' || inputs.reproSubflowRaw === f.subflow,
  )
}
