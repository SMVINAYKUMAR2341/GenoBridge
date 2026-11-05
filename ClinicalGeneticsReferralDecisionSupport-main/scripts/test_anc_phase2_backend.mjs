// HELIX ANTENATAL CARE (ANC) PHASE 2 — BACKEND & JSON PERSISTENCE VERIFICATION
// Tests JSON persistence, atomic writes, backup snapshots, audit logging,
// draft saving, multi-visit logging, PDF report generation, and archival.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'http://localhost:3000'
const results = []

function recordTest(name, passed, details) {
  results.push({ name, status: passed ? 'PASSED' : 'FAILED', details })
  const color = passed ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}[${passed ? 'PASSED' : 'FAILED'}]\x1b[0m ${name} : ${details}`)
}

async function request(urlPath, options = {}) {
  const url = `${BASE_URL}${urlPath}`
  try {
    const res = await fetch(url, options)
    let json = null
    const text = await res.text()
    try {
      json = JSON.parse(text)
    } catch {
      // binary or html
    }
    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      data: json,
      raw: text,
      buffer: () => Buffer.from(text, 'binary'),
    }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function run() {
  console.log('\x1b[36m=================================================================\x1b[0m')
  console.log('\x1b[36mHELIX ANC PHASE 2: JSON STORAGE, PERSISTENCE & REPORT ENGINE TEST\x1b[0m')
  console.log('\x1b[36m=================================================================\x1b[0m\n')

  // --- 1. Verify Storage Directories and Removal of Seed Data ---
  console.log('\x1b[33m--- 1. Storage Inspection & Hardcoded Data Elimination ---\x1b[0m')
  const dataDir = path.resolve('.helix_data')
  const ancFile = path.join(dataDir, 'anc_records.json')
  const auditFile = path.join(dataDir, 'audit_logs.json')
  const reportsDir = path.join(dataDir, 'reports')
  const backupsDir = path.join(dataDir, 'backups')

  recordTest('Storage directory exists', fs.existsSync(dataDir), `.helix_data present`)
  recordTest('Backups directory exists', fs.existsSync(backupsDir), `.helix_data/backups present`)
  recordTest('Reports directory exists', fs.existsSync(reportsDir), `.helix_data/reports present`)

  let initialRecords = []
  if (fs.existsSync(ancFile)) {
    try {
      initialRecords = JSON.parse(fs.readFileSync(ancFile, 'utf8'))
    } catch {
      initialRecords = []
    }
  }

  const hasSeedRecords = initialRecords.some(
    (r) => r.booking?.name === 'Priya Sharma' || r.booking?.name === 'Ananya Deshmukh',
  )
  recordTest(
    'Seed and sample records eliminated',
    !hasSeedRecords,
    `Existing records in storage: ${initialRecords.length} (Sample records successfully cleared)`,
  )

  // --- 2. Setup Authenticated Clinical Nurse Session ---
  console.log('\n\x1b[33m--- 2. Setting Up Verified Clinical Nurse Session ---\x1b[0m')
  const psqlPath = '"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"'
  const psqlEnv = { ...process.env, PGPASSWORD: 'helix_dev_password_2026' }

  const nurseEmail = `nurse_p2_${Date.now()}@manipalhospitals.com`
  const password = 'ClinicalPassword2026!'

  await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Kavita',
      lastName: 'Shinde',
      email: nurseEmail,
      phone: '+91 9833002244',
      password: password,
      confirmPassword: password,
      category: 'nurse',
      nursingRegistrationNumber: 'MNC/2026/8899',
      stateNursingCouncil: 'Maharashtra Nursing Council',
      hospitalClinicName: 'Manipal Hospital, Kharadi',
      department: 'Obstetrics & Antenatal Clinic',
      professionalDesignation: 'Senior Staff Nurse (Maternal Health)',
      termsAgreed: true,
      privacyAgreed: true,
      verificationAcknowledged: true,
    }),
  })

  // Activate in database
  execSync(
    `${psqlPath} -h localhost -U postgres -d helix_staging -c "UPDATE \\"users\\" SET \\"emailVerified\\" = true, \\"verificationStatus\\" = 'APPROVED', \\"enabled\\" = true WHERE \\"email\\" = '${nurseEmail}';"`,
    { env: psqlEnv, stdio: 'pipe' },
  )

  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: nurseEmail, password: password }),
  })

  const setCookie = loginRes.headers.get('set-cookie') || ''
  const cookieHeader = setCookie
    .split(',')
    .map((c) => c.split(';')[0].trim())
    .join('; ')

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
  }

  recordTest('Nurse session authenticated', loginRes.ok, `Nurse signed in (${nurseEmail})`)

  // --- 3. Empty Dashboard State ---
  console.log('\n\x1b[33m--- 3. Testing Empty Dashboard & Search API ---\x1b[0m')
  const emptyRes = await request('/api/anc', { headers: authHeaders })
  recordTest(
    'GET /api/anc returns initial list & KPI stats',
    emptyRes.ok && emptyRes.data?.stats !== undefined,
    `Total records: ${emptyRes.data?.records?.length || 0}`,
  )

  // --- 4. Patient Registration & JSON Persistence ---
  console.log('\n\x1b[33m--- 4. Registering Real Patient & Testing JSON Persistence ---\x1b[0m')
  const newPatientPayload = {
    version: 1,
    sourceVerification: 'pending',
    booking: {
      identifier: '', // Backend should generate
      name: 'Meera Patel',
      dateOfBirth: '1998-04-12',
      ageAtBooking: 28,
      bookingDate: new Date().toISOString().slice(0, 10),
      clinician: 'Staff Nurse Kavita Shinde / Dr. Sneha Rao',
      bloodGroup: 'B',
      rhesus: 'positive',
      heightCm: 160,
      weightKg: 58,
      gravida: 2,
      para: 1,
      living: 1,
      abortions: 0,
      hospitalRegNumber: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
      mobileNumber: '+91 98221 44556',
      address: 'Flat 402, Sai Vihar, Shivaji Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411005',
      emergencyContact: '+91 98221 44550 (Husband: Rahul Patel)',
    },
    pregnancy: {
      lmp: '2025-11-15',
      lmpCertain: 'yes',
      cycleDays: 28,
      edd: '', // Auto-calculated
      datingBasis: 'lmp',
      gaAsOf: new Date().toISOString().slice(0, 10),
      gaWeeks: null, // Auto-calculated
      gaDays: null,
      conception: 'spontaneous',
      conceptionDetails: '',
      plurality: 1,
      multiplePregnancy: false,
      pregnancyType: 'singleton',
    },
    histories: {
      medical: 'Nil chronic illness',
      surgical: 'Nil',
      obstetric: 'Full term normal delivery 2023',
      family: 'Nil hereditary disorder',
      genetic: 'Nil',
      medications: 'Folic acid 5mg',
      socialExposures: 'Nil',
      infections: 'Nil',
      immunisations: 'Childhood vaccines complete',
      mentalHealth: 'Nil',
      diabetes: false,
      hypertension: false,
      thyroidDisorders: false,
      cardiacDisease: false,
      renalDisease: false,
      epilepsy: false,
      tuberculosis: false,
      previousSurgeries: 'None',
    },
    consanguinity: {
      status: 'none',
      degree: 'not_applicable',
      details: '',
    },
    thalassaemia: {
      familyHistory: 'negative',
      consanguineousUnion: false,
      maternalMcv: 88,
      maternalMch: 29,
      maternalHb: 12.2,
      partnerTested: false,
      partnerMcv: null,
      partnerMch: null,
      partnerHb: null,
      interpretation: 'Low risk of hemoglobinopathy',
    },
    previousOutcomes: [
      {
        id: 'po-1',
        pregnancyNumber: 1,
        year: 2023,
        gestationalAgeWeeks: 39,
        gaWeeks: 39,
        gaDays: 2,
        deliveryType: 'Normal Vaginal Delivery',
        modeOfBirth: 'Normal Vaginal Delivery',
        birthOutcome: 'livebirth',
        outcome: 'livebirth',
        babyWeight: 3.1,
        birthweightGrams: 3100,
        livingStatus: 'Alive and healthy',
        complications: 'None',
        conditionDetails: '',
        remarks: 'Institutional delivery at civil hospital',
      },
    ],
    cbc: [],
    ultrasounds: [],
    risks: [],
    allergiesStatus: 'none-known',
    allergies: [],
    visits: [],
    documents: [],
    generalExam: {
      pulseBpm: 76,
      systolicBp: 118,
      diastolicBp: 78,
      temperatureF: 98.4,
      respiratoryRate: 18,
      bmi: null,
      bmiCategory: 'normal',
      pallor: 'absent',
      jaundice: false,
      cyanosis: false,
      clubbing: false,
      pedalEdema: 'none',
      lymphadenopathy: false,
      cvsFindings: 'S1 S2 normal',
      respiratoryFindings: 'Clear bilaterally',
      breastExam: 'Normal',
      thyroidExam: 'Normal, no goitre',
    },
    investigations: {
      bloodGroupRh: 'B positive',
      hemoglobin: 12.2,
      hivStatus: 'non_reactive',
      hbsAgStatus: 'non_reactive',
      hcvStatus: 'non_reactive',
      vdrlRprStatus: 'non_reactive',
      rubellaIgg: 'immune',
      tshValueMiuL: 2.1,
      urineRoutineProtein: 'nil',
      urineRoutineSugar: 'nil',
      urinePusCells: '0-2 /hpf',
      fastingBloodSugarMgDl: 86,
      dipsiBloodSugarMgDl: 110,
      ogtt1HourMgDl: null,
      ogtt2HourMgDl: null,
      hbA1cPercent: null,
      serumCreatinineMgDl: 0.7,
    },
    vaccinations: {
      td1Date: '2026-01-10',
      td1Batch: 'TD-991A',
      td1GivenBy: 'Staff Nurse Kavita',
      td2Date: '',
      td2Batch: '',
      td2GivenBy: '',
      tdBoosterDate: '',
      tdBoosterBatch: '',
      tdapDate: '',
      tdapBatch: '',
      influenzaDate: '',
      covid19Doses: '2 doses',
      notes: 'Next Td2 due after 4 weeks',
    },
    birthPlan: {
      preferredPlaceOfDelivery: 'district_hospital',
      identifiedHospitalName: 'Sassoon General Hospital & BJ Medical College',
      identifiedBirthCompanion: 'Rahul Patel (Husband)',
      emergencyTransportContact: '108 Ambulance / +91 98221 44550',
      bloodDonorIdentified: true,
      bloodDonorContact: 'Amit Patel (+91 98221 44559)',
      exclusiveBreastfeedingCounseled: true,
      postpartumContraceptionCounseled: true,
      dangerSignsExplained: true,
      dangerSignsListAck: true,
    },
  }

  const createRes = await request('/api/anc', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(newPatientPayload),
  })

  recordTest('Registration POST /api/anc succeeds', createRes.ok, `Response status ${createRes.status}`)
  const savedPatient = createRes.data?.data
  const patientId = savedPatient?.booking?.identifier

  recordTest(
    'Unique ANC Identifier generated',
    Boolean(patientId && patientId.startsWith('ANC-')),
    `Identifier: ${patientId}, PatientID: ${savedPatient?.booking?.patientId}`,
  )

  // Verify direct file persistence in .helix_data/anc_records.json
  const fileContent = JSON.parse(fs.readFileSync(ancFile, 'utf8'))
  const persistedInFile = fileContent.find((r) => r.booking.identifier === patientId)
  recordTest(
    'Record physically persisted to .helix_data/anc_records.json',
    Boolean(persistedInFile && persistedInFile.booking.name === 'Meera Patel'),
    `Found record ${persistedInFile?.booking?.identifier} in storage with status: ${persistedInFile?.status}`,
  )

  // Verify backup created
  const backupFiles = fs.readdirSync(backupsDir)
  recordTest(
    'Automatic backup snapshot created',
    backupFiles.length > 0,
    `Latest backup: ${backupFiles[backupFiles.length - 1]}`,
  )

  // Verify audit log created
  const auditLogs = JSON.parse(fs.readFileSync(auditFile, 'utf8'))
  const createAudit = auditLogs.find((l) => l.recordId === patientId && l.action === 'CREATE')
  recordTest(
    'Audit trail logged CREATE event',
    Boolean(createAudit),
    `Audit ID: ${createAudit?.id} by ${createAudit?.actor?.name} (${createAudit?.actor?.role})`,
  )

  // --- 5. Retrieve Record by ID ---
  console.log('\n\x1b[33m--- 5. Retrieving Record by ID & MRN ---\x1b[0m')
  const getByIdRes = await request(`/api/anc/${patientId}`, { headers: authHeaders })
  recordTest(
    'GET /api/anc/[id] returns persisted patient',
    getByIdRes.ok && getByIdRes.data?.record?.booking?.name === 'Meera Patel',
    `Fetched patient: ${getByIdRes.data?.record?.booking?.name}, GA: ${getByIdRes.data?.record?.pregnancy?.gaWeeks}w`,
  )

  const getByMrnRes = await request(`/api/anc/${savedPatient.booking.hospitalRegNumber}`, {
    headers: authHeaders,
  })
  recordTest(
    'GET /api/anc/[id] resolves by MRN',
    getByMrnRes.ok && getByMrnRes.data?.record?.booking?.identifier === patientId,
    `Resolved MRN ${savedPatient.booking.hospitalRegNumber} -> ${patientId}`,
  )

  // --- 6. Draft Workflow ---
  console.log('\n\x1b[33m--- 6. Testing Draft Workflow ---\x1b[0m')
  const draftPayload = {
    version: 1,
    sourceVerification: 'pending',
    booking: {
      identifier: '',
      name: 'Ritu Verma',
      hospitalRegNumber: 'MRN-DRAFT-01',
      dateOfBirth: '2000-01-01',
      ageAtBooking: 26,
      bookingDate: new Date().toISOString().slice(0, 10),
      clinician: 'Staff Nurse Kavita',
      bloodGroup: 'O',
      rhesus: 'positive',
      heightCm: 155,
      weightKg: 50,
      gravida: 1,
      para: 0,
      living: 0,
      abortions: 0,
    },
    pregnancy: {
      lmp: '2025-12-01',
      lmpCertain: 'yes',
      cycleDays: 28,
      edd: '',
      datingBasis: 'lmp',
      gaAsOf: new Date().toISOString().slice(0, 10),
      gaWeeks: null,
      gaDays: null,
      conception: 'spontaneous',
      conceptionDetails: '',
      plurality: 1,
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
    },
    consanguinity: { status: 'none', degree: 'not_applicable', details: '' },
    thalassaemia: {
      familyHistory: 'negative',
      consanguineousUnion: false,
      maternalMcv: null,
      maternalMch: null,
      maternalHb: null,
      partnerTested: false,
      partnerMcv: null,
      partnerMch: null,
      partnerHb: null,
      interpretation: 'Pending evaluation',
    },
    previousOutcomes: [],
    cbc: [],
    ultrasounds: [],
    risks: [],
    allergiesStatus: 'none-known',
    allergies: [],
    visits: [],
    documents: [],
    status: 'DRAFT',
    isDraft: true,
  }

  const draftRes = await request('/api/anc', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(draftPayload),
  })

  recordTest('Draft saving POST /api/anc succeeds', draftRes.ok, `Status: ${draftRes.data?.data?.status}`)
  const draftId = draftRes.data?.data?.booking?.identifier
  recordTest('Draft has status DRAFT', draftRes.data?.data?.status === 'DRAFT', `Draft ID: ${draftId}`)

  // Convert Draft to Final Active
  const finalizeRes = await request(`/api/anc/${draftId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'ACTIVE',
      booking: { ...draftRes.data.data.booking, mobileNumber: '+91 99887 76655' },
    }),
  })
  recordTest(
    'Draft updated to final registration',
    finalizeRes.ok && finalizeRes.data?.data?.status === 'ACTIVE',
    `Status transitioned to: ${finalizeRes.data?.data?.status}`,
  )

  // --- 7. Multi-Visit and Investigation Logging ---
  console.log('\n\x1b[33m--- 7. Logging Antenatal Visits & Ultrasound Updates ---\x1b[0m')
  const newVisitEntry = {
    id: 'visit-1',
    date: new Date().toISOString().slice(0, 10),
    clinician: 'Staff Nurse Kavita',
    gaWeeks: 12,
    gaDays: 0,
    weightKg: 59,
    systolic: 120,
    diastolic: 80,
    fundalHeightCm: 12,
    fetalHeartRateBpm: 152,
    fetalPresentation: 'not_applicable',
    fetalMovements: 'not_applicable',
    pallor: 'absent',
    pedalEdema: 'none',
    urine: 'Albumin: nil, Sugar: nil',
    symptoms: 'None',
    examination: 'Normal first trimester examination',
    assessment: '12 weeks intrauterine pregnancy, progressing normally',
    plan: 'Routine folic acid and iron supplementation, NT/NB scan advised',
    nextVisit: '2026-03-10',
  }

  const visitUpdateRes = await request(`/api/anc/${patientId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ visits: [newVisitEntry] }),
  })

  recordTest(
    'Visit logged via PATCH /api/anc/[id]',
    visitUpdateRes.ok && visitUpdateRes.data?.data?.visits?.length === 1,
    `Visits count: ${visitUpdateRes.data?.data?.visits?.length}`,
  )

  // Add Ultrasound
  const newUsgEntry = {
    id: 'usg-1',
    date: new Date().toISOString().slice(0, 10),
    scanDate: new Date().toISOString().slice(0, 10),
    gaWeeks: 12,
    gaDays: 2,
    purpose: 'First Trimester NT/NB Scan',
    findings: 'Single live intrauterine fetus. CRL 56mm, NT 1.4mm (Normal), Nasal bone present.',
    placentation: 'fundal',
    impression: 'Normal early pregnancy scan',
    reportReference: 'USG-2026-001',
    fetalPresentation: 'variable',
    placentalPosition: 'fundal',
    amnioticFluid: 'Adequate',
    fetalWeightGrams: 60,
  }

  const usgUpdateRes = await request(`/api/anc/${patientId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ ultrasounds: [newUsgEntry] }),
  })

  recordTest(
    'Ultrasound logged via PATCH /api/anc/[id]',
    usgUpdateRes.ok && usgUpdateRes.data?.data?.ultrasounds?.length === 1,
    `Ultrasounds count: ${usgUpdateRes.data?.data?.ultrasounds?.length}`,
  )

  // --- 8. PDF Report Generation & Verification ---
  console.log('\n\x1b[33m--- 8. Testing ANC Report Generation (A4 PDF) ---\x1b[0m')
  const reportGenRes = await request(`/api/anc/${patientId}/report`, {
    method: 'POST',
    headers: authHeaders,
  })

  recordTest(
    'POST /api/anc/[id]/report generates PDF',
    reportGenRes.ok && reportGenRes.data?.metadata !== undefined,
    `Report File: ${reportGenRes.data?.metadata?.fileName}, Size: ${reportGenRes.data?.metadata?.fileSize} bytes`,
  )

  const reportId = reportGenRes.data?.metadata?.id
  const fileName = reportGenRes.data?.metadata?.fileName

  // Verify physical PDF file on disk
  const physicalPdfPath = path.join(reportsDir, fileName)
  const pdfExists = fs.existsSync(physicalPdfPath)
  const pdfSize = pdfExists ? fs.statSync(physicalPdfPath).size : 0
  recordTest(
    'Report PDF physically saved in .helix_data/reports/',
    pdfExists && pdfSize > 500,
    `File size: ${pdfSize} bytes on disk`,
  )

  // Verify stream / download endpoint
  const streamRes = await request(`/api/anc/${patientId}/report/${reportId}`, {
    headers: { Cookie: cookieHeader },
  })
  const contentType = streamRes.headers.get('content-type') || ''
  recordTest(
    'GET /api/anc/[id]/report/[reportId] streams valid application/pdf',
    streamRes.status === 200 && contentType.includes('application/pdf'),
    `Content-Type: ${contentType}, Status: ${streamRes.status}`,
  )

  // --- 9. Soft Archival of Record ---
  console.log('\n\x1b[33m--- 9. Testing Archival / Soft Deletion ---\x1b[0m')
  const archiveRes = await request(`/api/anc/${draftId}?reason=Delivered+at+other+center`, {
    method: 'DELETE',
    headers: authHeaders,
  })

  recordTest('DELETE /api/anc/[id] performs soft archival', archiveRes.ok, `${archiveRes.data?.message}`)

  const refreshedList = await request('/api/anc?includeArchived=false', { headers: authHeaders })
  const archivedFoundInDefault = refreshedList.data?.records?.some(
    (r) => r.booking.identifier === draftId,
  )
  recordTest(
    'Archived record excluded from standard active dashboard query',
    !archivedFoundInDefault,
    `Draft ${draftId} hidden from active list`,
  )

  // --- 10. Concurrency & Write Lock Stress Test ---
  console.log('\n\x1b[33m--- 10. Concurrency Stress Test: 5 Concurrent Writes ---\x1b[0m')
  const concurrentPromises = []
  for (let i = 0; i < 5; i++) {
    concurrentPromises.push(
      request(`/api/anc/${patientId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          generalExam: { systolicBp: 115 + i, diastolicBp: 75 + i },
        }),
      }),
    )
  }

  const concurrentResults = await Promise.all(concurrentPromises)
  const allSuccessful = concurrentResults.every((r) => r.ok)
  recordTest(
    'Write mutex safely serialized 5 concurrent requests without JSON corruption',
    allSuccessful,
    `All 5 requests returned 200 OK`,
  )

  // Verify JSON is intact after concurrent writes
  let storageValid = true
  try {
    const raw = fs.readFileSync(ancFile, 'utf8')
    JSON.parse(raw)
  } catch {
    storageValid = false
  }
  recordTest('JSON storage file valid & uncorrupted after concurrent stress', storageValid, `Valid JSON array`)

  // --- 11. Final Summary ---
  console.log('\n\x1b[36m=================================================================\x1b[0m')
  console.log('\x1b[36mPHASE 2 BACKEND TEST SUMMARY\x1b[0m')
  console.log('\x1b[36m=================================================================\x1b[0m')
  const total = results.length
  const passed = results.filter((r) => r.status === 'PASSED').length
  const failed = results.filter((r) => r.status === 'FAILED').length

  console.log(`Total Verification Tests: ${total}`)
  console.log(`\x1b[32mPassed: ${passed}\x1b[0m`)
  if (failed > 0) {
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`)
    process.exit(1)
  } else {
    console.log(`\x1b[32mAll Phase 2 requirements verified successfully!\x1b[0m\n`)
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

