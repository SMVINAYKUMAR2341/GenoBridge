/**
 * GENOBRIDGE CLINICAL, REGULATORY & MEDICO-LEGAL GUARDRAILS ENGINE
 * 
 * Implements deterministic safety, statutory, and clinical boundary protections:
 * 1. PC&PNDT Act 1994 Compliance (Zero Prenatal Sex Determination / Fetal Sex Disclosure)
 * 2. MTP Amendment Act 2021 Timeline Guardrails (<20w, 20-24w, >24w Medical Board)
 * 3. Clinical Scope Enforcement (Non-Diagnostic, Non-Prescriptive Referral Navigation)
 * 4. Physiological Parameter Sanity & Range Boundary Checks
 * 5. Doctor-in-the-Loop Attestation Verification
 */

export interface GuardrailValidationResult {
  passed: boolean
  blocked: boolean
  violations: string[]
  warnings: string[]
  statutoryNotice?: string
  mtpContext?: {
    gestationalAgeWeeks: number
    tier: 'TIER_1_SINGLE_DOCTOR' | 'TIER_2_TWO_DOCTORS' | 'TIER_3_MEDICAL_BOARD' | 'PRECONCEPTION_OR_UNKNOWN'
    statutoryRule: string
    isTimeCritical: boolean
  }
}

// Prohibited terms under PC&PNDT Act 1994 Section 6 (Sex selection / determination)
const PROHIBITED_SEX_SELECTION_PATTERNS = [
  /\b(fetal\s*sex|fetal\s*gender|baby\s*gender|gender\s*reveal|sex\s*determination|sex\s*selection)\b/i,
  /\b(gender\s*of\s*(the\s*)?(fetus|baby|child))\b/i,
  /\b(boy\s*or\s*girl|is\s*it\s*a\s*(boy|girl))\b/i,
  /\b(determine\s*(the\s*)?(sex|gender))\b/i,
  /\b(prenatal\s*sex\s*test)\b/i,
]

// Diagnostic / Prescriptive terms out-of-scope for assistive referral navigation
const PRESCRIPTION_SCOPE_PATTERNS = [
  /\b(prescribe|dispense\s*medication|start\s*dosage|drug\s*treatment\s*plan|chemotherapy\s*regimen)\b/i,
]

/**
 * Validates clinical inputs and notes against statutory Indian healthcare acts & safety bounds.
 */
export function validateClinicalGuardrails(
  inputs: Record<string, unknown> = {},
  notesOrQuery = '',
): GuardrailValidationResult {
  const violations: string[] = []
  const warnings: string[] = []

  // Combine all stringifiable inputs for deep scanning
  const combinedText = [
    notesOrQuery,
    JSON.stringify(inputs),
  ].join(' ')

  // 1. STATUTORY GUARDRAIL: PC&PNDT Act 1994
  for (const pattern of PROHIBITED_SEX_SELECTION_PATTERNS) {
    if (pattern.test(combinedText)) {
      violations.push(
        'STATUTORY VIOLATION (PC&PNDT Act, 1994): Prenatal fetal sex determination and gender disclosure requests are strictly prohibited by Indian law and blocked by GenoBridge platform safety guardrails.'
      )
      break
    }
  }

  // 2. CLINICAL SCOPE GUARDRAIL: Assistive Decision Support vs Autonomous Prescription
  for (const pattern of PRESCRIPTION_SCOPE_PATTERNS) {
    if (pattern.test(combinedText)) {
      warnings.push(
        'CLINICAL SCOPE GUARDRAIL: GenoBridge provides assistive referral navigation and risk stratification. Definitive medical diagnoses and drug prescriptions remain the sole clinical responsibility of the attending physician.'
      )
      break
    }
  }

  // 3. PHYSIOLOGICAL SANITY & OUT-OF-BOUNDS CHECKS
  const maternalAge = Number(inputs.maternal_age || inputs.age || inputs.ageAtBooking)
  if (!isNaN(maternalAge) && maternalAge > 0) {
    if (maternalAge < 12 || maternalAge > 65) {
      warnings.push(
        `PHYSIOLOGICAL OUTLIER: Documented maternal age (${maternalAge} years) exceeds standard clinical screening baselines (12–65 years). Verify clinical entry.`
      )
    }
  }

  const gaWeeks = Number(inputs.ga_weeks || inputs.gaWeeks || inputs.gestational_age_weeks)
  if (!isNaN(gaWeeks) && gaWeeks > 0) {
    if (gaWeeks > 44) {
      warnings.push(
        `PHYSIOLOGICAL OUTLIER: Documented gestational age (${gaWeeks} weeks) exceeds term limit (> 44 weeks).`
      )
    }
  }

  const nuchalTranslucency = Number(inputs.nt_measurement_mm || inputs.nuchal_translucency_mm || inputs.ntMm)
  if (!isNaN(nuchalTranslucency) && nuchalTranslucency > 0) {
    if (nuchalTranslucency > 20) {
      warnings.push(
        `PHYSIOLOGICAL OUTLIER: NT measurement (${nuchalTranslucency} mm) is extraordinarily elevated. Verify caliper calibration or ultrasound report attachment.`
      )
    }
  }

  // 4. STATUTORY TIMELINE GUARDRAIL: MTP Act 2021 Tiers
  let mtpContext: GuardrailValidationResult['mtpContext'] = undefined

  if (!isNaN(gaWeeks) && gaWeeks > 0) {
    let tier: 'TIER_1_SINGLE_DOCTOR' | 'TIER_2_TWO_DOCTORS' | 'TIER_3_MEDICAL_BOARD' | 'PRECONCEPTION_OR_UNKNOWN' = 'TIER_1_SINGLE_DOCTOR'
    let statutoryRule = 'MTP Act Section 3(2)(a): Up to 20 weeks gestation requires opinion of one Registered Medical Practitioner.'
    let isTimeCritical = false

    if (gaWeeks > 24) {
      tier = 'TIER_3_MEDICAL_BOARD'
      statutoryRule = 'MTP Act Section 3(2B): Gestation exceeds 24 weeks. Termination permitted only for substantial fetal abnormalities diagnosed by statutory State Medical Board.'
      isTimeCritical = true
    } else if (gaWeeks >= 20) {
      tier = 'TIER_2_TWO_DOCTORS'
      statutoryRule = 'MTP Act Section 3(2)(b): Gestation between 20 to 24 weeks requires concurrence of two Registered Medical Practitioners for eligible statutory indications.'
      isTimeCritical = true
    } else if (gaWeeks >= 18) {
      isTimeCritical = true // Rapidly approaching 20-week milestone
    }

    mtpContext = {
      gestationalAgeWeeks: gaWeeks,
      tier,
      statutoryRule,
      isTimeCritical,
    }
  }

  const blocked = violations.length > 0
  const passed = !blocked

  return {
    passed,
    blocked,
    violations,
    warnings,
    statutoryNotice:
      'GenoBridge AI operates strictly under CDSCO/MoHFW SaMD safety standards. Attending clinicians maintain complete autonomy and legal responsibility.',
    mtpContext,
  }
}

/**
 * Validates clinician attestation requirements for signed referral generation.
 */
export function validateClinicianAttestation(user: {
  name?: string
  medicalRegistrationNumber?: string
  nursingRegistrationNumber?: string
  role?: string
}): { valid: boolean; reason?: string } {
  if (!user) {
    return { valid: false, reason: 'Authentication required. No active clinical user.' }
  }

  const isDoctor = user.role === 'provider' || user.role === 'doctor' || user.role === 'admin'
  if (!isDoctor) {
    return {
      valid: false,
      reason: 'Statutory guardrail: Formal clinical referrals require an attending Medical Practitioner (OB/GYN or Specialist).',
    }
  }

  const regNo = user.medicalRegistrationNumber
  if (!regNo || regNo.trim().length < 3 || regNo.includes('REG-74892')) {
    return {
      valid: false,
      reason: 'Statutory guardrail: Valid Medical Council Registration Number (NMC / State Medical Council) is required for signed clinical referral generation.',
    }
  }

  return { valid: true }
}
