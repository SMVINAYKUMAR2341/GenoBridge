export type NIPTResultType =
  | 'screen_positive_T21'
  | 'screen_positive_T18'
  | 'screen_positive_T13'
  | 'screen_positive_monosomy_X'
  | 'screen_positive_other_sex_chr'
  | 'screen_positive_microdeletion'
  | 'screen_positive_other_autosomal'
  | 'low_risk'
  | 'nocall'
  | 'low_fetal_fraction'
  | 'discordant'

export interface SoftMarkerProfile {
  // Standard ISUOG / ACOG soft marker set for T21/T18/T13
  nuchalFoldThickened?: boolean         // >=6mm at 15-21w
  echogenicBowel?: boolean
  shortFemur?: boolean                  // <0.91 FL/BPD ratio
  shortHumerus?: boolean
  echogenicIntracardiacFocus?: boolean  // EIF
  choroidPlexusCysts?: boolean          // CPC - T18 marker
  renal_pyelectasis?: boolean           // mild hydronephrosis
  ventriculomegaly?: boolean
  aberrantRightSubclavianArtery?: boolean
  sandwichSign?: boolean                // T18 specific
  clubfoot?: boolean                    // T18 specific
  nonePresent?: boolean                 // explicit "no soft markers" flag
}

export interface NIPTClinicalIntake {
  // Existing fields
  patientMRN: string
  resultType: NIPTResultType
  fetalFraction: number         // percentage, e.g. 23
  isNocallLowFF: boolean
  isDiscordantWithUltrasound: boolean

  // New required fields
  gestationalAgeWeeks: number   // GA in completed weeks - CRITICAL for urgency tier
  gestationalAgeDays?: number   // optional refinement

  maternalAge: number           // years - required for pre-test probability context

  softMarkers: SoftMarkerProfile

  priorScreeningResults?: {
    firstTrimesterScreen?: 'high_risk' | 'low_risk' | 'not_done'
    quadScreen?: 'high_risk' | 'low_risk' | 'not_done'
    cellFreeRNAResult?: string
  }

  ultrasoundFindings?: {
    majorStructuralAnomaly: boolean
    anomalyDescription?: string  // free text, never stored for PC&PNDT sex fields
  }

  pedigreeLinked: boolean
}

