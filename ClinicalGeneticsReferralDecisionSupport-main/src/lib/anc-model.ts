import type { ParseResult } from '../components/clinical/pedigree-model'

// ============================================================================
// GENOBRIDGE ANTENATAL CARE (ANC) COMPREHENSIVE CLINICAL DATA MODEL
// Aligned with ACOG, WHO, and Indian Ministry of Health & Family Welfare (MoHFW)
// ============================================================================

export type BloodGroup = 'unknown' | 'A' | 'B' | 'AB' | 'O'
export type RhType = 'unknown' | 'positive' | 'negative' | 'other'
export type LiteracyLevel = 'illiterate' | 'primary' | 'secondary' | 'high_school' | 'graduate' | 'postgraduate' | 'other'
export type SocialClass = 'lower' | 'upper_lower' | 'lower_middle' | 'upper_middle' | 'upper' | 'unknown'
export type MaritalStatus = 'married' | 'unmarried' | 'divorced' | 'widowed' | 'separated' | 'other'
export type ConceptionMode = 'unknown' | 'spontaneous' | 'ovulation-induction' | 'iui' | 'ivf' | 'icsi' | 'other'
export type DeliveryMode = 'unknown' | 'normal_vaginal' | 'assisted_vaginal' | 'lscs_emergency' | 'lscs_elective' | 'other'
export type RiskLevel = 'LOW' | 'HIGH'

// 1. Patient & Administrative Booking Details (Section 1)
export interface AncBooking {
  identifier: string // e.g. ANC-2026-0012 or empty for new
  patientId?: string // e.g. PAT-2026-0012
  name: string
  dateOfBirth: string
  ageAtBooking: number | null
  bookingDate: string
  clinician: string
  bloodGroup: BloodGroup
  rhesus: RhType
  heightCm: number | null
  weightKg: number | null
  gravida: number | null
  para: number | null
  living: number | null
  abortions: number | null
  
  // Expanded MoHFW / ACOG socio-demographic fields
  hospitalRegNumber?: string // MRN
  address?: string
  city?: string
  state?: string
  postalCode?: string
  mobileNumber?: string
  alternatePhone?: string
  emailId?: string
  partnerName?: string
  emergencyContact?: string
  emergencyRelationship?: string
  occupation?: string
  education?: string
  chwName?: string // ASHA / ANM Name
  literacyLevel?: LiteracyLevel
  socialClass?: SocialClass
  maritalStatus?: MaritalStatus
  preferredLanguage?: string
}

// 2. Pregnancy & Dating Details (Section 2)
export interface AncPregnancy {
  lmp: string
  lmpCertain: 'unknown' | 'yes' | 'no'
  cycleDays: number | null
  edd: string
  datingBasis: 'unknown' | 'lmp' | 'ultrasound' | 'assisted-conception' | 'clinical'
  gaAsOf: string
  gaWeeks: number | null
  gaDays: number | null
  conception: ConceptionMode
  conceptionDetails: string
  plurality: number | null

  // Expanded obstetric fields
  stillbirths?: number | null
  multiplePregnancy?: boolean
  pregnancyType?: 'singleton' | 'twin' | 'triplet' | 'higher_order' | 'unknown'
  previousPregnancyComplications?: string
  maritalDurationYears?: number | null
  oralContraceptiveUse?: 'unknown' | 'yes' | 'no'
  previousDeliveryMode?: DeliveryMode
  antiDGiven?: 'not_applicable' | 'pending' | 'given' | 'not_given'
  clinicianApprovedEdd?: string
  clinicianApprovedBy?: string
  clinicianApprovalDate?: string
  trimester?: 1 | 2 | 3
}

// 3. Repeatable Obstetric Outcomes (Past Pregnancies) (Section 3)
export interface AncPreviousOutcome {
  id: string
  pregnancyNumber?: number
  year: number | null
  outcome: 'unknown' | 'livebirth' | 'miscarriage' | 'elective-abortion' | 'stillbirth' | 'ectopic' | 'molar'
  gaWeeks: number | null
  gaDays: number | null
  modeOfBirth: string
  birthweightGrams: number | null
  babyCondition?: 'healthy' | 'asphyxia' | 'jaundice' | 'anomalies' | 'deceased' | 'unknown'
  babySex?: 'female' | 'male' | 'ambiguous' | 'unknown'
  livingStatus: string
  complications: string
  conditionDetails: string
  placeOfBirth?: string
  breastfeedingMonths?: number | null
  nicuAdmission?: 'no' | 'yes' | 'unknown'
  milestonesImmunization?: string
  deliveryType?: string
  birthOutcome?: string
  babyWeight?: number | null
  remarks?: string
}

// 4. Medical, Surgical & Family Histories (Section 4)
export interface AdditionalHistoryEntry {
  id: string
  condition: string
  diagnosedYear?: number | null
  notes: string
}

export interface AncHistories {
  medical: string
  surgical: string
  obstetric: string
  family: string
  genetic: string
  medications: string
  socialExposures: string
  infections: string
  immunisations: string
  mentalHealth: string

  // Structured Medical Indicators
  diabetes?: boolean
  diabetesType?: 'none' | 'type1' | 'type2' | 'gestational_prior' | 'other'
  hypertension?: boolean
  chronicHypertension?: boolean
  thyroidDisorders?: boolean
  thyroidDisorder?: 'none' | 'hypothyroidism' | 'hyperthyroidism' | 'other'
  cardiacConditions?: boolean
  cardiacDisease?: boolean
  renalConditions?: boolean
  renalDisease?: boolean
  epilepsy?: boolean
  tuberculosis?: boolean
  asthmaRespiratory?: boolean
  jaundiceHepatic?: boolean
  severeAnemiaHistory?: boolean
  otherMedicalDetails?: string

  // Surgical & Gynecological
  previousSurgeries?: string
  previousCSectionCount?: number
  previousCSectionIndications?: string
  uterineSurgeryMyomectomy?: boolean
  pelvicSurgery?: boolean
  infertilityHistoryYears?: number | null
  cervicalCerclageHistory?: boolean

  // Family, Allergies, Current Medications
  familyMedicalHistory?: string
  allergiesNotes?: string
  currentMedications?: string
  additionalHistories?: AdditionalHistoryEntry[]

  // Sensitive Social Determinants (Privacy Protected)
  domesticViolenceScreening?: 'not_assessed' | 'negative' | 'disclosed_support_provided' | 'declined_to_answer'
  occupationalHazards?: string
  nutritionalDeficiency?: boolean
  substanceUse?: 'none' | 'tobacco_smoking' | 'tobacco_chewing' | 'alcohol' | 'other'
}

// 5. Consanguinity
export interface AncConsanguinity {
  status: 'unknown' | 'yes' | 'no'
  relationship: string
  degree: string
  familyHistory: string
}

// 6. Thalassemia & Hemoglobinopathy Screening
type TestStatus = 'unknown' | 'not-tested' | 'pending' | 'negative' | 'carrier' | 'affected' | 'other'
export interface AncThalassaemia {
  maternalStatus: TestStatus
  maternalTestDate: string
  maternalResult: string
  partnerStatus: TestStatus
  partnerTestDate: string
  partnerResult: string
  haemoglobinAnalysis: string
  notes: string

  // Structured MoHFW HPLC / Screening fields
  maternalHb?: number | null
  maternalMcv?: number | null
  maternalMch?: number | null
  hplcResult?: string
  nestroftResult?: 'not_done' | 'negative' | 'positive'
  partnerTestingAdvised?: boolean
}

// 7. Complete Blood Count (CBC)
export interface AncCbc {
  id: string
  date: string
  haemoglobin: number | null
  mcv: number | null
  mch: number | null
  wbc: number | null
  platelets: number | null
  laboratory: string
  notes: string

  // Trimester CBC tracking
  trimester?: 1 | 2 | 3
  mchc?: number | null
  rdw?: number | null
  peripheralSmear?: string
  anemiaSeverity?: 'none' | 'mild' | 'moderate' | 'severe' | 'very_severe'
}

// 8. Ultrasound & Fetal Screening Reports (Section 8)
export interface AncUltrasound {
  id: string
  date: string
  scanDate?: string
  gaWeeks: number | null
  gaDays: number | null
  purpose: string // 'Dating Scan', 'NT/NB Scan', 'Level II Anomaly', 'Growth/Doppler', etc.
  findings: string
  placentation: string
  impression: string
  reportReference: string

  // Structured Biometry & Findings
  scanType?: 'dating' | 'nt_nb' | 'anomaly_level2' | 'growth_doppler' | 'other'
  fetalNumber?: number | null
  fetalPresentation?: string
  placentalLocation?: string
  placentalPosition?: 'anterior' | 'posterior' | 'fundal' | 'low_lying' | 'previa' | 'other'
  amnioticFluid?: string
  amnioticFluidIndexCm?: number | null
  estimatedFetalWeight?: number | null
  fetalWeightGrams?: number | null
  crlMm?: number | null
  ntMm?: number | null
  nasalBonePresent?: 'present' | 'absent' | 'hypoplastic' | 'unclear'
  uterineArteryPi?: number | null
  cervicalLengthMm?: number | null
  fetalAnomaliesDetected?: boolean
  attachmentName?: string
  reportAttachmentName?: string
}

// 9. Clinician Risk Matrix
export interface AncRisk {
  id: string
  category: 'medical' | 'obstetric' | 'genetic' | 'social' | 'other'
  description: string
  status: 'unknown' | 'present' | 'absent' | 'resolved'
  clinicianPlan: string
}

// 10. Allergies
export interface AncAllergy {
  id: string
  substance: string
  reaction: string
  severity: 'unknown' | 'mild' | 'moderate' | 'severe'
  verification: 'reported' | 'confirmed' | 'uncertain'
}

// 11. Repeatable Chronological Antenatal Visits
export interface AncVisit {
  id: string
  date: string
  clinician: string
  gaWeeks: number | null
  gaDays: number | null
  weightKg: number | null
  systolic: number | null
  diastolic: number | null
  urine: string // Albumin & Sugar

  symptoms: string
  examination: string
  assessment: string
  plan: string
  nextVisit: string

  // Structured clinical examination & medication
  pulseBpm?: number | null
  temperatureF?: number | null
  respiratoryRate?: number | null
  fundalHeightCm?: number | null // SFH
  fetalHeartRateBpm?: number | null // FHR
  fetalPresentation?: 'cephalic' | 'breech' | 'transverse' | 'unstable' | 'not_applicable'
  fetalMovements?: 'present' | 'reduced' | 'absent' | 'not_applicable'
  pedalEdema?: 'none' | '1+' | '2+' | '3+' | '4+'
  pallor?: 'absent' | 'mild' | 'moderate' | 'severe'
  medicationsPrescribed?: {
    ironFolicAcid?: boolean
    calciumVitaminD3?: boolean
    aspirinLowDose?: boolean
    other?: string
  }
}

// 12. Supporting Documents Metadata
export interface AncDocument {
  id: string
  title: string
  kind: 'cbc' | 'ultrasound' | 'screening' | 'other'
  documentDate: string
  fileName: string
  mimeType: string
  sizeBytes: number | null
  externalReference: string
  verification: 'pending'
  notes: string
}

// 13. General Physical Examination (Booking / Baseline) (Section 6)
export interface AncGeneralExam {
  pulseBpm: number | null
  systolicBp: number | null
  diastolicBp: number | null
  bloodPressure?: string
  temperatureF: number | null
  respiratoryRate: number | null
  bmi: number | null
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown'
  pallor: 'absent' | 'mild' | 'moderate' | 'severe'
  jaundice: boolean
  cyanosis: boolean
  clubbing: boolean
  pedalEdema: 'none' | '1+' | '2+' | '3+' | '4+'
  lymphadenopathy: boolean
  cvsFindings: string
  respiratoryFindings: string
  breastExam: string
  thyroidExam: string
  generalExamNotes?: string
}

// 14. Routine Laboratory Investigations Panel (Section 7)
export interface OtherLabTest {
  id: string
  testName: string
  result: string
  date: string
  referenceRange?: string
}

export interface AncInvestigations {
  bloodGroupRh: string
  hemoglobin?: number | null
  hivStatus: 'pending' | 'non_reactive' | 'reactive' | 'not_tested'
  hbsAgStatus: 'pending' | 'non_reactive' | 'reactive' | 'not_tested'
  hcvStatus: 'pending' | 'non_reactive' | 'reactive' | 'not_tested'
  vdrlRprStatus: 'pending' | 'non_reactive' | 'reactive' | 'not_tested'
  rubellaIgg: 'pending' | 'immune' | 'non_immune' | 'equivocal' | 'not_tested'
  tshValueMiuL: number | null
  urineRoutineProtein: 'nil' | 'trace' | '1+' | '2+' | '3+' | '4+'
  urineRoutineSugar: 'nil' | 'trace' | '1+' | '2+' | '3+' | '4+'
  urinePusCells: string
  dipsiBloodSugarMgDl: number | null // Non-fasting 75g glucose DIPSI test
  fastingBloodSugarMgDl: number | null
  ogtt1HourMgDl: number | null
  ogtt2HourMgDl: number | null
  bloodGlucosePostPrandial?: number | null
  bloodGlucoseRandom?: number | null
  hbA1cPercent: number | null
  serumCreatinineMgDl: number | null
  otherTests?: OtherLabTest[]
}

// 15. Vaccinations (National Immunization Schedule / MoHFW) (Section 9)
export interface VaccinationRecordEntry {
  id: string
  vaccineName: string
  dose: string
  dateAdministered: string
  nextDoseDate: string
  remarks: string
}

export interface AncVaccinations {
  td1Date: string
  td1Batch: string
  td1GivenBy: string
  td2Date: string
  td2Batch: string
  td2GivenBy: string
  tdBoosterDate: string
  tdBoosterBatch: string
  tdapDate: string // Given between 27-36 weeks
  tdapBatch: string
  influenzaDate: string
  covid19Doses: string
  notes: string
  records?: VaccinationRecordEntry[]
}

// 16. Birth Preparedness & Complication Readiness Plan (Section 10)
export interface AncBirthPlan {
  preferredPlaceOfDelivery: 'district_hospital' | 'medical_college' | 'sub_district_hospital' | 'private_tertiary' | 'primary_health_centre' | 'other'
  expectedDeliveryFacility?: string
  identifiedHospitalName: string
  identifiedBirthCompanion: string
  birthPreferences?: string
  deliveryPlanningNotes?: string
  emergencyTransportContact: string // e.g. 102/108 ambulance contact
  bloodDonorIdentified: boolean
  bloodDonorContact: string
  exclusiveBreastfeedingCounseled: boolean
  postpartumContraceptionCounseled: boolean
  dangerSignsExplained: boolean
  dangerSignsListAck: boolean // Headache, blurred vision, bleeding, leaking, reduced movements
  referralFacility?: string
  referralReason?: string
  referralDate?: string
  referralStatus?: 'pending' | 'in_transit' | 'accepted' | 'completed' | 'none'
}

// 17. Referral & Delivery Outcome
export interface AncReferralOutcome {
  isReferred: boolean
  referralReason: string
  referralUrgency: 'routine' | 'priority' | 'emergency'
  referredFacilityName: string
  referralDate: string
  referralSummary: string
  referralStatus?: 'pending' | 'in_transit' | 'accepted' | 'completed' | 'none'
  attendingDoctorSignoff: string

  // Delivery Outcome
  deliveryOccurred: boolean
  deliveryDate: string
  deliveryTime: string
  deliveryMode: DeliveryMode
  lscsIndication: string
  deliveryGaWeeks: number | null
  babyGender: 'female' | 'male' | 'ambiguous' | 'unknown'
  birthWeightKg: number | null
  apgar1Min: number | null
  apgar5Min: number | null
  resuscitationNeeded: boolean
  maternalComplications: string
  neonatalComplications: string
  dischargeDate: string
  postpartumStatus: string
}

// 18. Overall Risk Classification & Pre-eclampsia Screening (Section 5)
export interface AncRiskClassification {
  riskLevel: RiskLevel
  calculatedRiskLevel?: 'LOW' | 'HIGH'
  clinicianConfirmedRiskLevel?: 'LOW' | 'HIGH' | 'PENDING'
  highRiskFlags: string[]
  maternalAgeRisk?: string
  previousObstetricComplicationsRisk?: string
  medicalRiskFactors?: string[]
  pregnancyRelatedRiskFactors?: string[]
  socialRiskFactors?: string[]
  preEclampsiaRisk: 'low' | 'moderate' | 'high'
  aspirinRecommended: boolean
  clinicalRemarks?: string
  clinicianOverride: boolean
  clinicianOverrideRationale: string
  clinicianApproved: boolean
  approvedByClinicianName: string
  approvedAt: string
}

// ============================================================================
// FULL UNIFIED RECORD DATA INTERFACE
// ============================================================================
export interface RoutineAncData {
  version: 1
  sourceVerification: 'pending'
  booking: AncBooking
  pregnancy: AncPregnancy
  histories: AncHistories
  consanguinity: AncConsanguinity
  thalassaemia: AncThalassaemia
  previousOutcomes: AncPreviousOutcome[]
  cbc: AncCbc[]
  ultrasounds: AncUltrasound[]
  risks: AncRisk[]
  allergiesStatus: 'unknown' | 'none-known' | 'recorded'
  allergies: AncAllergy[]
  visits: AncVisit[]
  documents: AncDocument[]

  // Optional extensions for full 11-module MoHFW/ACOG workflow
  generalExam?: AncGeneralExam
  investigations?: AncInvestigations
  vaccinations?: AncVaccinations
  birthPlan?: AncBirthPlan
  referralOutcome?: AncReferralOutcome
  riskClassification?: AncRiskClassification
  status?: 'DRAFT' | 'ACTIVE' | 'HIGH_RISK' | 'REFERRED' | 'DELIVERED' | 'ARCHIVED'
  archived?: boolean
  archivedAt?: string
  archivedBy?: string
  archivalReason?: string
  lastUpdated?: string
}

export interface RoutineAncProps {
  value?: RoutineAncData
  initialValue?: RoutineAncData
  onChange?: (data: RoutineAncData) => void
  onSave?: (data: RoutineAncData) => void | Promise<void>
  isDoctor?: boolean
  readOnly?: boolean
}

// ============================================================================
// CLINICAL DATING & RISK CALCULATION UTILITIES
// ============================================================================

export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

/** Naegele's Rule: LMP + 280 days + (cycleDays - 28) */
export function estimateEddFromLmp(lmp: string, cycleDays: number | null = 28): string | null {
  if (!validDate(lmp)) return null
  const date = new Date(`${lmp}T00:00:00Z`)
  const cycleCorrection = (cycleDays && cycleDays >= 20 && cycleDays <= 45) ? (cycleDays - 28) : 0
  date.setUTCDate(date.getUTCDate() + 280 + cycleCorrection)
  return date.toISOString().slice(0, 10)
}

/** Calculates current gestational age in completed weeks and days as of target date */
export function calculateGestationalAge(lmp: string, asOfDate: string = new Date().toISOString().slice(0, 10)): { weeks: number; days: number; totalDays: number } | null {
  if (!validDate(lmp) || !validDate(asOfDate)) return null
  const lmpMs = Date.parse(`${lmp}T00:00:00Z`)
  const asOfMs = Date.parse(`${asOfDate}T00:00:00Z`)
  const diffDays = Math.floor((asOfMs - lmpMs) / (1000 * 60 * 60 * 24))
  if (diffDays < 0 || diffDays > 315) return null // between 0 and 45 weeks
  const weeks = Math.floor(diffDays / 7)
  const days = diffDays % 7
  return { weeks, days, totalDays: diffDays }
}

/** Determine trimester based on gestational weeks */
export function getTrimester(weeks: number): 1 | 2 | 3 {
  if (weeks < 14) return 1
  if (weeks < 28) return 2
  return 3
}

/** Body Mass Index calculation and WHO/MoHFW categorization */
export function calculateBmi(weightKg: number | null, heightCm: number | null): { bmi: number | null; category: AncGeneralExam['bmiCategory'] } {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return { bmi: null, category: 'unknown' }
  }
  const heightM = heightCm / 100
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10
  let category: AncGeneralExam['bmiCategory'] = 'normal'
  if (bmi < 18.5) category = 'underweight'
  else if (bmi < 25) category = 'normal'
  else if (bmi < 30) category = 'overweight'
  else category = 'obese'
  return { bmi, category }
}

/** Calculates summary G/P/L/A from previous outcomes list + current pregnancy */
export function calculateGplaFromOutcomes(outcomes: AncPreviousOutcome[]): { g: number; p: number; l: number; a: number } {
  let para = 0
  let living = 0
  let abortions = 0

  for (const o of outcomes) {
    if (o.outcome === 'livebirth') {
      para += 1
      if (o.livingStatus.toLowerCase().includes('alive') || o.babyCondition === 'healthy') {
        living += 1
      }
    } else if (o.outcome === 'stillbirth') {
      para += 1
    } else if (['miscarriage', 'elective-abortion', 'ectopic', 'molar'].includes(o.outcome)) {
      abortions += 1
    }
  }

  // Gravida includes past pregnancies + current pregnancy (1)
  const gravida = outcomes.length + 1

  return { g: gravida, p: para, l: living, a: abortions }
}

/**
 * Pre-eclampsia Risk Assessment Matrix (ACOG & MoHFW)
 * Identifies if patient has 1 high-risk factor OR >= 2 moderate-risk factors
 * Triggering Low-Dose Aspirin recommendation prompt.
 */
export function evaluatePreEclampsiaRisk(
  histories: AncHistories,
  booking: AncBooking,
  previousOutcomes: AncPreviousOutcome[],
  generalExam?: AncGeneralExam
): { isHighRisk: boolean; highRiskFactors: string[]; moderateRiskFactors: string[]; aspirinAdvised: boolean } {
  const highRiskFactors: string[] = []
  const moderateRiskFactors: string[] = []

  // High risk factors (1 needed)
  if (histories.chronicHypertension || histories.hypertension) highRiskFactors.push('Chronic Hypertension')
  if (histories.diabetes || (histories.diabetesType && histories.diabetesType !== 'none')) {
    highRiskFactors.push(`Pre-existing Diabetes (${histories.diabetesType || 'Diagnosed'})`)
  }
  if (histories.renalDisease || histories.renalConditions) highRiskFactors.push('Renal Disease')
  if (previousOutcomes.some(o => o.complications.toLowerCase().includes('preeclampsia') || o.complications.toLowerCase().includes('eclampsia'))) {
    highRiskFactors.push('Prior Pregnancy Complicated by Pre-eclampsia')
  }

  // Moderate risk factors (>=2 needed)
  if (booking.gravida === 1) moderateRiskFactors.push('Nulliparity (First Pregnancy)')
  if (booking.ageAtBooking && booking.ageAtBooking >= 35) moderateRiskFactors.push(`Maternal Age ≥ 35 (${booking.ageAtBooking} yrs)`)
  if (generalExam?.bmiCategory === 'obese' || (generalExam?.bmi && generalExam.bmi >= 30)) {
    moderateRiskFactors.push(`Pre-pregnancy / Booking Obesity (BMI ≥ 30)`)
  }
  if (histories.family.toLowerCase().includes('preeclampsia') || histories.family.toLowerCase().includes('hypertension')) {
    moderateRiskFactors.push('Family History of Pre-eclampsia in First-Degree Relative')
  }

  const aspirinAdvised = highRiskFactors.length >= 1 || moderateRiskFactors.length >= 2
  return {
    isHighRisk: highRiskFactors.length >= 1,
    highRiskFactors,
    moderateRiskFactors,
    aspirinAdvised,
  }
}

/**
 * Overall Clinical Risk Assessment (MoHFW High-Risk Pregnancy Matrix)
 */
export function evaluateOverallAncRisk(data: RoutineAncData): { riskLevel: RiskLevel; flags: string[] } {
  const flags: string[] = []

  // Booking flags
  if (data.booking.ageAtBooking && (data.booking.ageAtBooking < 18 || data.booking.ageAtBooking >= 35)) {
    flags.push(`Maternal age ${data.booking.ageAtBooking} yrs (<18 or ≥35)`)
  }
  if (data.booking.heightCm && data.booking.heightCm < 145) {
    flags.push('Short maternal stature (<145 cm)')
  }
  if (data.booking.rhesus === 'negative') {
    flags.push('Rh Negative Mother (Risk of Rh Isoimmunization)')
  }

  // Obstetric history
  const previousLSCS = data.previousOutcomes.filter(o => 
    (o.deliveryType && (o.deliveryType.toLowerCase().includes('lscs') || o.deliveryType.toLowerCase().includes('c-section'))) ||
    o.modeOfBirth.toLowerCase().includes('lscs') || 
    o.modeOfBirth.toLowerCase().includes('caesarean') || 
    o.modeOfBirth.toLowerCase().includes('c-section')
  ).length
  if (previousLSCS > 0 || (data.histories.previousCSectionCount && data.histories.previousCSectionCount > 0)) {
    flags.push(`Previous Caesarean Section (Count: ${previousLSCS || data.histories.previousCSectionCount})`)
  }
  if (data.previousOutcomes.some(o => o.outcome === 'stillbirth')) {
    flags.push('History of Previous Stillbirth / Intrauterine Fetal Demise')
  }
  if (data.previousOutcomes.filter(o => ['miscarriage', 'elective-abortion'].includes(o.outcome)).length >= 3) {
    flags.push('Recurrent Pregnancy Loss (≥3 Miscarriages)')
  }

  // Medical conditions
  if (data.histories.cardiacDisease || data.histories.cardiacConditions) flags.push('Maternal Cardiac Disease')
  if (data.histories.chronicHypertension || data.histories.hypertension) flags.push('Chronic Hypertension')
  if (data.histories.diabetes || (data.histories.diabetesType && data.histories.diabetesType !== 'none')) {
    flags.push(`Maternal Diabetes (${data.histories.diabetesType || 'Documented'})`)
  }
  if (data.histories.severeAnemiaHistory) flags.push('History of Severe Anemia')
  if (data.histories.renalDisease || data.histories.renalConditions) flags.push('Renal Disease')
  if (data.histories.epilepsy) flags.push('Maternal Epilepsy / Seizure Disorder')
  if (data.histories.tuberculosis) flags.push('Tuberculosis History')
  if (data.consanguinity.status === 'yes') flags.push('Consanguineous Union')

  // CBC Lab indicators
  const latestCbc = data.cbc[data.cbc.length - 1]
  const hb = latestCbc?.haemoglobin ?? data.investigations?.hemoglobin ?? data.thalassaemia?.maternalHb
  if (hb && hb < 7.0) {
    flags.push(`Severe Anemia (Hb ${hb} g/dL < 7.0)`)
  } else if (hb && hb < 9.0) {
    flags.push(`Moderate Anemia (Hb ${hb} g/dL)`)
  }

  // Vitals indicators (latest visit or general exam)
  const latestVisit = data.visits[data.visits.length - 1]
  const sys = latestVisit?.systolic ?? data.generalExam?.systolicBp
  const dia = latestVisit?.diastolic ?? data.generalExam?.diastolicBp
  if (sys && dia && (sys >= 140 || dia >= 90)) {
    flags.push(`Elevated Blood Pressure recorded (${sys}/${dia} mmHg)`)
  }

  // Multiple pregnancy
  if (data.pregnancy.multiplePregnancy || (data.pregnancy.plurality && data.pregnancy.plurality > 1)) {
    flags.push(`Multiple Gestation (${data.pregnancy.plurality || 2} Fetuses)`)
  }

  // Ultrasound anomalies
  if (data.ultrasounds.some(u => u.fetalAnomaliesDetected)) {
    flags.push('Structural / Chromosomal Fetal Anomaly Identified on Ultrasound')
  }

  const riskLevel: RiskLevel = flags.length > 0 ? 'HIGH' : 'LOW'
  return { riskLevel, flags }
}

// ============================================================================
// SPECS FOR DYNAMIC RENDERING & BACKWARDS COMPATIBILITY
// ============================================================================

export type FieldSpec = {
  key: string
  label: string
  type?: 'text' | 'date' | 'number' | 'textarea'
  options?: readonly string[]
  min?: number
  max?: number
  integer?: boolean
}

const text = (key: string, label: string): FieldSpec => ({ key, label })
const area = (key: string, label: string): FieldSpec => ({ key, label, type: 'textarea' })
const date = (key: string, label: string): FieldSpec => ({ key, label, type: 'date' })
const num = (key: string, label: string, max = 100, integer = true, min = 0): FieldSpec => ({ key, label, type: 'number', min, max, integer })
const choice = (key: string, label: string, options: readonly string[]): FieldSpec => ({ key, label, options })
const ga = [num('gaWeeks', 'Gestational weeks', 45), num('gaDays', 'Gestational days', 6)]
const testStatuses: TestStatus[] = ['unknown', 'not-tested', 'pending', 'negative', 'carrier', 'affected', 'other']

export const sections = {
  booking: [
    text('identifier', 'Patient / booking identifier'), text('name', 'Patient name'),
    date('dateOfBirth', 'Date of birth'), num('ageAtBooking', 'Age at booking (years)', 120),
    date('bookingDate', 'Booking date'), text('clinician', 'Booking clinician'),
    choice('bloodGroup', 'ABO blood group', ['unknown', 'A', 'B', 'AB', 'O']),
    choice('rhesus', 'Rh status', ['unknown', 'positive', 'negative', 'other']),
    num('heightCm', 'Booking height (cm)', 300, false), num('weightKg', 'Booking weight (kg)', 700, false),
    num('gravida', 'G — total pregnancies'), num('para', 'P — parity'),
    num('living', 'L — living children'), num('abortions', 'A — abortions / losses'),
    text('hospitalRegNumber', 'Hospital Registration / MRN'), text('address', 'Residential Address'),
    text('city', 'City'), text('state', 'State'), text('postalCode', 'Postal Code'),
    text('mobileNumber', 'Mobile Number'), text('alternatePhone', 'Alternate Phone Number'), text('emailId', 'Email ID'),
    text('partnerName', 'Partner / Husband Name'), text('emergencyContact', 'Emergency Contact Phone'),
    text('emergencyRelationship', 'Emergency Contact Relationship'),
    text('occupation', 'Occupation'), text('education', 'Education'),
    text('chwName', 'Community Health Worker / ASHA / ANM Name'),
    choice('literacyLevel', 'Literacy Level', ['illiterate', 'primary', 'secondary', 'high_school', 'graduate', 'postgraduate', 'other']),
    choice('socialClass', 'Social Class / Income', ['lower', 'upper_lower', 'lower_middle', 'upper_middle', 'upper', 'unknown']),
    choice('maritalStatus', 'Marital Status', ['married', 'unmarried', 'divorced', 'widowed', 'separated', 'other']),
    text('preferredLanguage', 'Preferred Language'),
  ],
  pregnancy: [
    date('lmp', 'Last menstrual period (LMP)'), choice('lmpCertain', 'LMP certain?', ['unknown', 'yes', 'no']),
    num('cycleDays', 'Usual cycle length (days)', 120), date('edd', 'Estimated due date (EDD)'),
    choice('datingBasis', 'Dating basis', ['unknown', 'lmp', 'ultrasound', 'assisted-conception', 'clinical']),
    date('gaAsOf', 'Gestational age as of'), ...ga,
    choice('conception', 'Conception', ['unknown', 'spontaneous', 'ovulation-induction', 'iui', 'ivf', 'icsi', 'other']),
    area('conceptionDetails', 'Conception / treatment details'), num('plurality', 'Number of fetuses', 20, true, 1),
    num('maritalDurationYears', 'Marital Duration (Years)', 60),
    choice('oralContraceptiveUse', 'Previous Oral Contraceptive Use', ['unknown', 'yes', 'no']),
    choice('previousDeliveryMode', 'Previous Delivery Mode', ['unknown', 'normal_vaginal', 'assisted_vaginal', 'lscs_emergency', 'lscs_elective', 'other']),
    choice('antiDGiven', 'Anti-D Status (for Rh -ve)', ['not_applicable', 'pending', 'given', 'not_given']),
    date('clinicianApprovedEdd', 'Clinician Approved Final EDD'),
  ],
  histories: [
    area('medical', 'Medical history summary'), area('surgical', 'Surgical history summary'), area('obstetric', 'Obstetric history summary'),
    area('family', 'Family history summary'), area('genetic', 'Genetic history / tests'), area('medications', 'Medication history'),
    area('socialExposures', 'Social history / exposures'), area('infections', 'Infection history'),
    area('immunisations', 'Immunisations'), area('mentalHealth', 'Mental health / support'),
  ],
  consanguinity: [
    choice('status', 'Consanguinity', ['unknown', 'yes', 'no']), text('relationship', 'Partner relationship'),
    text('degree', 'Degree / shared ancestor'), area('familyHistory', 'Relevant family history'),
  ],
  thalassaemia: [
    choice('maternalStatus', 'Maternal thalassaemia status', testStatuses), date('maternalTestDate', 'Maternal test date'),
    area('maternalResult', 'Maternal result / method'), choice('partnerStatus', 'Partner thalassaemia status', testStatuses),
    date('partnerTestDate', 'Partner test date'), area('partnerResult', 'Partner result / method'),
    area('haemoglobinAnalysis', 'Haemoglobin analysis / electrophoresis'), area('notes', 'Thalassaemia notes'),
  ],
  previousOutcomes: [
    num('year', 'Year', 2200, true, 1800),
    choice('outcome', 'Previous outcome', ['unknown', 'livebirth', 'miscarriage', 'elective-abortion', 'stillbirth', 'ectopic', 'molar']),
    ...ga, text('modeOfBirth', 'Mode of birth / management'), num('birthweightGrams', 'Birthweight (g)', 15000),
    text('livingStatus', 'Child survival / current status'), area('complications', 'Complications / cause of loss'),
    area('conditionDetails', 'Conditions / testing / outcome details'),
  ],
  cbc: [
    date('date', 'CBC date'), num('haemoglobin', 'Haemoglobin (g/dL)', 30, false), num('mcv', 'MCV (fL)', 250, false),
    num('mch', 'MCH (pg)', 100, false), num('wbc', 'WBC (×10⁹/L)', 1000, false), num('platelets', 'Platelets (×10⁹/L)', 5000, false),
    text('laboratory', 'Laboratory / report reference'), area('notes', 'CBC notes'),
  ],
  ultrasounds: [
    date('date', 'Scan date'), ...ga, text('purpose', 'Scan type / purpose'), area('findings', 'Findings / biometry / anomalies'),
    area('placentation', 'Placenta / chorionicity'), area('impression', 'Reported impression'), text('reportReference', 'Report reference'),
  ],
  risks: [
    choice('category', 'Risk category', ['medical', 'obstetric', 'genetic', 'social', 'other']),
    area('description', 'Clinician-recorded risk / context'), choice('status', 'Risk status', ['unknown', 'present', 'absent', 'resolved']),
    area('clinicianPlan', 'Clinician plan'),
  ],
  allergies: [
    text('substance', 'Allergen / substance'), area('reaction', 'Reaction'), choice('severity', 'Severity', ['unknown', 'mild', 'moderate', 'severe']),
    choice('verification', 'Allergy verification', ['reported', 'confirmed', 'uncertain']),
  ],
  visits: [
    date('date', 'Visit date'), text('clinician', 'Clinician'), ...ga, num('weightKg', 'Weight (kg)', 700, false),
    num('systolic', 'Systolic BP (mmHg)', 400), num('diastolic', 'Diastolic BP (mmHg)', 300), text('urine', 'Urine testing'),
    area('symptoms', 'Symptoms'), area('examination', 'Examination'), area('assessment', 'Clinician assessment'),
    area('plan', 'Plan / advice'), date('nextVisit', 'Next visit'),
  ],
  documents: [
    text('title', 'Document title'), choice('kind', 'Document kind', ['cbc', 'ultrasound', 'screening', 'other']),
    date('documentDate', 'Document date'), text('fileName', 'File name (metadata only)'), text('mimeType', 'MIME type'),
    num('sizeBytes', 'File size (bytes)', Number.MAX_SAFE_INTEGER), text('externalReference', 'External record reference'),
    choice('verification', 'Source verification', ['pending']), area('notes', 'Document notes'),
  ],
} satisfies Record<string, FieldSpec[]>

export type Section = keyof typeof sections
export const singular = ['booking', 'pregnancy', 'histories', 'consanguinity', 'thalassaemia'] as const
export const repeated = ['previousOutcomes', 'cbc', 'ultrasounds', 'risks', 'allergies', 'visits', 'documents'] as const
export type Repeated = (typeof repeated)[number]
export const specs = (key: Section): FieldSpec[] => sections[key]

export function emptySection(key: Section): Record<string, unknown> {
  return Object.fromEntries(specs(key).map((field) => [field.key, field.options?.[0] ?? (field.type === 'number' ? null : '')]))
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * Creates empty default routine ANC record for a new patient.
 * All clinical and patient fields are clean and unpopulated (no fake values).
 */
export function createEmptyRoutineAnc(): RoutineAncData {
  const today = new Date().toISOString().slice(0, 10)
  return {
    version: 1,
    sourceVerification: 'pending',
    booking: {
      identifier: '', // Generated later upon saving or booking
      name: '',
      dateOfBirth: '',
      ageAtBooking: null,
      bookingDate: today,
      clinician: '',
      bloodGroup: 'unknown',
      rhesus: 'unknown',
      heightCm: null,
      weightKg: null,
      gravida: null,
      para: null,
      living: null,
      abortions: null,
      hospitalRegNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      mobileNumber: '',
      alternatePhone: '',
      emailId: '',
      partnerName: '',
      emergencyContact: '',
      emergencyRelationship: '',
      occupation: '',
      education: '',
      chwName: '',
      literacyLevel: 'high_school',
      socialClass: 'lower_middle',
      maritalStatus: 'married',
      preferredLanguage: '',
    },
    pregnancy: {
      lmp: '',
      lmpCertain: 'yes',
      cycleDays: 28,
      edd: '',
      datingBasis: 'lmp',
      gaAsOf: today,
      gaWeeks: null,
      gaDays: null,
      conception: 'spontaneous',
      conceptionDetails: '',
      plurality: 1,
      maritalDurationYears: null,
      stillbirths: null,
      multiplePregnancy: false,
      pregnancyType: 'singleton',
      previousPregnancyComplications: '',
      oralContraceptiveUse: 'no',
      previousDeliveryMode: 'unknown',
      antiDGiven: 'not_applicable',
      trimester: 1,
    },
    histories: {
      medical: '',
      surgical: '',
      obstetric: '',
      family: '',
      genetic: '',
      medications: '',
      socialExposures: '',
      infections: '',
      immunisations: '',
      mentalHealth: '',
      diabetes: false,
      diabetesType: 'none',
      hypertension: false,
      chronicHypertension: false,
      thyroidDisorders: false,
      thyroidDisorder: 'none',
      cardiacConditions: false,
      cardiacDisease: false,
      renalConditions: false,
      renalDisease: false,
      epilepsy: false,
      tuberculosis: false,
      asthmaRespiratory: false,
      jaundiceHepatic: false,
      severeAnemiaHistory: false,
      previousSurgeries: '',
      previousCSectionCount: 0,
      previousCSectionIndications: '',
      uterineSurgeryMyomectomy: false,
      pelvicSurgery: false,
      infertilityHistoryYears: null,
      cervicalCerclageHistory: false,
      familyMedicalHistory: '',
      allergiesNotes: '',
      currentMedications: '',
      additionalHistories: [],
      domesticViolenceScreening: 'not_assessed',
      occupationalHazards: '',
      nutritionalDeficiency: false,
      substanceUse: 'none',
    },
    consanguinity: {
      status: 'no',
      relationship: '',
      degree: '',
      familyHistory: '',
    },
    thalassaemia: {
      maternalStatus: 'not-tested',
      maternalTestDate: '',
      maternalResult: '',
      partnerStatus: 'not-tested',
      partnerTestDate: '',
      partnerResult: '',
      haemoglobinAnalysis: '',
      notes: '',
      nestroftResult: 'not_done',
      partnerTestingAdvised: false,
    },
    previousOutcomes: [],
    cbc: [],
    ultrasounds: [],
    risks: [],
    allergiesStatus: 'none-known',
    allergies: [],
    visits: [],
    documents: [],
    generalExam: {
      pulseBpm: null,
      systolicBp: null,
      diastolicBp: null,
      bloodPressure: '',
      temperatureF: null,
      respiratoryRate: null,
      bmi: null,
      bmiCategory: 'normal',
      pallor: 'absent',
      jaundice: false,
      cyanosis: false,
      clubbing: false,
      pedalEdema: 'none',
      lymphadenopathy: false,
      cvsFindings: '',
      respiratoryFindings: '',
      breastExam: '',
      thyroidExam: '',
      generalExamNotes: '',
    },
    investigations: {
      bloodGroupRh: '',
      hemoglobin: null,
      hivStatus: 'pending',
      hbsAgStatus: 'pending',
      hcvStatus: 'pending',
      vdrlRprStatus: 'pending',
      rubellaIgg: 'pending',
      tshValueMiuL: null,
      urineRoutineProtein: 'nil',
      urineRoutineSugar: 'nil',
      urinePusCells: '',
      dipsiBloodSugarMgDl: null,
      fastingBloodSugarMgDl: null,
      ogtt1HourMgDl: null,
      ogtt2HourMgDl: null,
      bloodGlucosePostPrandial: null,
      bloodGlucoseRandom: null,
      hbA1cPercent: null,
      serumCreatinineMgDl: null,
      otherTests: [],
    },
    vaccinations: {
      td1Date: '',
      td1Batch: '',
      td1GivenBy: '',
      td2Date: '',
      td2Batch: '',
      td2GivenBy: '',
      tdBoosterDate: '',
      tdBoosterBatch: '',
      tdapDate: '',
      tdapBatch: '',
      influenzaDate: '',
      covid19Doses: '',
      notes: '',
      records: [],
    },
    birthPlan: {
      preferredPlaceOfDelivery: 'district_hospital',
      expectedDeliveryFacility: '',
      identifiedHospitalName: '',
      identifiedBirthCompanion: '',
      birthPreferences: '',
      deliveryPlanningNotes: '',
      emergencyTransportContact: '',
      bloodDonorIdentified: false,
      bloodDonorContact: '',
      exclusiveBreastfeedingCounseled: false,
      postpartumContraceptionCounseled: false,
      dangerSignsExplained: false,
      dangerSignsListAck: false,
      referralFacility: '',
      referralReason: '',
      referralDate: '',
      referralStatus: 'none',
    },
    referralOutcome: {
      isReferred: false,
      referralReason: '',
      referralUrgency: 'routine',
      referredFacilityName: '',
      referralDate: '',
      referralSummary: '',
      referralStatus: 'none',
      attendingDoctorSignoff: '',
      deliveryOccurred: false,
      deliveryDate: '',
      deliveryTime: '',
      deliveryMode: 'unknown',
      lscsIndication: '',
      deliveryGaWeeks: null,
      babyGender: 'unknown',
      birthWeightKg: null,
      apgar1Min: null,
      apgar5Min: null,
      resuscitationNeeded: false,
      maternalComplications: '',
      neonatalComplications: '',
      dischargeDate: '',
      postpartumStatus: '',
    },
    riskClassification: {
      riskLevel: 'LOW',
      calculatedRiskLevel: 'LOW',
      clinicianConfirmedRiskLevel: 'PENDING',
      highRiskFlags: [],
      maternalAgeRisk: 'Normal maternal age',
      previousObstetricComplicationsRisk: 'None reported',
      medicalRiskFactors: [],
      pregnancyRelatedRiskFactors: [],
      socialRiskFactors: [],
      preEclampsiaRisk: 'low',
      aspirinRecommended: false,
      clinicalRemarks: '',
      clinicianOverride: false,
      clinicianOverrideRationale: '',
      clinicianApproved: false,
      approvedByClinicianName: '',
      approvedAt: '',
    },
    status: 'ACTIVE',
    lastUpdated: today,
  }
}

/** Validates the version 1 model, preserving backwards compatibility and stripping dangerous inputs */
export function parseRoutineAnc(input: unknown): ParseResult<RoutineAncData> {
  let value = input
  if (typeof value === 'string') {
    try { value = JSON.parse(value) } catch { return { success: false, errors: ['Invalid JSON.'] } }
  }
  if (!isRecord(value) || value.version !== 1 || value.sourceVerification !== 'pending') {
    return { success: false, errors: ['Expected version 1 ANC record with pending source verification.'] }
  }
  const errors: string[] = []
  const clean: Record<string, unknown> = {
    version: 1,
    sourceVerification: 'pending',
  }

  function parseSection(raw: unknown, key: Section, path: string, row: boolean): Record<string, unknown> {
    if (!isRecord(raw)) { errors.push(`${path}: expected an object.`); return {} }
    const out: Record<string, unknown> = {}
    if (row) {
      if (typeof raw.id !== 'string' || !raw.id || raw.id.length > 200) errors.push(`${path}: invalid row ID.`)
      else out.id = raw.id
    }
    for (const field of specs(key)) {
      const item = raw[field.key]
      const name = `${path}.${field.key}`
      if (field.type === 'number') {
        if (item !== null && item !== undefined && (typeof item !== 'number' || !Number.isFinite(item) || item < (field.min ?? 0) ||
          item > (field.max ?? Infinity) || (field.integer && !Number.isInteger(item)))) {
          errors.push(`${name}: expected null or ${field.integer ? 'integer' : 'number'} ${field.min ?? 0}–${field.max}.`)
        }
      } else if (item !== undefined && item !== null && (typeof item !== 'string' || item.length > 5000 || (field.options && !field.options.includes(item)) ||
        (field.type === 'date' && item !== '' && !validDate(item)))) {
        errors.push(`${name}: invalid text, option or date.`)
      }
      out[field.key] = item ?? (field.type === 'number' ? null : '')
    }
    // Retain any additional extended properties on the section
    for (const extraKey of Object.keys(raw)) {
      if (!(extraKey in out)) {
        out[extraKey] = raw[extraKey]
      }
    }
    return out
  }

  for (const key of singular) clean[key] = parseSection(value[key], key, key, false)
  for (const key of repeated) {
    const rows = value[key]
    if (!Array.isArray(rows) || rows.length > 100) { errors.push(`${key}: expected up to 100 entries.`); continue }
    const parsed = rows.map((row, index) => parseSection(row, key, `${key}[${index + 1}]`, true))
    if (new Set(parsed.map((row) => row.id)).size !== parsed.length) errors.push(`${key}: row IDs must be unique.`)
    clean[key] = parsed
  }

  if (!['unknown', 'none-known', 'recorded'].includes(value.allergiesStatus as string)) {
    clean.allergiesStatus = 'none-known'
  } else {
    clean.allergiesStatus = value.allergiesStatus
  }

  // Preserve extended properties
  const extendedKeys = ['generalExam', 'investigations', 'vaccinations', 'birthPlan', 'referralOutcome', 'riskClassification', 'status', 'archived', 'archivedAt', 'archivedBy', 'archivalReason', 'lastUpdated'] as const
  for (const k of extendedKeys) {
    if (value[k] !== undefined) {
      clean[k] = value[k]
    }
  }

  return errors.length ? { success: false, errors } : { success: true, data: clean as unknown as RoutineAncData }
}
