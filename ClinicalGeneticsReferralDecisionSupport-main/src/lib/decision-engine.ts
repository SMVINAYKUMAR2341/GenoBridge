/** Transport types only. Clinical evaluation belongs to the governed Python
 * criteria service via workflow-actions; there is no TypeScript fallback. */
export type PathwaySlug =
  | 'hereditary-cancer-risk'
  | 'preconception-carrier-screening'
  | 'nipt-results'
  | 'abnormal-ultrasound-findings'
  | 'infertility-recurrent-pregnancy-loss'
  | 'positive-family-history'

/** Historical value meanings, retained for read compatibility, not new defaults. */
export interface LegacyStructuredFormState {
  hcrPersonalCancer: 'none' | 'active_surgical_planning' | 'prior_breast_ovarian_endometrial'
  hcrKnownFamilialMutation: boolean
  hcrFirstDegreeEarlyBreastOrOvarian: boolean
  hcrMultipleRelativesOrPancreaticMaleBreast: boolean
  hcrAshkenaziAncestry: boolean
  hcrLimitedFamilyOrSingleSecondDegree: boolean
  hcrRelativeDetails: string
  pcsPatientStatus:
    | 'negative'
    | 'ar_carrier_positive'
    | 'xlinked_carrier_positive'
    | 'vus_or_mild_allele'
  pcsPartnerStatus: 'negative' | 'concordant_positive' | 'pending_or_untested' | 'not_applicable'
  pcsIsPregnant: boolean
  pcsGeneVariantText: string
  niptFinding:
    | 'low_risk'
    | 'high_risk_common_trisomy'
    | 'high_risk_sca_or_rat'
    | 'repeat_low_ff_or_microdeletion'
    | 'single_early_nocall'
  niptFetalFraction: string
  niptEstimatedPpv: string
  niptGestationalWeeks: string
  usFindingCategory:
    | 'normal_scan'
    | 'major_structural_or_nt_ge_3'
    | 'multiple_soft_markers'
    | 'isolated_high_lr_soft_marker_unscreened'
    | 'isolated_sua_utd_eif_with_neg_nipt'
  usPriorScreening: 'low_risk_cfdna' | 'unscreened' | 'high_risk_screen'
  usMeasurementNote: string
  rplClinicalLosses: '0_or_1' | '2_or_more_clinical' | 'biochemical_only'
  rplCytogenetics: 'none_or_normal' | 'parental_translocation_or_abnormal_poc'
  rplReproductiveFactor: 'none' | 'poi_under_40_or_severe_male_factor' | 'unexplained_infertility'
  rplActiveIvfCycle: boolean
  fhxRelativeDegree: 'first_degree' | 'second_degree' | 'third_degree_or_distant'
  fhxConditionType:
    | 'known_monogenic_or_xlinked'
    | 'id_mca_or_consanguinity'
    | 'distant_unverified_or_multifactorial'
    | 'negative_history'
  fhxIsPregnant: boolean
  fhxDisorderName: string
}

// New raw keys are additive. Omitted and blank answers are unknown, not negative.
export type StructuredFormState = Record<string, string | number | boolean | undefined>
export type PrimaryDecision = 'urgent_referral' | 'routine_referral' | 'no_referral_needed'
export type SafeguardDecision =
  | 'borderline_consideration'
  | 'insufficient_information'
  | 'criteria_pending_approval'
export type ClinicalDecision = PrimaryDecision | SafeguardDecision
