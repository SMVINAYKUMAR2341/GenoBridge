/**
 * Deterministic clinical decision engine for GenoBridge AI.
 * Fully ported and aligned with Histone-main backend decision engine and statutory
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

export interface DecisionResult {
  outcome: UrgencyTier
  clinical_decision: ClinicalDecision
  referral_target: string
  matched_criteria: MatchedCriterion[]
  explanation: string
  guideline_citations: string[]
  pathway_id: string
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

  // Ultrasound
  if (norm.nuchal_translucency_mm === undefined && raw.usNtMeasurementRaw) {
    norm.nuchal_translucency_mm = normalizeNumber(raw.usNtMeasurementRaw)
  }
  if (norm.structural_anomaly === undefined && raw.usFindingCategory === 'major_structural_or_nt_ge_3') {
    norm.structural_anomaly = true
  }

  // NIPT
  if (norm.result_type === undefined && raw.niptFinding) {
    const f = String(raw.niptFinding)
    if (f === 'high_risk_common_trisomy') norm.result_type = 't21_positive'
    else if (f === 'high_risk_sca_or_rat') norm.result_type = 'sex_chromosome_positive'
    else if (f === 'repeat_low_ff_or_microdeletion') norm.result_type = 'microdeletion_positive'
    else if (f === 'single_early_nocall') norm.no_call = true
  }

  // Infertility / RPL
  if (norm.pregnancy_loss_count === undefined && raw.rplClinicalLosses === '2_or_more_clinical') {
    norm.pregnancy_loss_count = 2
  }

  // Family History
  if (norm.closest_affected_degree === undefined && raw.fhxRelativeDegree) {
    const d = String(raw.fhxRelativeDegree)
    if (d.includes('first')) norm.closest_affected_degree = 'first'
    else if (d.includes('second')) norm.closest_affected_degree = 'second'
    else if (d.includes('third')) norm.closest_affected_degree = 'third'
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

function _pickHighest(matches: MatchedCriterion[], pathwayId: string): DecisionResult {
  if (!matches || matches.length === 0) {
    return {
      outcome: 'no_referral',
      clinical_decision: 'no_referral_needed',
      referral_target: 'None',
      matched_criteria: [],
      explanation: 'No referral criteria met under current FOGSI, ACOG, ACMG, ASRM, or NCCN clinical standards. Routine prenatal / obstetric care recommended.',
      guideline_citations: [],
      pathway_id: pathwayId,
    }
  }

  const sorted = [...matches].sort((a, b) => (URGENCY_RANK[b.outcome] || 0) - (URGENCY_RANK[a.outcome] || 0))
  const top = sorted[0]
  const citations = [...new Set(sorted.map((m) => `${m.guideline_source}: ${m.citation}`))]

  const explanation = `Recommendation: ${top.outcome.toUpperCase()} REFERRAL to ${top.referral_target}. Met criteria: ${sorted.map((m) => m.label).join('; ')}. Evaluated deterministically against published clinical practice guidelines.`

  return {
    outcome: top.outcome,
    clinical_decision: OUTCOME_MAP_TO_CLINICAL[top.outcome],
    referral_target: top.referral_target,
    matched_criteria: sorted,
    explanation,
    guideline_citations: citations,
    pathway_id: pathwayId,
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

  return _pickHighest(matches, 'hereditary_cancer')
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

  return _pickHighest(matches, 'carrier_screening')
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

  return _pickHighest(matches, 'nipt_results')
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

  return _pickHighest(matches, 'abnormal_ultrasound')
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

  return _pickHighest(matches, 'infertility_rpl')
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

  return _pickHighest(matches, 'family_history')
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
      referral_target: 'None',
      matched_criteria: [],
      explanation: `Unknown clinical pathway: ${pathwaySlug}`,
      guideline_citations: [],
      pathway_id: pathwayId,
    }
  }

  const effectiveCriteria = customCriteria && customCriteria.length > 0 ? customCriteria : SEED_CRITERIA
  const normalized = normalizeInputs(pathwayId, rawInput)
  return evaluator(normalized, effectiveCriteria)
}
