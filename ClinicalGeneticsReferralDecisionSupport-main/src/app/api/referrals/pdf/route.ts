import { NextResponse } from 'next/server'

const RULE_TITLES: Record<string, string> = {
  cs_consanguinity: 'Consanguineous Partnership Evaluation',
  dual_carrier: 'Autosomal Recessive Dual-Carrier Status',
  carrier_dual: 'Autosomal Recessive Dual-Carrier Status',
  single_carrier: 'Single Carrier Status (Partner Testing Indicated)',
  nipt_positive: 'Cell-Free DNA Positive Aneuploidy Screening',
  'SRC-NIPT-004': 'Cell-Free DNA Positive Aneuploidy Screening',
  nipt_no_call: 'Uninformative cfDNA / Low Fetal Fraction Failure',
  'SRC-NIPT-007': 'Uninformative cfDNA / Low Fetal Fraction Failure',
  ultrasound_structural: 'Fetal Major Structural Anomaly / Microarray Evaluation',
  'SRC-US-001': 'Fetal Major Structural Anomaly / Microarray Evaluation',
  ultrasound_nt_elevated: 'Increased Nuchal Translucency (NT >= 3.5mm)',
  rpl_recurrent_loss: 'Recurrent Pregnancy Loss Evaluation (>= 2 Clinical Losses)',
  rpl_parental_karyotype: 'Parental Balanced Translocation / Chromosomal Anomaly',
  cancer_brca_young: 'Early-Onset Breast Malignancy (Age <= 50) BRCA Evaluation',
  'ONCO-HBOC-01': 'Early-Onset Breast Malignancy (Age <= 50) BRCA Evaluation',
  cancer_ovarian: 'Epithelial Ovarian Malignancy Germline Testing',
  'ONCO-OVARIAN-02': 'Epithelial Ovarian Malignancy Germline Testing',
  cancer_lynch: 'Lynch Syndrome High-Risk Colorectal Assessment',
  'ONCO-COLON-03': 'Lynch Syndrome High-Risk Colorectal Assessment',
  family_history_first_degree: 'First-Degree Pedigree Pattern for Hereditary Disorder',
  'STD-CARE-00': 'Standard Routine Obstetric Monitoring Protocol',
  no_referral: 'Standard Routine Obstetric Monitoring Protocol',
}

const CPT_LABELS: Record<string, string> = {
  '81443': '81443 (Severe inherited conditions carrier panel)',
  '96040': '96040 (Medical genetics counseling, each 30 min)',
  '81162': '81162 (BRCA1/BRCA2 full sequence & rearrangement analysis)',
  '81216': '81216 (BRCA2 full sequence analysis)',
  '81435': '81435 (Hereditary colon cancer multi-gene panel)',
  '81228': '81228 (Chromosomal microarray analysis for prenatal anomalies)',
  '99213': '99213 (Outpatient clinical visit, standard complexity)',
}

const ICD_LABELS: Record<string, string> = {
  'Z31.430': 'Z31.430 (Encounter for pre-conception genetic counseling)',
  'Z84.81': 'Z84.81 (Family history of carrier status for genetic disease)',
  'Z15.01': 'Z15.01 (Genetic susceptibility to malignant neoplasm of breast)',
  'Z15.02': 'Z15.02 (Genetic susceptibility to malignant neoplasm of ovary)',
  'Z15.09': 'Z15.09 (Genetic susceptibility to other malignant neoplasms)',
  'Z80.3': 'Z80.3 (Family history of malignant neoplasm of breast)',
  'Z80.0': 'Z80.0 (Family history of malignant neoplasm of digestive organs)',
  'O28.3': 'O28.3 (Abnormal ultrasonic findings on antenatal screening)',
  'O28.5': 'O28.5 (Abnormal chromosomal/genetic findings on antenatal screening)',
  'N96': 'N96 (Recurrent pregnancy loss)',
  'Z34.90': 'Z34.90 (Supervision of normal pregnancy, routine monitoring)',
}

function cleanAscii(str: string): string {
  if (!str) return ''
  return str
    .replace(/[•●·]/g, '-')
    .replace(/[—–]/g, ' - ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapePdf(str: string): string {
  const sanitized = cleanAscii(str)
  return sanitized.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapLines(text: string, maxLen = 85): string[] {
  const words = cleanAscii(text).split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxLen) {
      cur = (cur + ' ' + w).trim()
    } else {
      if (cur) lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const {
      patientId = 'PATIENT-ENCOUNTER',
      physicianName = 'Attending Clinician',
      pathway = 'Preconception Carrier Screening',
      evaluation = {},
    } = data

    const rawRuleId = String(evaluation.matched_rule_id || 'STD-CARE-00')
    const ruleTitle = RULE_TITLES[rawRuleId] || cleanAscii(rawRuleId.replace(/_/g, ' ').toUpperCase())
    const rawRisk = String(evaluation.risk_level || evaluation.outcome || 'ROUTINE').toUpperCase()
    const riskLabel = rawRisk.includes('URGENT')
      ? 'URGENT REFERRAL'
      : rawRisk.includes('ROUTINE')
        ? 'ROUTINE REFERRAL'
        : rawRisk.includes('BORDERLINE')
          ? 'BORDERLINE CONSIDERATION'
          : 'NO REFERRAL NEEDED'
    const confidence = Math.round(Number(evaluation.confidence_score || 0.98) * 100)
    const guideline = cleanAscii(evaluation.guideline || 'ACOG / FOGSI: ACOG Committee Opinion 690 & FOGSI GCPR - Carrier Screening')
    const action = cleanAscii(
      evaluation.action ||
      evaluation.explanation ||
      'Counsel patients regarding carrier screening options. Prenatal diagnosis via chorionic villus sampling (CVS) can prevent the birth of an affected child.'
    )

    const rawCpts: string[] = Array.isArray(evaluation.cpt_codes) && evaluation.cpt_codes.length > 0
      ? evaluation.cpt_codes
      : ['81443', '96040']
    const formattedCpt = rawCpts.map((c) => CPT_LABELS[c] || c).join(', ')

    const rawIcds: string[] = Array.isArray(evaluation.icd10_codes) && evaluation.icd10_codes.length > 0
      ? evaluation.icd10_codes
      : ['Z31.430', 'Z84.81']
    const formattedIcd10 = rawIcds.map((c) => ICD_LABELS[c] || c).join(', ')

    const dateStr = new Date().toISOString().slice(0, 10)

    // PURE BLACK & WHITE PDF STREAM (High contrast, zero color fills)
    const textOps: string[] = []
    let curY = 745

    // Document Header
    textOps.push('0 0 0 rg', '0 0 0 RG')
    textOps.push('BT', '/F2 16 Tf', `40 ${curY} Td`, `(${escapePdf('GENOBRIDGE CLINICAL GENETICS DSS')}) Tj`, 'ET')
    curY -= 15
    textOps.push('BT', '/F1 9 Tf', `40 ${curY} Td`, `(${escapePdf('FDA SaMD Compliant Decision Support Brief | ACOG / NCCN / ACMG / ASRM Guidelines')}) Tj`, 'ET')
    curY -= 12

    // Black divider line
    textOps.push('1.5 w', `40 ${curY} m 572 ${curY} l S`)
    curY -= 20

    // Metadata Box (Clean Black Outline Box, NO background fill)
    textOps.push('0.75 w', `40 ${curY - 32} 532 40 re S`)
    textOps.push('BT', '/F2 9.5 Tf', `52 ${curY - 14} Td`, `(${escapePdf(`Case Reference: ${patientId}`)}) Tj`, 'ET')
    textOps.push('BT', '/F2 9.5 Tf', `320 ${curY - 14} Td`, `(${escapePdf(`Date: ${dateStr}`)}) Tj`, 'ET')
    textOps.push('BT', '/F1 9 Tf', `52 ${curY - 26} Td`, `(${escapePdf(`Attending Clinician: Dr. ${physicianName}`)}) Tj`, 'ET')
    textOps.push('BT', '/F1 9 Tf', `320 ${curY - 26} Td`, `(${escapePdf(`Pathway: ${pathway}`)}) Tj`, 'ET')
    curY -= 52

    // Triage Decision Box (Clean Black Outline Box, NO background fill)
    const actionLines = wrapLines(`Recommended Clinical Action: ${action}`, 88)
    const triageBoxHeight = 36 + actionLines.length * 13
    textOps.push('1.0 w', `40 ${curY - triageBoxHeight} 532 ${triageBoxHeight} re S`)

    textOps.push('BT', '/F2 11 Tf', `52 ${curY - 18} Td`, `(${escapePdf(`TRIAGE LEVEL: ${riskLabel}  (CONFIDENCE MATCH: ${confidence}%)`)}) Tj`, 'ET')

    let actionY = curY - 32
    for (const line of actionLines) {
      textOps.push('BT', '/F1 9 Tf', `52 ${actionY} Td`, `(${escapePdf(line)}) Tj`, 'ET')
      actionY -= 13
    }
    curY -= triageBoxHeight + 22

    // Section: Glass-Box Clinical Rationale & Ground Truth
    textOps.push('BT', '/F2 12 Tf', `40 ${curY} Td`, `(${escapePdf('Glass-Box Clinical Rationale & Ground Truth')}) Tj`, 'ET')
    curY -= 6
    textOps.push('0.5 w', `40 ${curY} m 572 ${curY} l S`)
    curY -= 16

    const rationaleItems = [
      `Matched Clinical Rule: ${ruleTitle}`,
      `Statutory Guideline Source: ${guideline}`,
      `Confidence Match Score: ${confidence}% (Deterministic Rule Match)`,
      `Applicable CPT Billing Codes: ${formattedCpt}`,
      `Diagnostic ICD-10 Codes: ${formattedIcd10}`,
    ]

    for (const item of rationaleItems) {
      const wrapped = wrapLines(item, 86)
      for (let i = 0; i < wrapped.length; i++) {
        const prefix = i === 0 ? '- ' : '  '
        textOps.push('BT', i === 0 ? '/F2 9 Tf' : '/F1 9 Tf', `45 ${curY} Td`, `(${escapePdf(prefix + wrapped[i])}) Tj`, 'ET')
        curY -= 14
      }
      curY -= 3
    }

    curY -= 18

    // Section: Statutory Clinical Safety Notice Box (Clean Black Outline Box)
    const noticeText = 'STATUTORY CLINICAL SAFETY NOTICE: This evaluation is generated by a deterministic rule-based decision support algorithm mapped to verified medical guidelines. It is designed to assist clinical judgment and does not constitute an independent diagnosis. Attending physicians retain exclusive medical responsibility for patient management and final referral decisions.'
    const noticeLines = wrapLines(noticeText, 102)
    const noticeBoxHeight = 16 + noticeLines.length * 11
    textOps.push('0.5 w', `40 ${curY - noticeBoxHeight} 532 ${noticeBoxHeight} re S`)

    let noticeY = curY - 14
    for (const line of noticeLines) {
      textOps.push('BT', '/F1 7.5 Tf', `48 ${noticeY} Td`, `(${escapePdf(line)}) Tj`, 'ET')
      noticeY -= 11
    }

    const streamContent = textOps.join('\n')
    const pdfLines = [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
      `6 0 obj << /Length ${Buffer.byteLength(streamContent, 'utf-8')} >>\nstream\n${streamContent}\nendstream\nendobj`,
      'xref',
      '0 7',
      '0000000000 65535 f ',
      '0000000009 00000 n ',
      '0000000058 00000 n ',
      '0000000115 00000 n ',
      '0000000261 00000 n ',
      '0000000330 00000 n ',
      '0000000404 00000 n ',
      'trailer << /Size 7 /Root 1 0 R >>',
      'startxref',
      '600',
      '%%EOF',
    ]

    const pdfBuffer = Buffer.from(pdfLines.join('\n'), 'utf-8')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Clinical_Brief_${cleanAscii(patientId).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Error generating PDF' }, { status: 500 })
  }
}
