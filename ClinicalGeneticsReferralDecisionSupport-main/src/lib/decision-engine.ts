/**
 * Deterministic clinical decision engine for GenoBridge AI.
 * Deterministic clinical genetics decision support engine and statutory
 * FOGSI, ACOG, ACMG, ASRM, and NCCN clinical guidelines.
 *
 * Engineered for zero hallucination: pure rule-based evaluation indexed directly
 * to published guidelines with exact citations and urgency tiering.
 */

export type PathwaySlug =
  | 'hereditary-cancer-risk'
  | 'preconception-carrier-screening'
  | 'nipt-results'
  | 'abnormal-ultrasound-findings'
  | 'infertility-recurrent-pregnancy-loss'
  | 'positive-family-history'
  | 'hereditary_cancer'
  | 'carrier_screening'
  | 'nipt_results'
  | 'abnormal_ultrasound'
  | 'infertility_rpl'
  | 'family_history'

export type UrgencyTier = 'no_referral' | 'borderline' | 'routine' | 'urgent'
export type StandardTier = 'URGENT' | 'PRIORITY' | 'ROUTINE' | 'COUNSEL_AND_REASSESS' | 'INSUFFICIENT_DATA'
export type PrimaryDecision = 'urgent_referral' | 'routine_referral' | 'no_referral_needed'
export type SafeguardDecision =
  | 'borderline_consideration'
  | 'insufficient_information'
  | 'criteria_pending_approval'
export type ClinicalDecision = PrimaryDecision | SafeguardDecision

export interface MatchedCriterion {
  rule_key: string
  label: string
  description?: string
  outcome: UrgencyTier
  referral_target: string
  guideline_source: string
  citation: string
  threshold?: number | null
}

export interface FiredRule {
  id: string
  rule_key: string
  label: string
  description: string
  tier: StandardTier
  triggering_parameters: Record<string, unknown>
  guideline_source: string
  guideline_version?: string
  guideline_section?: string
  citation: string
  citation_url?: string
  next_steps_non_treatment: string
  time_critical_window?: string
}

export interface MissingInputGap {
  rule_id: string
  rule_label: string
  potential_tier: StandardTier
  missing_fields: string[]
  guideline_citation: string
}

export interface Counterfactual {
  factor: string
  current_value: string
  alternate_value: string
  resulting_tier: StandardTier
  explanation: string
}

export interface TimeCriticalContext {
  gestational_age_weeks?: number
  is_pregnant: boolean
  days_to_cvs_deadline?: number
  days_to_amnio_window?: number
  days_to_mtp_20w_limit?: number
  days_to_mtp_24w_limit?: number
  urgency_deadline?: string
  mtp_notice?: string
  pcpndt_notice?: string
}

export interface DecisionResult {
  outcome: UrgencyTier
  clinical_decision: ClinicalDecision
  tier: StandardTier
  referral_target: string
  matched_criteria: MatchedCriterion[]
  fired_rules: FiredRule[]
  not_fired_rules_with_missing_inputs: MissingInputGap[]
  counterfactuals: Counterfactual[]
  time_critical_context?: TimeCriticalContext
  explanation: string
  guideline_citations: string[]
  pathway_id: string
  confidence_score?: number
  matched_rule_id?: string
  cpt_codes?: string[]
  icd10_codes?: string[]
  counseling_points?: string[]
  patient_summary_en?: string
  patient_summary_hi?: string
}

export const URGENCY_RANK: Record<UrgencyTier, number> = {
  no_referral: 0,
  borderline: 1,
  routine: 2,
  urgent: 3,
}

export const OUTCOME_MAP_TO_CLINICAL: Record<UrgencyTier, ClinicalDecision> = {
  no_referral: 'no_referral_needed',
  borderline: 'borderline_consideration',
  routine: 'routine_referral',
  urgent: 'urgent_referral',
}

export const OUTCOME_MAP_FROM_CLINICAL: Record<string, UrgencyTier> = {
  no_referral_needed: 'no_referral',
  borderline_consideration: 'borderline',
  routine_referral: 'routine',
  urgent_referral: 'urgent',
  no_referral: 'no_referral',
  borderline: 'borderline',
  routine: 'routine',
  urgent: 'urgent',
}

export interface CriterionDefinition {
  pathway_id: string
  rule_key: string
  label: string
  description: string
  threshold: number | null
  outcome: UrgencyTier
  referral_target: string
  guideline_source: string
  citation: string
  active?: boolean
  approved?: boolean
}

export const SEED_CRITERIA: CriterionDefinition[] = [
  // ---------------- HEREDITARY CANCER (NCCN / ACOG) ----------------
  {
    pathway_id: 'hereditary_cancer',
    rule_key: 'hc_personal_breast_young',
    label: 'Personal breast cancer at young age',
    description: 'Personal history of breast cancer diagnosed at or before threshold age (<=50).',
    threshold: 50,
    outcome: 'urgent',
    referral_target: 'Cancer genetic counselor',
    guideline_source: 'NCCN',
    citation: 'NCCN Genetic/Familial High-Risk Assessment: Breast, Ovarian & Pancreatic v.1.2025',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'hereditary_cancer',
    rule_key: 'hc_ovarian_any_age',
    label: 'Personal or first-degree relative with ovarian cancer (any age)',
    description: 'Any epithelial ovarian, fallopian tube or primary peritoneal cancer.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'Cancer genetic counselor',
    guideline_source: 'NCCN',
    citation: 'NCCN BRCA/HBOC guideline — ovarian cancer at any age',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'hereditary_cancer',
    rule_key: 'hc_two_plus_first_degree_breast',
    label: 'Two or more first-degree relatives with breast cancer',
    description: 'At least 2 first-degree relatives with breast cancer (any age).',
    threshold: 2,
    outcome: 'routine',
    referral_target: 'Cancer genetic counselor',
    guideline_source: 'NCCN',
    citation: 'NCCN — multiple close relatives with breast cancer',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'hereditary_cancer',
    rule_key: 'hc_ashkenazi_breast_ovarian',
    label: 'Ashkenazi Jewish ancestry + breast/ovarian in self or 1st-degree',
    description: 'Founder BRCA1/2 mutations are 10x more prevalent in AJ population.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Cancer genetic counselor',
    guideline_source: 'NCCN',
    citation: 'NCCN — Ashkenazi Jewish ancestry with breast/ovarian cancer',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'hereditary_cancer',
    rule_key: 'hc_male_breast_family',
    label: 'Male breast cancer in family',
    description: 'Any male breast cancer in family strongly suggests BRCA2 mutation.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'Cancer genetic counselor',
    guideline_source: 'NCCN',
    citation: 'NCCN — male breast cancer red flag for BRCA2',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'hereditary_cancer',
    rule_key: 'hc_lynch_three_colon',
    label: 'Three or more relatives with colorectal cancer',
    description: 'Suggests Lynch syndrome; refer for MMR gene evaluation.',
    threshold: 3,
    outcome: 'routine',
    referral_target: 'Cancer genetic counselor',
    guideline_source: 'NCCN',
    citation: 'NCCN Genetic/Familial High-Risk Assessment: Colorectal — Lynch',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'hereditary_cancer',
    rule_key: 'hc_lynch_endometrial_colon',
    label: 'Endometrial cancer + colon cancer in family',
    description: 'Endometrial CA + any relative with colon CA — Lynch pattern.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'Cancer genetic counselor',
    guideline_source: 'NCCN',
    citation: 'NCCN Lynch — endometrial + colon cancer combination',
    active: true,
    approved: true,
  },

  // ---------------- CARRIER SCREENING (ACOG / FOGSI) ----------------
  {
    pathway_id: 'carrier_screening',
    rule_key: 'cs_consanguinity',
    label: 'Consanguineous partnership',
    description: 'Second-degree cousin or closer union increases autosomal recessive disorder risk.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG / FOGSI',
    citation: 'ACOG Committee Opinion 690 & FOGSI GCPR — Carrier Screening in Consanguineous Unions',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'carrier_screening',
    rule_key: 'cs_both_partners_carrier',
    label: 'Both partners known carriers of same recessive condition',
    description: '25% chance of affected offspring; PGT and prenatal diagnostic testing indicated.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG / FOGSI',
    citation: 'ACOG Practice Bulletin 691 & FOGSI Preconception Guidelines — Dual Carrier Couple',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'carrier_screening',
    rule_key: 'cs_one_partner_carrier',
    label: 'One partner is a known carrier',
    description: 'Partner should be tested; cascade testing recommended to determine recurrence risk.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG',
    citation: 'ACOG Committee Opinion 690 — Cascade testing of reproductive partner',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'carrier_screening',
    rule_key: 'cs_ashkenazi',
    label: 'Ashkenazi Jewish ancestry',
    description: 'Offer expanded AJ panel (Tay-Sachs, Canavan, familial dysautonomia, Gaucher).',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG',
    citation: 'ACOG Committee Opinion 691 — Ashkenazi Jewish carrier screening panel',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'carrier_screening',
    rule_key: 'cs_thalassemia_ancestry',
    label: 'High-risk ancestry for hemoglobinopathy (Mediterranean / SE Asian / Indian / African)',
    description: 'Elevated beta-thalassemia, sickle cell, and HbE carrier frequencies warrant CBC & HPLC.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG / FOGSI',
    citation: 'FOGSI & ACOG PB 691 — Hemoglobinopathy & Thalassemia Carrier Screening',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'carrier_screening',
    rule_key: 'cs_family_recessive',
    label: 'Family history of a recessive genetic condition',
    description: 'Positive family history warrants targeted carrier and variant-specific testing.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG / FOGSI',
    citation: 'ACOG Committee Opinion 690 & FOGSI — Family history-directed carrier screening',
    active: true,
    approved: true,
  },

  // ---------------- NIPT (ACMG / ACOG) ----------------
  {
    pathway_id: 'nipt_results',
    rule_key: 'nipt_common_aneuploidy_positive',
    label: 'Screen positive for T21 / T18 / T13',
    description: 'Positive cfDNA is a screening test. Confirm via CVS or amniocentesis before irreversible steps.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'MFM + Prenatal genetic counselor',
    guideline_source: 'ACMG / ACOG',
    citation: 'ACMG 2023 & ACOG PB 226 — Screening for Common Autosomal Aneuploidies',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'nipt_results',
    rule_key: 'nipt_sex_chromosome_positive',
    label: 'Screen positive for sex chromosome aneuploidy (Monosomy X, XXY, XXX, XYY)',
    description: 'Lower PPV than autosomal aneuploidies; genetic counseling required before confirmatory diagnostic test.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACMG',
    citation: 'ACMG 2023 — Sex chromosome aneuploidy cfDNA screening',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'nipt_results',
    rule_key: 'nipt_microdeletion_positive',
    label: 'Screen positive for microdeletion (e.g. 22q11.2 DiGeorge)',
    description: 'Microdeletion findings require expert counseling and chromosomal microarray confirmation.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'MFM + Prenatal genetic counselor',
    guideline_source: 'ACMG',
    citation: 'ACMG 2016 / 2023 — Prenatal screening for subchromosomal copy number variants',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'nipt_results',
    rule_key: 'nipt_low_fetal_fraction',
    label: 'Low fetal fraction (< 4.0%) or uninformative no-call result',
    description: 'Fetal fraction below 4% or no-call is associated with increased aneuploidy risk (T18, T13, triploidy).',
    threshold: 4.0,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG / SMFM',
    citation: 'ACOG Practice Bulletin 226 — Management of uninformative cfDNA screening results',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'nipt_results',
    rule_key: 'nipt_discordant',
    label: 'Discordant with ultrasound or clinical findings',
    description: 'Discordant cfDNA and sonographic presentation requires diagnostic testing (CVS/amnio) and karyotype.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'MFM + Prenatal genetic counselor',
    guideline_source: 'ACOG / SMFM',
    citation: 'ACOG PB 226 & SMFM — Discordant cfDNA and fetal ultrasound anomalies',
    active: true,
    approved: true,
  },

  // ---------------- ULTRASOUND (ACOG / ISUOG / FOGSI) ----------------
  {
    pathway_id: 'abnormal_ultrasound',
    rule_key: 'us_structural_anomaly',
    label: 'Major structural anomaly identified',
    description: 'Cardiac, neural tube, abdominal wall, renal, skeletal, or CNS structural malformation.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'MFM + Prenatal genetic counselor',
    guideline_source: 'ACOG / ISUOG',
    citation: 'ACOG Practice Bulletin 175 & ISUOG Standards — Diagnostic evaluation for fetal anomalies',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'abnormal_ultrasound',
    rule_key: 'us_increased_nt',
    label: 'Increased nuchal translucency (NT >= 3.5 mm)',
    description: 'NT at or above 3.5 mm at 11-14 weeks strongly indicates aneuploidy, Noonan, or cardiac defects.',
    threshold: 3.5,
    outcome: 'urgent',
    referral_target: 'MFM + Prenatal genetic counselor',
    guideline_source: 'ACOG / FOGSI',
    citation: 'ACOG PB 226 & FOGSI GCPR — Increased NT >= 3.5 mm indication for diagnostic testing & CMA',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'abnormal_ultrasound',
    rule_key: 'us_multiple_soft_markers',
    label: 'Multiple soft markers present (>= 2)',
    description: 'Two or more sonographic soft markers significantly elevate aneuploidy likelihood ratio.',
    threshold: 2,
    outcome: 'routine',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG / ISUOG',
    citation: 'ACOG Practice Bulletin 175 — Clinical management of multiple sonographic soft markers',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'abnormal_ultrasound',
    rule_key: 'us_isolated_soft_marker',
    label: 'Isolated single soft marker',
    description: 'Isolated marker in low-risk pregnancy rarely indicates aneuploidy; discussion recommended.',
    threshold: null,
    outcome: 'borderline',
    referral_target: 'Consider discussion with genetics',
    guideline_source: 'ACOG',
    citation: 'ACOG PB 175 — Isolated soft markers rarely warrant invasive diagnostic testing',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'abnormal_ultrasound',
    rule_key: 'us_iugr_early_severe',
    label: 'Early-onset severe IUGR (< 32 weeks)',
    description: 'Severe growth restriction before 32 weeks may have underlying chromosomal or monogenic etiology.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'MFM + Prenatal genetic counselor',
    guideline_source: 'ACOG / SMFM',
    citation: 'SMFM & ACOG — Evaluation of early-onset fetal growth restriction',
    active: true,
    approved: true,
  },

  // ---------------- INFERTILITY / RPL (ASRM / FOGSI) ----------------
  {
    pathway_id: 'infertility_rpl',
    rule_key: 'rpl_three_or_more_losses',
    label: 'Three or more clinically recognized pregnancy losses',
    description: 'Definitional recurrent pregnancy loss requiring urgent multidisciplinary genetics and REI workup.',
    threshold: 3,
    outcome: 'urgent',
    referral_target: 'REI + genetic counselor',
    guideline_source: 'ASRM / FOGSI',
    citation: 'ASRM Practice Committee 2020 & FOGSI — Evaluation of Recurrent Pregnancy Loss',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'infertility_rpl',
    rule_key: 'rpl_two_losses',
    label: 'Two consecutive pregnancy losses',
    description: 'Two clinically recognized losses warrant genetic evaluation including parental karyotyping.',
    threshold: 2,
    outcome: 'routine',
    referral_target: 'REI + genetic counselor',
    guideline_source: 'ASRM / FOGSI',
    citation: 'ASRM 2020 & FOGSI Recommendations — Evaluation of two consecutive clinical losses',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'infertility_rpl',
    rule_key: 'rpl_parental_karyotype_abnormal',
    label: 'Known parental karyotype abnormality (e.g. balanced translocation / inversion)',
    description: 'Parental structural chromosomal rearrangements markedly increase miscarriage and unbalanced gamete risk.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'Genetic counselor + REI (PGT-SR)',
    guideline_source: 'ASRM',
    citation: 'ASRM Practice Committee — Parental karyotype abnormalities and PGT-SR indications',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'infertility_rpl',
    rule_key: 'rpl_azoospermia',
    label: 'Azoospermia or severe oligospermia (male factor)',
    description: 'Karyotype (Klinefelter) and Y-chromosome microdeletion (AZF) testing indicated.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Male-factor genetic counselor',
    guideline_source: 'ASRM',
    citation: 'ASRM & AUA — Genetic evaluation of male factor infertility and non-obstructive azoospermia',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'infertility_rpl',
    rule_key: 'rpl_poi',
    label: 'Primary ovarian insufficiency (< 40 years)',
    description: 'Karyotype (Turner mosaicism) and FMR1 premutation carrier testing indicated.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'REI + genetic counselor',
    guideline_source: 'ASRM',
    citation: 'ASRM Practice Committee — Evaluation of Primary Ovarian Insufficiency',
    active: true,
    approved: true,
  },

  // ---------------- FAMILY HISTORY (ACMG / FOGSI / ACOG) ----------------
  {
    pathway_id: 'family_history',
    rule_key: 'fh_first_degree_reproductive_planning',
    label: 'First-degree relative affected + reproductive planning / active pregnancy',
    description: 'Preconception or early pregnancy counseling with targeted carrier/diagnostic testing for close relative condition.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'Prenatal genetic counselor',
    guideline_source: 'ACOG / FOGSI',
    citation: 'ACOG & FOGSI GCPR — Preconception counseling with documented first-degree heritable disorder',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'family_history',
    rule_key: 'fh_first_degree',
    label: 'First-degree relative with known genetic condition',
    description: 'Parent, sibling, or child with a diagnosed or documented heritable monogenic condition.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Genetic counselor',
    guideline_source: 'ACMG',
    citation: 'ACMG & NSGC — Indications for genetic counseling based on first-degree pedigree history',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'family_history',
    rule_key: 'fh_second_degree_multiple',
    label: 'Multiple second-degree relatives affected',
    description: 'Multi-generational pedigree pattern suggestive of mendelian segregation.',
    threshold: null,
    outcome: 'routine',
    referral_target: 'Genetic counselor',
    guideline_source: 'ACMG',
    citation: 'ACMG — Multi-generational family history evaluation and cascade triage',
    active: true,
    approved: true,
  },
  {
    pathway_id: 'family_history',
    rule_key: 'fh_severe_condition',
    label: 'Severe / life-limiting condition in close relative',
    description: 'Severe neurological, metabolic, or pediatric phenotype warrants expedited clinical genetics assessment.',
    threshold: null,
    outcome: 'urgent',
    referral_target: 'Genetic counselor',
    guideline_source: 'ACMG',
    citation: 'ACMG — Severity-based referral triage in clinical genetics',
    active: true,
    approved: true,
  },
]

/** Historical value meanings, retained for backward read compatibility */
export interface LegacyStructuredFormState {
  hcrPersonalCancer: 'none' | 'active_surgical_planning' | 'prior_breast_ovarian_endometrial'
  hcrKnownFamilialMutation: boolean
  hcrFirstDegreeEarlyBreastOrOvarian: boolean
  hcrMultipleRelativesOrPancreaticMaleBreast: boolean
  hcrAshkenaziAncestry: boolean
  hcrLimitedFamilyOrSingleSecondDegree: boolean
  hcrRelativeDetails: string
  pcsPatientStatus: 'negative' | 'ar_carrier_positive' | 'xlinked_carrier_positive' | 'vus_or_mild_allele'
  pcsPartnerStatus: 'negative' | 'concordant_positive' | 'pending_or_untested' | 'not_applicable'
  pcsIsPregnant: boolean
  pcsGeneVariantText: string
  niptFinding: 'low_risk' | 'high_risk_common_trisomy' | 'high_risk_sca_or_rat' | 'repeat_low_ff_or_microdeletion' | 'single_early_nocall'
  niptFetalFraction: string
  niptEstimatedPpv: string
  niptGestationalWeeks: string
  usFindingCategory: 'normal_scan' | 'major_structural_or_nt_ge_3' | 'multiple_soft_markers' | 'isolated_high_lr_soft_marker_unscreened' | 'isolated_sua_utd_eif_with_neg_nipt'
  usPriorScreening: 'low_risk_cfdna' | 'unscreened' | 'high_risk_screen'
  usMeasurementNote: string
  rplClinicalLosses: '0_or_1' | '2_or_more_clinical' | 'biochemical_only'
  rplCytogenetics: 'none_or_normal' | 'parental_translocation_or_abnormal_poc'
  rplReproductiveFactor: 'none' | 'poi_under_40_or_severe_male_factor' | 'unexplained_infertility'
  rplActiveIvfCycle: boolean
  fhxRelativeDegree: 'first_degree' | 'second_degree' | 'third_degree_or_distant'
  fhxConditionType: 'known_monogenic_or_xlinked' | 'id_mca_or_consanguinity' | 'distant_unverified_or_multifactorial' | 'negative_history'
  fhxIsPregnant: boolean
  fhxDisorderName: string
}

export type StructuredFormState = Record<string, string | number | boolean | string[] | undefined>

/** Maps various slug formats to the canonical pathway id used in rules */
export function normalizePathwayId(slug: string): string {
  const s = slug.toLowerCase().replace(/-/g, '_')
  if (s.includes('cancer')) return 'hereditary_cancer'
  if (s.includes('carrier')) return 'carrier_screening'
  if (s.includes('nipt')) return 'nipt_results'
  if (s.includes('ultrasound')) return 'abnormal_ultrasound'
  if (s.includes('infertility') || s.includes('rpl')) return 'infertility_rpl'
  if (s.includes('family')) return 'family_history'
  return s
}

function normalizeBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase()
    return s === 'true' || s === 'yes' || s === '1'
  }
  if (typeof val === 'number') return val > 0
  return false
}

function normalizeNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return Number.isFinite(num) ? num : null
}

function normalizeArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String)
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {}
    return val.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

/** Normalizes raw intake / legacy form inputs to canonical keys */
export function buildConcatenatedFeatures(pathway: string, inputs: Record<string, unknown>): string {
  const norm = normalizeInputs(pathway, inputs)
  const tokens: string[] = []

  switch (pathway) {
    case 'preconception-carrier-screening':
    case 'carrier_screening': {
      if (norm.consanguinity) tokens.push('consanguinity: true (consanguineous partnership)')
      if (norm.both_partners_same_carrier) tokens.push('both_partners_same_carrier: true (25% autosomal recessive risk)')
      if (norm.one_partner_carrier) tokens.push('one_partner_carrier: true')
      if (Array.isArray(norm.reported_ancestries) && norm.reported_ancestries.length > 0) {
        tokens.push(`reported_ancestries: ${norm.reported_ancestries.join(', ')}`)
      } else if (Array.isArray(norm.ancestries) && norm.ancestries.length > 0) {
        tokens.push(`reported_ancestries: ${norm.ancestries.join(', ')}`)
      }
      break
    }
    case 'nipt-results':
    case 'nipt_results': {
      if (norm.result_type) tokens.push(`result_type: ${norm.result_type}`)
      if (norm.fetal_fraction_percentage !== undefined) tokens.push(`fetal_fraction_percentage: ${norm.fetal_fraction_percentage}%`)
      else if (norm.fetal_fraction !== undefined) tokens.push(`fetal_fraction_percentage: ${norm.fetal_fraction}%`)
      if (norm.no_call_flag || norm.no_call) tokens.push('no_call_flag: true (low fetal fraction or uninformative assay)')
      if (norm.discordant_with_ultrasound) tokens.push('discordant_with_ultrasound: true')
      break
    }
    case 'abnormal-ultrasound-findings':
    case 'abnormal_ultrasound': {
      if (norm.gestational_age_weeks) tokens.push(`gestational_age_weeks: ${norm.gestational_age_weeks}`)
      if (norm.nuchal_translucency_mm) tokens.push(`nuchal_translucency_mm: ${norm.nuchal_translucency_mm}`)
      if (norm.major_structural_anomaly || norm.structural_anomaly) tokens.push('major_structural_anomaly: true (identified on anatomy scan)')
      if (Array.isArray(norm.soft_markers_array) && norm.soft_markers_array.length > 0) {
        tokens.push(`soft_markers_array: ${norm.soft_markers_array.join(', ')}`)
      } else if (Array.isArray(norm.soft_markers) && norm.soft_markers.length > 0) {
        tokens.push(`soft_markers_array: ${norm.soft_markers.join(', ')}`)
      }
      break
    }
    case 'infertility-recurrent-pregnancy-loss':
    case 'infertility_rpl': {
      const losses = norm.clinically_recognized_losses ?? norm.pregnancy_loss_count
      if (losses !== undefined) tokens.push(`clinically_recognized_losses: ${losses}`)
      if (norm.known_parental_karyotype_abnormality || norm.parental_karyotype_abnormal) {
        tokens.push('known_parental_karyotype_abnormality: true (balanced reciprocal or Robertsonian translocation)')
      }
      if (norm.primary_ovarian_insufficiency_under_40 || norm.primary_ovarian_insufficiency) {
        tokens.push('primary_ovarian_insufficiency_under_40: true')
      }
      break
    }
    case 'positive-family-history':
    case 'family_history': {
      if (norm.condition_omim_id) tokens.push(`condition_omim_id: ${norm.condition_omim_id}`)
      if (norm.closest_affected_degree) tokens.push(`closest_affected_degree: ${norm.closest_affected_degree}`)
      if (norm.reproductive_planning_status || norm.reproductive_planning) {
        tokens.push('reproductive_planning_status: true (actively planning or pregnant)')
      }
      if (norm.multiple_affected) tokens.push('multiple_affected_relatives: true')
      break
    }
    default: {
      if (norm.personal_breast_cancer_age) tokens.push(`personal_breast_cancer_age: ${norm.personal_breast_cancer_age}`)
      if (norm.personal_ovarian_cancer) tokens.push('personal_ovarian_cancer: true')
      if (norm.ashkenazi_ancestry) tokens.push('ashkenazi_ancestry: true')
      if (norm.family_breast_cancer_first_degree_count) tokens.push(`family_breast_cancer_first_degree_count: ${norm.family_breast_cancer_first_degree_count}`)
      if (norm.family_colon_cancer_count) tokens.push(`family_colon_cancer_count: ${norm.family_colon_cancer_count}`)
      break
    }
  }

  return tokens.length > 0 ? tokens.join('; ') : 'routine baseline non-elevated parameters'
}

export function normalizeInputs(pathwayId: string, raw: Record<string, unknown>): Record<string, unknown> {
  const norm: Record<string, unknown> = { ...raw }

  // Carrier Screening
  if (norm.consanguinity === undefined && (raw.pcsRelatedPartnersRaw || raw.fhxConsanguinityRaw)) {
    norm.consanguinity = normalizeBoolean(raw.pcsRelatedPartnersRaw || raw.fhxConsanguinityRaw)
  }
  if (norm.both_partners_same_carrier === undefined && raw.pcsPartnerStatus === 'concordant_positive') {
    norm.both_partners_same_carrier = true
  }
  if (norm.one_partner_carrier === undefined && (raw.pcsPatientStatus === 'ar_carrier_positive' || raw.pcsPatientStatus === 'xlinked_carrier_positive')) {
    norm.one_partner_carrier = true
  }
  if (norm.ancestries === undefined && raw.reported_ancestries) {
    norm.ancestries = raw.reported_ancestries
  }

  // Cancer Risk
  if (norm.personal_breast_cancer === undefined && raw.hcrCancerHistoryRaw === 'Cancer reported') {
    const site = String(raw.hcrPrimarySiteRaw || '').toLowerCase()
    if (site.includes('breast')) norm.personal_breast_cancer = true
    if (site.includes('ovarian') || site.includes('fallopian') || site.includes('peritoneal')) norm.personal_ovarian_cancer = true
  }
  if (norm.personal_breast_cancer === undefined && (raw.hcrPersonalBreastUnder50 || raw.hcrPersonalCancer === 'prior_breast_ovarian_endometrial')) {
    norm.personal_breast_cancer = true
  }
  if (norm.personal_breast_cancer_age === undefined && raw.hcrDiagnosisAgeRaw) {
    norm.personal_breast_cancer_age = normalizeNumber(raw.hcrDiagnosisAgeRaw)
  }
  if (norm.personal_breast_cancer === undefined && (norm.personal_breast_cancer_age !== undefined && Number(norm.personal_breast_cancer_age) > 0)) {
    norm.personal_breast_cancer = true
  }

  // Ultrasound
  if (norm.nuchal_translucency_mm === undefined && raw.usNtMeasurementRaw) {
    norm.nuchal_translucency_mm = normalizeNumber(raw.usNtMeasurementRaw)
  }
  if (norm.structural_anomaly === undefined) {
    if (raw.major_structural_anomaly !== undefined) {
      norm.structural_anomaly = normalizeBoolean(raw.major_structural_anomaly)
    } else if (raw.usFindingCategory === 'major_structural_or_nt_ge_3') {
      norm.structural_anomaly = true
    }
  }
  if (norm.soft_markers === undefined && raw.soft_markers_array) {
    norm.soft_markers = raw.soft_markers_array
  }

  // NIPT
  if (norm.fetal_fraction === undefined && raw.fetal_fraction_percentage !== undefined) {
    norm.fetal_fraction = raw.fetal_fraction_percentage
  }
  if (norm.no_call === undefined && raw.no_call_flag !== undefined) {
    norm.no_call = raw.no_call_flag
  }
  if (norm.result_type === undefined && raw.niptFinding) {
    const f = String(raw.niptFinding)
    if (f === 'high_risk_common_trisomy') norm.result_type = 't21_positive'
    else if (f === 'high_risk_sca_or_rat') norm.result_type = 'sex_chromosome_positive'
    else if (f === 'repeat_low_ff_or_microdeletion') norm.result_type = 'microdeletion_positive'
    else if (f === 'single_early_nocall') norm.no_call = true
  } else if (norm.result_type) {
    const r = String(norm.result_type).toUpperCase()
    if (r === 'HIGH_RISK_T21') norm.result_type = 't21_positive'
    else if (r === 'HIGH_RISK_T18') norm.result_type = 't18_positive'
    else if (r === 'HIGH_RISK_T13') norm.result_type = 't13_positive'
    else if (r === 'SEX_CHROMOSOME_ANEUPLOIDY') norm.result_type = 'sex_chromosome_positive'
    else if (r === 'MICRODELETION_22Q11') norm.result_type = 'microdeletion_positive'
    else if (r === 'LOW_RISK') norm.result_type = 'negative'
  }

  // Infertility / RPL
  if (norm.pregnancy_loss_count === undefined) {
    if (raw.clinically_recognized_losses !== undefined) {
      norm.pregnancy_loss_count = normalizeNumber(raw.clinically_recognized_losses)
    } else if (raw.rplClinicalLosses === '2_or_more_clinical') {
      norm.pregnancy_loss_count = 2
    }
  }
  if (norm.parental_karyotype_abnormal === undefined && raw.known_parental_karyotype_abnormality !== undefined) {
    norm.parental_karyotype_abnormal = normalizeBoolean(raw.known_parental_karyotype_abnormality)
  }
  if (norm.primary_ovarian_insufficiency === undefined && raw.primary_ovarian_insufficiency_under_40 !== undefined) {
    norm.primary_ovarian_insufficiency = normalizeBoolean(raw.primary_ovarian_insufficiency_under_40)
  }

  // Family History
  if (norm.condition_name === undefined && raw.condition_omim_id) {
    norm.condition_name = String(raw.condition_omim_id)
  }
  if (norm.reproductive_planning === undefined && raw.reproductive_planning_status !== undefined) {
    norm.reproductive_planning = normalizeBoolean(raw.reproductive_planning_status)
  }
  if (norm.closest_affected_degree === undefined && raw.fhxRelativeDegree) {
    const d = String(raw.fhxRelativeDegree)
    if (d.includes('first')) norm.closest_affected_degree = 'first'
    else if (d.includes('second')) norm.closest_affected_degree = 'second'
    else if (d.includes('third')) norm.closest_affected_degree = 'third'
  } else if (norm.closest_affected_degree !== undefined) {
    const d = String(norm.closest_affected_degree)
    if (d === '1') norm.closest_affected_degree = 'first'
    else if (d === '2') norm.closest_affected_degree = 'second'
    else if (d === '3') norm.closest_affected_degree = 'third'
  }

  return norm
}

function _fires(criteria: CriterionDefinition[], rule_key: string): CriterionDefinition | null {
  for (const c of criteria) {
    if (c.rule_key === rule_key && (c.active !== false) && (c.approved !== false)) {
      return c
    }
  }
  return null
}

function _match(c: CriterionDefinition): MatchedCriterion {
  return {
    rule_key: c.rule_key,
    label: c.label,
    description: c.description,
    outcome: c.outcome,
    referral_target: c.referral_target,
    guideline_source: c.guideline_source,
    citation: c.citation,
    threshold: c.threshold,
  }
}

const RULE_CPT_MAP: Record<string, string[]> = {
  hereditary_cancer: ['81162', '81216', '96040'],
  'hereditary-cancer-risk': ['81162', '81216', '96040'],
  carrier_screening: ['81443', '96040'],
  'preconception-carrier-screening': ['81443', '96040'],
  nipt_results: ['59000', '88235', '81228'],
  'nipt-results': ['59000', '88235', '81228'],
  abnormal_ultrasound: ['76811', '81229', '93325'],
  'abnormal-ultrasound-findings': ['76811', '81229', '93325'],
  infertility_rpl: ['88230', '88262', '96040'],
  'infertility-recurrent-pregnancy-loss': ['88230', '88262', '96040'],
  family_history: ['96040', '81400'],
  'positive-family-history': ['96040', '81400'],
}

const RULE_ICD10_MAP: Record<string, string[]> = {
  hereditary_cancer: ['Z15.01', 'Z80.3'],
  'hereditary-cancer-risk': ['Z15.01', 'Z80.3'],
  carrier_screening: ['Z31.430', 'Z84.81'],
  'preconception-carrier-screening': ['Z31.430', 'Z84.81'],
  nipt_results: ['O35.1XX0', 'Z36.81'],
  'nipt-results': ['O35.1XX0', 'Z36.81'],
  abnormal_ultrasound: ['O35.2XX0', 'O35.8XX0'],
  'abnormal-ultrasound-findings': ['O35.2XX0', 'O35.8XX0'],
  infertility_rpl: ['N96', 'Z87.52'],
  'infertility-recurrent-pregnancy-loss': ['N96', 'Z87.52'],
  family_history: ['Z84.89', 'Z31.5'],
  'positive-family-history': ['Z84.89', 'Z31.5'],
}

const COUNSELING_POINTS_MAP: Record<string, string[]> = {
  hereditary_cancer: [
    'Discuss high penetrance BRCA1/2 and secondary hereditary cancer risks.',
    'Advise enhanced breast MRI surveillance starting at age 25 or 10 years earlier than youngest family diagnosis.',
    'Offer risk-reducing bilateral salpingo-oophorectomy considerations between ages 35-40.',
  ],
  'hereditary-cancer-risk': [
    'Discuss high penetrance BRCA1/2 and secondary hereditary cancer risks.',
    'Advise enhanced breast MRI surveillance starting at age 25 or 10 years earlier than youngest family diagnosis.',
    'Offer risk-reducing bilateral salpingo-oophorectomy considerations between ages 35-40.',
  ],
  carrier_screening: [
    'Consanguinity or dual carrier status increases risk for rare autosomal recessive conditions.',
    'Review preimplantation genetic testing for monogenic defects (PGT-M) or prenatal diagnostic options (CVS/amniocentesis).',
  ],
  'preconception-carrier-screening': [
    'Consanguinity or dual carrier status increases risk for rare autosomal recessive conditions.',
    'Review preimplantation genetic testing for monogenic defects (PGT-M) or prenatal diagnostic options (CVS/amniocentesis).',
  ],
  nipt_results: [
    'NIPT is a screening test; diagnostic confirmation via amniocentesis (CMA/karyotype) is indicated.',
    'Fetal fraction <4% requires detailed anatomy ultrasound before redraw.',
  ],
  'nipt-results': [
    'NIPT is a screening test; diagnostic confirmation via amniocentesis (CMA/karyotype) is indicated.',
    'Fetal fraction <4% requires detailed anatomy ultrasound before redraw.',
  ],
  abnormal_ultrasound: [
    'NT >= 3.5mm confers high risk for aneuploidies, Noonan spectrum, and major congenital cardiac defects.',
    'Chromosomal microarray analysis (CMA) provides 6-10% higher diagnostic yield than G-banded karyotype.',
  ],
  'abnormal-ultrasound-findings': [
    'NT >= 3.5mm confers high risk for aneuploidies, Noonan spectrum, and major congenital cardiac defects.',
    'Chromosomal microarray analysis (CMA) provides 6-10% higher diagnostic yield than G-banded karyotype.',
  ],
  infertility_rpl: [
    '2-5% of couples with recurrent pregnancy loss harbor a balanced reciprocal or Robertsonian translocation.',
    'Identification of parental translocation guides preimplantation genetic testing for structural rearrangements (PGT-SR).',
  ],
  'infertility-recurrent-pregnancy-loss': [
    '2-5% of couples with recurrent pregnancy loss harbor a balanced reciprocal or Robertsonian translocation.',
    'Identification of parental translocation guides preimplantation genetic testing for structural rearrangements (PGT-SR).',
  ],
  family_history: [
    'Obtain proband documentation to verify the exact pathogenic sequence variant prior to testing at-risk relatives.',
    'Determine mendelian inheritance pattern (AD, AR, X-linked, or mitochondrial).',
  ],
  'positive-family-history': [
    'Obtain proband documentation to verify the exact pathogenic sequence variant prior to testing at-risk relatives.',
    'Determine mendelian inheritance pattern (AD, AR, X-linked, or mitochondrial).',
  ],
}

export function computeTimeCriticalContext(
  pathwayId: string,
  inputs: Record<string, unknown>,
): TimeCriticalContext {
  const isPrenatal = [
    'nipt_results',
    'abnormal_ultrasound',
    'carrier_screening',
    'nipt-results',
    'abnormal-ultrasound-findings',
    'preconception-carrier-screening',
  ].includes(pathwayId)
  const gaRaw =
    inputs.gestational_age ??
    inputs.gestational_age_weeks ??
    inputs.ga_weeks ??
    inputs.ga ??
    inputs.aufGestationalAgeWeeks ??
    inputs.niptGestationalAge
  const ga = typeof gaRaw === 'number' ? gaRaw : parseFloat(String(gaRaw || ''))
  const isPregnant = Boolean(inputs.pregnant || inputs.is_pregnant || (!isNaN(ga) && ga > 0))

  const ctx: TimeCriticalContext = {
    is_pregnant: isPregnant,
    pcpndt_notice: isPrenatal
      ? 'STATUTORY COMPLIANCE: PRE-CONCEPTION & PRE-NATAL DIAGNOSTIC TECHNIQUES (PC&PNDT) ACT, 1994 — Pre-natal determination and disclosure of the sex of the fetus is strictly prohibited by law. GenoBridge strictly enforces PC&PNDT compliance; fetal sex is never determined, stored, or revealed.'
      : undefined,
  }

  if (isPregnant && !isNaN(ga) && ga > 0) {
    ctx.gestational_age_weeks = ga
    const currentDays = Math.round(ga * 7)
    const cvsMaxDays = 14 * 7 - 1 // 13w6d = 97 days
    const amnioMinDays = 15 * 7 // 15w0d = 105 days
    const mtp20wDays = 20 * 7 // 140 days
    const mtp24wDays = 24 * 7 // 168 days

    ctx.days_to_cvs_deadline = Math.max(0, cvsMaxDays - currentDays)
    ctx.days_to_amnio_window = Math.max(0, amnioMinDays - currentDays)
    ctx.days_to_mtp_20w_limit = Math.max(0, mtp20wDays - currentDays)
    ctx.days_to_mtp_24w_limit = Math.max(0, mtp24wDays - currentDays)

    if (ga < 14) {
      ctx.urgency_deadline = `CVS diagnostic window closing: ${ctx.days_to_cvs_deadline} days remaining (13w6d limit).`
    } else if (ga <= 24) {
      ctx.urgency_deadline = `MTP Act (2021) legal benchmark: ${ctx.days_to_mtp_24w_limit} days remaining before 24-week statutory threshold.`
    } else {
      ctx.urgency_deadline = `Gestational Age > 24 weeks. State Medical Board approval mandatory under Section 3(2B) MTP Act (2021) for severe fetal abnormalities.`
    }

    ctx.mtp_notice = `MTP Act (2021) Clinical Benchmark: Gestational age is ${ga.toFixed(1)} weeks. Statutory limits: 20 weeks (opinion of 1 RMP), 24 weeks for defined categories / fetal abnormalities (2 RMPs / Medical Board). Beyond 24 weeks requires Medical Board review.`
  }

  return ctx
}

export function computeCounterfactuals(
  pathwayId: string,
  inputs: Record<string, unknown>,
  tier: StandardTier,
): Counterfactual[] {
  const list: Counterfactual[] = []
  if (pathwayId.includes('cancer')) {
    if (tier === 'URGENT' || tier === 'PRIORITY') {
      list.push({
        factor: 'Personal breast cancer diagnosis age',
        current_value: inputs.personal_breast_cancer_age
          ? `<= 50 (${inputs.personal_breast_cancer_age}y)`
          : 'Reported early-onset',
        alternate_value: 'Diagnosis age > 50 with no high-risk histology',
        resulting_tier: 'ROUTINE',
        explanation:
          'If age of onset exceeded 50 years without high-risk histology or family clustering, NCCN testing criteria would fall to standard routine population risk.',
      })
      list.push({
        factor: 'Known familial mutation in BRCA1/2, PALB2, or Lynch gene',
        current_value: inputs.known_familial_mutation ? 'Present' : 'Not recorded',
        alternate_value: 'Absent (tested negative in relative)',
        resulting_tier: 'COUNSEL_AND_REASSESS',
        explanation:
          'Absence of known familial pathogenic variants and early-onset disease reduces referral priority to routine surveillance.',
      })
    }
  } else if (pathwayId.includes('carrier')) {
    if (inputs.consanguinity || inputs.pcsConsanguinity) {
      list.push({
        factor: 'Consanguineous partnership',
        current_value: 'Present (second-degree cousin or closer)',
        alternate_value: 'Non-consanguineous union',
        resulting_tier: 'ROUTINE',
        explanation:
          'If consanguinity were absent, homozygous autosomal recessive risk decreases significantly; tier would become Routine carrier screening.',
      })
    }
    if (inputs.both_partners_same_carrier || inputs.pcsPartnerStatus === 'concordant_positive') {
      list.push({
        factor: 'Dual carrier status for identical condition',
        current_value: 'Both partners confirmed carriers (25% fetal recurrence)',
        alternate_value: 'Only one partner is a carrier',
        resulting_tier: 'ROUTINE',
        explanation:
          'If the partner is non-carrier, risk of affected pregnancy drops to near-zero; invasive prenatal diagnosis is not required.',
      })
    }
  } else if (pathwayId.includes('nipt')) {
    if (tier === 'URGENT') {
      list.push({
        factor: 'Cell-free DNA screening risk finding',
        current_value: 'High-risk cfDNA aneuploidy finding',
        alternate_value: 'Low-risk cfDNA result',
        resulting_tier: 'COUNSEL_AND_REASSESS',
        explanation:
          'If cfDNA were low-risk without ultrasound discordance, referral would not be indicated; patient would receive standard obstetric monitoring.',
      })
    }
  } else if (pathwayId.includes('ultrasound')) {
    if (inputs.cystic_hygroma || inputs.fetal_hydrops || inputs.major_structural_anomaly) {
      list.push({
        factor: 'Major structural defect or cystic hygroma',
        current_value: 'Present on ultrasound scan',
        alternate_value: 'Absent (isolated minor finding only)',
        resulting_tier: 'COUNSEL_AND_REASSESS',
        explanation:
          'If structural malformations and hydrops were absent, urgency would reduce from Urgent to Routine or Counsel & Reassess.',
      })
    }
  } else if (pathwayId.includes('infertility') || pathwayId.includes('rpl')) {
    const losses = Number(
      inputs.recurrent_losses_count ||
        inputs.pregnancy_loss_count ||
        inputs.irplLossesCount ||
        0,
    )
    if (losses >= 2) {
      list.push({
        factor: 'Recurrent pregnancy loss count',
        current_value: `${losses} documented clinical losses`,
        alternate_value: '< 2 pregnancy losses',
        resulting_tier: 'COUNSEL_AND_REASSESS',
        explanation:
          'If loss count were less than 2, ASRM diagnostic criteria for RPL workup would not be met; standard obstetrical reassurance indicated.',
      })
    }
  } else if (pathwayId.includes('family')) {
    if (inputs.known_familial_variant || inputs.known_familial_mutation) {
      list.push({
        factor: 'Documented pathogenic familial variant',
        current_value: 'Present in relative',
        alternate_value: 'No known familial pathogenic mutation',
        resulting_tier: 'ROUTINE',
        explanation:
          'In the absence of a verified familial pathogenic variant, single-site cascade testing is not applicable; tier would be Routine surveillance.',
      })
    }
  }
  return list
}

export function computeMissingGaps(
  pathwayId: string,
  inputs: Record<string, unknown>,
): MissingInputGap[] {
  const gaps: MissingInputGap[] = []
  if (pathwayId.includes('cancer')) {
    if (
      inputs.known_familial_mutation === undefined &&
      inputs.hcrKnownFamilialMutation === undefined
    ) {
      gaps.push({
        rule_id: 'hc_known_familial_variant',
        rule_label: 'Known Familial Pathogenic Variant Status',
        potential_tier: 'PRIORITY',
        missing_fields: ['known_familial_mutation'],
        guideline_citation:
          'NCCN Genetics: Relatives with known pathogenic mutation (BRCA1/2, PALB2, Lynch)',
      })
    }
  } else if (pathwayId.includes('carrier')) {
    if (inputs.partner_tested === undefined && inputs.pcsPartnerStatus === undefined) {
      gaps.push({
        rule_id: 'cs_both_carriers_same_gene',
        rule_label: 'Partner Carrier Testing Status',
        potential_tier: 'URGENT',
        missing_fields: ['partner_tested', 'both_partners_same_carrier'],
        guideline_citation:
          'ACOG CO 691 / FOGSI: Partner testing is mandatory when maternal carrier identified',
      })
    }
  } else if (pathwayId.includes('nipt')) {
    if (inputs.fetal_fraction === undefined && inputs.niptFetalFraction === undefined) {
      gaps.push({
        rule_id: 'nipt_low_fetal_fraction',
        rule_label: 'Fetal Fraction (%) Percentage',
        potential_tier: 'PRIORITY',
        missing_fields: ['fetal_fraction'],
        guideline_citation:
          'ACOG PB 226: Fetal fraction <4% carries increased aneuploidy / triploidy risk',
      })
    }
  } else if (pathwayId.includes('ultrasound')) {
    if (
      inputs.nuchal_translucency_mm === undefined &&
      inputs.aufNuchalTranslucencyMm === undefined
    ) {
      gaps.push({
        rule_id: 'us_increased_nt',
        rule_label: 'Nuchal Translucency (NT in mm)',
        potential_tier: 'PRIORITY',
        missing_fields: ['nuchal_translucency_mm'],
        guideline_citation:
          'ISUOG / FMF: NT >= 3.0 mm is primary indication for diagnostic karyotype/CMA',
      })
    }
  } else if (pathwayId.includes('infertility') || pathwayId.includes('rpl')) {
    if (
      inputs.parental_karyotype_abnormal === undefined &&
      inputs.irplPriorKaryotypeAbnormal === undefined
    ) {
      gaps.push({
        rule_id: 'rpl_parental_karyotype_abnormal',
        rule_label: 'Parental Peripheral Blood Karyotype Results',
        potential_tier: 'PRIORITY',
        missing_fields: ['parental_karyotype_abnormal'],
        guideline_citation:
          'ASRM RPL Guidelines: 3-5% of couples with RPL carry a balanced reciprocal translocation',
      })
    }
  } else if (pathwayId.includes('family')) {
    if (inputs.sudden_cardiac_death_under_40 === undefined) {
      gaps.push({
        rule_id: 'fh_sudden_unexplained_cardiac_death',
        rule_label: 'Family History of Sudden Premature Death (<40y)',
        potential_tier: 'PRIORITY',
        missing_fields: ['sudden_cardiac_death_under_40'],
        guideline_citation:
          'HRS / ACMG: Sudden unexpected death <40 indicates inherited channelopathy/cardiomyopathy',
      })
    }
  }
  return gaps
}

export function generateBilingualPatientSummary(
  pathwayId: string,
  tier: StandardTier,
  referralTarget: string,
  firedRules: FiredRule[],
): { summary_en: string; summary_hi: string } {
  const reasonTextEn =
    firedRules.length > 0
      ? firedRules.map((r) => r.label).join(', ')
      : 'Standard routine clinical health evaluation'

  const summary_en = `### Patient Guidance Note (Doctor Review Required)
**Why this referral is suggested:**
Your doctor has recommended a consultation with a ${referralTarget} based on verified clinical practice guidelines regarding: ${reasonTextEn}. This is not a diagnosis of disease, but a specialist appointment to discuss testing choices and care options for you and your family.

**What to bring to your consultation:**
- All prior blood test reports, ultrasound scan images, and laboratory summaries.
- Family health background details (any illnesses, ages of diagnoses, or prior test reports in blood relatives).
- A written list of your questions and any current medications.

**Questions you can ask your specialist:**
1. What does this guideline referral mean for me or my pregnancy?
2. What further tests are available, and what are their benefits and limitations?
3. What steps can we take to protect our family's health?

**What to expect during the visit:**
The genetics specialist will review your personal and family medical history in a friendly, confidential setting. They will explain available options clearly so that you can make informed decisions in your own time.`

  const summary_hi = `### रोगी सूचना एवं मार्गदर्शन पत्र (चिकित्सक समीक्षा आवश्यक)
**विशेषज्ञ परामर्श का कारण:**
आपके चिकित्सक ने क्लिनिकल दिशा-निर्देशों के आधार पर ${referralTarget} से परामर्श की अनुशंसा की है (${reasonTextEn})। यह किसी बीमारी का अंतिम निदान नहीं है, बल्कि आपके और आपके परिवार के स्वास्थ्य के लिए सर्वोत्तम जांच व देखभाल विकल्पों पर चर्चा हेतु एक मार्गदर्शक परामर्श है।

**परामर्श में क्या साथ लाएं:**
- पूर्व के सभी अल्ट्रासाउंड स्कैन, रक्त जांच और प्रयोगशाला रिपोर्ट।
- परिवार के स्वास्थ्य का विवरण (रक्त संबंधियों में हुई बीमारियां और उनकी आयु)।
- अपने प्रश्नों की सूची और वर्तमान में ली जा रही दवाओं के विवरण।

**परामर्शदाता से पूछे जाने वाले मुख्य प्रश्न:**
1. इस परामर्श का मेरे या मेरे गर्भस्थ शिशु के स्वास्थ्य के लिए क्या महत्व है?
2. आगे कौन-सी जांचें उपलब्ध हैं और उनके क्या लाभ हैं?
3. परिवार के भविष्य के स्वास्थ्य हेतु हम क्या कदम उठा सकते हैं?

**परामर्श सत्र में क्या होगा:**
आनुवंशिक विशेषज्ञ (जेनेटिक काउंसलर) पूरी गोपनीयता और संवेदनशीलता के साथ आपकी स्वास्थ्य पृष्ठभूमि को समझेंगे। वे सभी उपलब्ध विकल्पों को सरल भाषा में स्पष्ट करेंगे ताकि आप सोच-समझकर निर्णय ले सकें।`

  return { summary_en, summary_hi }
}

function _pickHighest(
  matches: MatchedCriterion[],
  pathwayId: string,
  input: Record<string, unknown> = {},
): DecisionResult {
  const timeCtx = computeTimeCriticalContext(pathwayId, input)
  const gaps = computeMissingGaps(pathwayId, input)

  if (!matches || matches.length === 0) {
    const isBlank = Object.keys(input).length === 0 || Object.values(input).every((v) => v === '' || v === null || v === undefined || v === false)
    const tier: StandardTier = isBlank ? 'INSUFFICIENT_DATA' : 'COUNSEL_AND_REASSESS'
    const target = 'Routine Obstetric & Primary Healthcare'
    const { summary_en, summary_hi } = generateBilingualPatientSummary(pathwayId, tier, target, [])

    return {
      outcome: 'no_referral',
      clinical_decision: 'no_referral_needed',
      tier,
      referral_target: target,
      matched_criteria: [],
      fired_rules: [],
      not_fired_rules_with_missing_inputs: gaps,
      counterfactuals: [],
      time_critical_context: timeCtx,
      explanation:
        'No referral criteria met under current FOGSI, ACOG, ACMG, ASRM, or NCCN clinical standards. Routine prenatal / obstetric care recommended.',
      guideline_citations: [
        'ACOG / NCCN / ACMG / ASRM / FOGSI Clinical Practice Guidelines (2024–2025)',
      ],
      pathway_id: pathwayId,
      confidence_score: 0.99,
      matched_rule_id: 'STD-CARE-00',
      cpt_codes: ['99213'],
      icd10_codes: ['Z34.90'],
      counseling_points: ['Patient is eligible for standard routine monitoring.'],
      patient_summary_en: summary_en,
      patient_summary_hi: summary_hi,
    }
  }

  const sorted = [...matches].sort(
    (a, b) => (URGENCY_RANK[b.outcome] || 0) - (URGENCY_RANK[a.outcome] || 0),
  )
  const top = sorted[0]
  const citations = [...new Set(sorted.map((m) => `${m.guideline_source}: ${m.citation}`))]

  const topTier: StandardTier =
    top.outcome === 'urgent'
      ? 'URGENT'
      : top.outcome === 'borderline'
        ? 'PRIORITY'
        : top.outcome === 'routine'
          ? 'ROUTINE'
          : 'COUNSEL_AND_REASSESS'

  const firedRules: FiredRule[] = sorted.map((m) => ({
    id: m.rule_key,
    rule_key: m.rule_key,
    label: m.label,
    description: m.description || '',
    tier:
      m.outcome === 'urgent'
        ? 'URGENT'
        : m.outcome === 'borderline'
          ? 'PRIORITY'
          : m.outcome === 'routine'
            ? 'ROUTINE'
            : 'COUNSEL_AND_REASSESS',
    triggering_parameters: { ...input },
    guideline_source: m.guideline_source,
    citation: m.citation,
    next_steps_non_treatment: `Refer to ${m.referral_target} for comprehensive evaluation under ${m.guideline_source} recommendations.`,
  }))

  const counterfactuals = computeCounterfactuals(pathwayId, input, topTier)
  const { summary_en, summary_hi } = generateBilingualPatientSummary(
    pathwayId,
    topTier,
    top.referral_target,
    firedRules,
  )

  const explanation = `Recommendation: ${topTier} REFERRAL to ${top.referral_target}. Met criteria: ${sorted.map((m) => m.label).join('; ')}. Evaluated deterministically against published clinical practice guidelines.`

  return {
    outcome: top.outcome,
    clinical_decision: OUTCOME_MAP_TO_CLINICAL[top.outcome],
    tier: topTier,
    referral_target: top.referral_target,
    matched_criteria: sorted,
    fired_rules: firedRules,
    not_fired_rules_with_missing_inputs: gaps,
    counterfactuals,
    time_critical_context: timeCtx,
    explanation,
    guideline_citations: citations,
    pathway_id: pathwayId,
    confidence_score: top.outcome === 'urgent' ? 0.98 : 0.94,
    matched_rule_id: top.rule_key,
    cpt_codes: RULE_CPT_MAP[pathwayId] || ['96040'],
    icd10_codes: RULE_ICD10_MAP[pathwayId] || ['Z15.01'],
    counseling_points: COUNSELING_POINTS_MAP[pathwayId] || [],
    patient_summary_en: summary_en,
    patient_summary_hi: summary_hi,
  }
}

// Pathway Evaluators
export function evaluateHereditaryCancer(input: Record<string, unknown>, criteria: CriterionDefinition[]): DecisionResult {
  const matches: MatchedCriterion[] = []
  const d = input

  // Personal breast cancer young (<= 50)
  const age = normalizeNumber(d.personal_breast_cancer_age) ?? 999
  const youngRule = _fires(criteria, 'hc_personal_breast_young')
  const youngThreshold = youngRule?.threshold ?? 50
  if (
    (normalizeBoolean(d.personal_breast_cancer) ||
      d.hcrPersonalCancer === 'active_surgical_planning' ||
      d.hcrPersonalCancer === 'prior_breast_ovarian_endometrial') &&
    age <= youngThreshold
  ) {
    if (youngRule) matches.push(_match(youngRule))
  }

  // Ovarian cancer any age (self or first-degree)
  const ovarianSelf =
    normalizeBoolean(d.personal_ovarian_cancer) || d.hcrPersonalCancer === 'prior_breast_ovarian_endometrial'
  const ovarianFamily =
    (normalizeNumber(d.family_ovarian_cancer_count) ?? normalizeNumber(d.relatives_ovarian) ?? 0) >= 1
  if (ovarianSelf || ovarianFamily) {
    const c = _fires(criteria, 'hc_ovarian_any_age')
    if (c) matches.push(_match(c))
  }

  // 2+ first-degree relatives with breast cancer
  const firstDegBreast =
    normalizeNumber(d.family_breast_cancer_first_degree_count) ??
    normalizeNumber(d.relatives_breast) ??
    0
  const twoPlusRule = _fires(criteria, 'hc_two_plus_first_degree_breast')
  const twoPlusThreshold = twoPlusRule?.threshold ?? 2
  if (firstDegBreast >= twoPlusThreshold || normalizeBoolean(d.hcrFirstDegreeEarlyBreastOrOvarian)) {
    if (twoPlusRule) matches.push(_match(twoPlusRule))
  }

  // Ashkenazi Jewish + any breast/ovarian
  const aj = normalizeBoolean(d.ashkenazi_ancestry) || normalizeBoolean(d.hcrAshkenaziAncestry)
  if (aj && (normalizeBoolean(d.personal_breast_cancer) || ovarianSelf || firstDegBreast >= 1 || ovarianFamily)) {
    const c = _fires(criteria, 'hc_ashkenazi_breast_ovarian')
    if (c) matches.push(_match(c))
  }

  // Male breast cancer in family
  if (
    normalizeBoolean(d.male_breast_cancer_family) ||
    normalizeBoolean(d.hcrMultipleRelativesOrPancreaticMaleBreast)
  ) {
    const c = _fires(criteria, 'hc_male_breast_family')
    if (c) matches.push(_match(c))
  }

  // Lynch: 3+ colon cancers or endometrial + colon
  const colonCount =
    normalizeNumber(d.family_colon_cancer_count) ?? normalizeNumber(d.relatives_colorectal) ?? 0
  const lynchColonRule = _fires(criteria, 'hc_lynch_three_colon')
  if (colonCount >= (lynchColonRule?.threshold ?? 3)) {
    if (lynchColonRule) matches.push(_match(lynchColonRule))
  }
  if (
    (normalizeBoolean(d.personal_endometrial_cancer) ||
      d.hcrPersonalCancer === 'prior_breast_ovarian_endometrial') &&
    colonCount >= 1
  ) {
    const c = _fires(criteria, 'hc_lynch_endometrial_colon')
    if (c) matches.push(_match(c))
  }

  // Known familial mutation
  if (normalizeBoolean(d.known_familial_mutation) || normalizeBoolean(d.hcrKnownFamilialMutation)) {
    const c = _fires(criteria, 'hc_brca1_2_mutation') || _fires(criteria, 'hc_personal_breast_young')
    if (c) matches.push(_match(c))
  }

  return _pickHighest(matches, 'hereditary_cancer', d)
}

export function evaluateCarrierScreening(input: Record<string, unknown>, criteria: CriterionDefinition[]): DecisionResult {
  const matches: MatchedCriterion[] = []
  const d = input

  // Consanguinity
  if (normalizeBoolean(d.consanguinity) || normalizeBoolean(d.pcsConsanguinity)) {
    const c = _fires(criteria, 'cs_consanguinity')
    if (c) matches.push(_match(c))
  }

  // Both partners carriers of same condition
  if (
    normalizeBoolean(d.both_partners_same_carrier) ||
    normalizeBoolean(d.both_partners_carrier) ||
    normalizeBoolean(d.both_carriers) ||
    d.pcsPartnerStatus === 'concordant_positive'
  ) {
    const c = _fires(criteria, 'cs_both_partners_carrier')
    if (c) matches.push(_match(c))
  }

  // One partner carrier
  if (
    normalizeBoolean(d.one_partner_carrier) ||
    d.pcsPatientStatus === 'ar_carrier_positive' ||
    d.pcsPatientStatus === 'xlinked_carrier_positive'
  ) {
    const c = _fires(criteria, 'cs_one_partner_carrier')
    if (c) matches.push(_match(c))
  }

  // Ancestries
  const rawAncestries = normalizeArray(d.ancestries || d.reported_ancestries)
  const ancestries = rawAncestries.map((s) => s.toLowerCase())
  if (ancestries.some((a) => a.includes('ashkenazi'))) {
    const c = _fires(criteria, 'cs_ashkenazi')
    if (c) matches.push(_match(c))
  }
  if (
    ancestries.some((a) =>
      ['mediterranean', 'southeast_asian', 'african', 'indian', 'latino'].some((k) => a.includes(k)),
    )
  ) {
    const c = _fires(criteria, 'cs_thalassemia_ancestry')
    if (c) matches.push(_match(c))
  }

  // Family history of recessive condition
  if (
    normalizeBoolean(d.family_history_recessive_condition) ||
    normalizeBoolean(d.pcsFamilyHistoryRecessive)
  ) {
    const c = _fires(criteria, 'cs_family_recessive')
    if (c) matches.push(_match(c))
  }

  return _pickHighest(matches, 'carrier_screening', d)
}

export function evaluateNipt(input: Record<string, unknown>, criteria: CriterionDefinition[]): DecisionResult {
  const matches: MatchedCriterion[] = []
  const d = input
  const result = String(d.result_type || d.niptFinding || '').toLowerCase()

  if (['t21_positive', 't18_positive', 't13_positive', 'high_risk_common_trisomy'].some((k) => result.includes(k))) {
    const c = _fires(criteria, 'nipt_common_aneuploidy_positive')
    if (c) matches.push(_match(c))
  }
  if (['sex_chromosome_positive', 'high_risk_sca_or_rat'].some((k) => result.includes(k))) {
    const c = _fires(criteria, 'nipt_sex_chromosome_positive')
    if (c) matches.push(_match(c))
  }
  if (['microdeletion_positive', 'repeat_low_ff_or_microdeletion'].some((k) => result.includes(k))) {
    const c = _fires(criteria, 'nipt_microdeletion_positive')
    if (c) matches.push(_match(c))
  }

  const ff = normalizeNumber(d.fetal_fraction) ?? normalizeNumber(d.niptFetalFraction)
  const lowFfRule = _fires(criteria, 'nipt_low_fetal_fraction')
  const ffThreshold = lowFfRule?.threshold ?? 4.0
  if (
    normalizeBoolean(d.no_call) ||
    result.includes('no_call') ||
    result.includes('single_early_nocall') ||
    (ff !== null && ff < ffThreshold)
  ) {
    if (lowFfRule) matches.push(_match(lowFfRule))
  }

  if (normalizeBoolean(d.discordant_with_ultrasound)) {
    const c = _fires(criteria, 'nipt_discordant')
    if (c) matches.push(_match(c))
  }

  return _pickHighest(matches, 'nipt_results', d)
}

export function evaluateUltrasound(input: Record<string, unknown>, criteria: CriterionDefinition[]): DecisionResult {
  const matches: MatchedCriterion[] = []
  const d = input

  // Major structural anomaly
  if (
    normalizeBoolean(d.structural_anomaly) ||
    normalizeBoolean(d.major_structural_anomaly) ||
    normalizeBoolean(d.aufMajorStructuralAnomaly)
  ) {
    const c = _fires(criteria, 'us_structural_anomaly')
    if (c) matches.push(_match(c))
  }

  // NT >= 3.5 mm
  const nt =
    normalizeNumber(d.nuchal_translucency_mm) ??
    normalizeNumber(d.nuchal_translucency) ??
    normalizeNumber(d.aufNuchalTranslucencyMm)
  const ntRule = _fires(criteria, 'us_increased_nt')
  const ntThreshold = ntRule?.threshold ?? 3.5
  if (nt !== null && nt >= ntThreshold) {
    if (ntRule) matches.push(_match(ntRule))
  }

  // Soft markers
  const soft = normalizeArray(d.soft_markers || d.aufSoftMarkers)
  const softCount = soft.length
  const multiRule = _fires(criteria, 'us_multiple_soft_markers')
  const multiThreshold = multiRule?.threshold ?? 2
  if (softCount >= multiThreshold) {
    if (multiRule) matches.push(_match(multiRule))
  } else if (softCount === 1) {
    const c = _fires(criteria, 'us_isolated_soft_marker')
    if (c) matches.push(_match(c))
  }

  // Early-onset severe IUGR
  if (
    normalizeBoolean(d.iugr_early_severe) ||
    normalizeBoolean(d.early_onset_severe_iugr) ||
    normalizeBoolean(d.aufEarlyOnsetSevereIugr)
  ) {
    const c = _fires(criteria, 'us_iugr_early_severe')
    if (c) matches.push(_match(c))
  }

  return _pickHighest(matches, 'abnormal_ultrasound', d)
}

export function evaluateInfertilityRpl(input: Record<string, unknown>, criteria: CriterionDefinition[]): DecisionResult {
  const matches: MatchedCriterion[] = []
  const d = input
  const losses =
    normalizeNumber(d.pregnancy_loss_count) ??
    normalizeNumber(d.recurrent_losses_count) ??
    normalizeNumber(d.irplLossesCount) ??
    0

  const thrUrgentRule = _fires(criteria, 'rpl_three_or_more_losses')
  const thrUrgent = thrUrgentRule?.threshold ?? 3
  const thrRoutineRule = _fires(criteria, 'rpl_two_losses')
  const thrRoutine = thrRoutineRule?.threshold ?? 2

  if (losses >= thrUrgent) {
    if (thrUrgentRule) matches.push(_match(thrUrgentRule))
  } else if (losses >= thrRoutine) {
    if (thrRoutineRule) matches.push(_match(thrRoutineRule))
  }

  if (
    normalizeBoolean(d.parental_karyotype_abnormal) ||
    normalizeBoolean(d.prior_karyotype_abnormal) ||
    normalizeBoolean(d.irplPriorKaryotypeAbnormal)
  ) {
    const c = _fires(criteria, 'rpl_parental_karyotype_abnormal')
    if (c) matches.push(_match(c))
  }
  if (
    normalizeBoolean(d.azoospermia_or_severe_oligo) ||
    normalizeBoolean(d.severe_male_factor) ||
    normalizeBoolean(d.irplSevereMaleFactor)
  ) {
    const c = _fires(criteria, 'rpl_azoospermia')
    if (c) matches.push(_match(c))
  }
  if (normalizeBoolean(d.primary_ovarian_insufficiency) || normalizeBoolean(d.irplPoi)) {
    const c = _fires(criteria, 'rpl_poi')
    if (c) matches.push(_match(c))
  }

  return _pickHighest(matches, 'infertility_rpl', d)
}

export function evaluateFamilyHistory(input: Record<string, unknown>, criteria: CriterionDefinition[]): DecisionResult {
  const matches: MatchedCriterion[] = []
  const d = input
  const degree = String(
    d.closest_affected_degree ||
      (normalizeBoolean(d.first_degree_affected) || normalizeBoolean(d.fhFirstDegreeAffected)
        ? 'first'
        : normalizeBoolean(d.two_or_more_generations) || normalizeBoolean(d.fhTwoOrMoreGenerations)
          ? 'second'
          : ''),
  ).toLowerCase()
  const planning = normalizeBoolean(d.reproductive_planning) || normalizeBoolean(d.fhReproductivePlanning)
  const severity = String(
    d.condition_severity ||
      (normalizeBoolean(d.early_onset_condition) || normalizeBoolean(d.rare_genetic_condition_in_family)
        ? 'severe'
        : ''),
  ).toLowerCase()
  const multiple = normalizeBoolean(d.multiple_affected) || normalizeBoolean(d.two_or_more_generations)

  if (degree === 'first' && planning) {
    const c = _fires(criteria, 'fh_first_degree_reproductive_planning')
    if (c) matches.push(_match(c))
  }
  if (degree === 'first') {
    const c = _fires(criteria, 'fh_first_degree')
    if (c) matches.push(_match(c))
  }
  if (degree === 'second' && multiple) {
    const c = _fires(criteria, 'fh_second_degree_multiple')
    if (c) matches.push(_match(c))
  }
  if (severity === 'severe' && (degree === 'first' || degree === 'second')) {
    const c = _fires(criteria, 'fh_severe_condition')
    if (c) matches.push(_match(c))
  }

  return _pickHighest(matches, 'family_history', d)
}

export const PATHWAY_EVALUATORS: Record<
  string,
  (input: Record<string, unknown>, criteria: CriterionDefinition[]) => DecisionResult
> = {
  hereditary_cancer: evaluateHereditaryCancer,
  carrier_screening: evaluateCarrierScreening,
  nipt_results: evaluateNipt,
  abnormal_ultrasound: evaluateUltrasound,
  infertility_rpl: evaluateInfertilityRpl,
  family_history: evaluateFamilyHistory,
}

/** Master deterministic pathway evaluator */
export function evaluatePathway(
  pathwaySlug: string,
  rawInput: Record<string, unknown>,
  customCriteria?: CriterionDefinition[],
): DecisionResult {
  const pathwayId = normalizePathwayId(pathwaySlug)
  const evaluator = PATHWAY_EVALUATORS[pathwayId]
  if (!evaluator) {
    return {
      outcome: 'no_referral',
      clinical_decision: 'no_referral_needed',
      tier: 'INSUFFICIENT_DATA',
      referral_target: 'None',
      matched_criteria: [],
      fired_rules: [],
      not_fired_rules_with_missing_inputs: [],
      counterfactuals: [],
      explanation: `Unknown clinical pathway: ${pathwaySlug}`,
      guideline_citations: [],
      pathway_id: pathwayId,
    }
  }

  const effectiveCriteria = customCriteria && customCriteria.length > 0 ? customCriteria : SEED_CRITERIA
  const normalized = normalizeInputs(pathwayId, rawInput)
  return evaluator(normalized, effectiveCriteria)
}
