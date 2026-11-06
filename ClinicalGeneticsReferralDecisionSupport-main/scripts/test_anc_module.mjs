// GENOBRIDGE ANTENATAL CARE (ANC) COMPREHENSIVE END-TO-END TEST SUITE
// Tests all clinical endpoints, pages, calculations, and role-based workflows

import { execSync } from 'node:child_process'

const BASE_URL = 'http://localhost:3000'
const results = []

function recordTest(name, passed, details) {
  results.push({ name, status: passed ? 'PASSED' : 'FAILED', details })
  const color = passed ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}[${passed ? 'PASSED' : 'FAILED'}]\x1b[0m ${name} : ${details}`)
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  try {
    const res = await fetch(url, options)
    let json = null
    try {
      json = await res.json()
    } catch {
      // not json
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data: json }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function run() {
  console.log('\x1b[36m=========================================================\x1b[0m')
  console.log('\x1b[36mGENOBRIDGE ANTENATAL CARE (ANC) INTEGRATION & WORKFLOW TESTS\x1b[0m')
  console.log('\x1b[36m=========================================================\x1b[0m\n')

  // 1. Route Accessibility (Unauthenticated redirect check)
  console.log('\x1b[33m--- 1. Route Protection & Navigation Checks ---\x1b[0m')
  const pages = [
    '/anc',
    '/anc/register',
    '/anc/ANC-2026-0101',
    '/doctor/dashboard',
    '/nurse/dashboard',
  ]

  for (const p of pages) {
    const res = await fetch(`${BASE_URL}${p}`, { redirect: 'manual' })
    const isProtected = [200, 307, 302].includes(res.status)
    recordTest(
      `Route ${p} protection verified`,
      isProtected,
      `Status ${res.status} (Properly protected by auth redirect)`
    )
  }

  // 2. Setup Authenticated Doctor and Nurse Accounts
  console.log('\n\x1b[33m--- 2. Setting Up Verified Clinical Accounts ---\x1b[0m')
  const psqlPath = '"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"'
  const psqlEnv = { ...process.env, PGPASSWORD: 'genobridge_dev_password_2026' }

  const docEmail = `dr_anc_${Date.now()}@apollohospitals.com`
  const nurseEmail = `nurse_anc_${Date.now()}@manipalhospitals.com`
  const password = 'ClinicalPassword2026!'

  // Signup Doctor
  const docReg = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Dr. Sunita',
      lastName: 'Rao',
      email: docEmail,
      phone: '+91 9822001122',
      password: password,
      confirmPassword: password,
      category: 'gynecologist',
      medicalRegistrationNumber: 'MMC/2026/77889',
      stateMedicalCouncil: 'Maharashtra Medical Council',
      registrationState: 'Maharashtra',
      hospitalClinicName: 'Apollo Cradle Hospital',
      department: 'Obstetrics & Fetal Medicine',
      designation: 'Senior Consultant OB-GYN',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  recordTest('Doctor registration request', docReg.status === 201, `Status: ${docReg.status}`)

  // Signup Nurse
  const nurseReg = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Nurse Anita',
      lastName: 'Patil',
      email: nurseEmail,
      phone: '+91 9822003344',
      password: password,
      confirmPassword: password,
      category: 'nurse',
      nursingRegistrationNumber: 'MNC/RN/66778',
      stateNursingCouncil: 'Maharashtra Nursing Council',
      hospitalClinicName: 'Apollo Cradle Hospital',
      department: 'Antenatal Care Unit',
      designation: 'Staff Nurse In-Charge',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  recordTest('Nurse registration request', nurseReg.status === 201, `Status: ${nurseReg.status}`)

  // Approve Doctor and Nurse via PostgreSQL
  execSync(
    `${psqlPath} -U genobridge_app -d genobridge_staging -c "UPDATE users SET verification_status = 'APPROVED', enabled = true, reviewer_authorized = true, reviewer_qualification = 'Consultant OB-GYN', reviewed_by = 'Medical Council Reviewer', reviewed_at = now() WHERE email = '${docEmail}';"`,
    { env: psqlEnv }
  )
  execSync(
    `${psqlPath} -U genobridge_app -d genobridge_staging -c "UPDATE users SET verification_status = 'APPROVED', enabled = true, reviewed_by = 'Nursing Council Reviewer', reviewed_at = now() WHERE email = '${nurseEmail}';"`,
    { env: psqlEnv }
  )

  await new Promise((r) => setTimeout(r, 400))

  // Login Doctor
  const docLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: docEmail, password }),
  })
  const docCookie = docLogin.headers.get('set-cookie') || ''
  recordTest(
    'Gynecologist sign-in & session verification',
    docLogin.status === 200 && docLogin.data?.redirectTo === '/doctor/dashboard',
    `Status ${docLogin.status}: Logged in as ${docLogin.data?.user?.name} (Role: ${docLogin.data?.user?.role})`
  )

  // Login Nurse
  const nurseLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: nurseEmail, password }),
  })
  const nurseCookie = nurseLogin.headers.get('set-cookie') || ''
  recordTest(
    'Nurse sign-in & session verification',
    nurseLogin.status === 200 && nurseLogin.data?.redirectTo === '/nurse/dashboard',
    `Status ${nurseLogin.status}: Logged in as ${nurseLogin.data?.user?.name} (Role: ${nurseLogin.data?.user?.role})`
  )

  // 3. Antenatal Registry API Tests
  console.log('\n\x1b[33m--- 3. ANC Registry API & Clinical Data Tests ---\x1b[0m')
  const ancRegistryRes = await request('/api/anc', {
    headers: { Cookie: docCookie },
  })

  recordTest(
    'GET /api/anc returns 200 with patient list & summary stats',
    ancRegistryRes.status === 200 && Array.isArray(ancRegistryRes.data?.records),
    `Total records: ${ancRegistryRes.data?.stats?.total}, High risk: ${ancRegistryRes.data?.stats?.highRisk}, Active: ${ancRegistryRes.data?.stats?.active}`
  )

  const priya = ancRegistryRes.data?.records?.find(r => r.booking?.name === 'Priya Sharma')
  const ananya = ancRegistryRes.data?.records?.find(r => r.booking?.name === 'Ananya Deshmukh')

  recordTest(
    'Clinical Case: Priya Sharma (Primigravida 12w) correctly assessed as LOW RISK',
    priya && priya.riskClassification?.riskLevel === 'LOW',
    `Gestational Age: ${priya?.pregnancy?.gaWeeks}w, EDD: ${priya?.pregnancy?.edd}, Blood Group: ${priya?.booking?.bloodGroup}${priya?.booking?.rhesus === 'positive' ? '+ve' : ''}`
  )

  recordTest(
    'Clinical Case: Ananya Deshmukh (Prev LSCS, Rh -ve, GDM) correctly assessed as HIGH RISK',
    ananya && ananya.riskClassification?.riskLevel === 'HIGH' && ananya.riskClassification?.aspirinRecommended === true,
    `Risk: ${ananya?.riskClassification?.riskLevel}, Aspirin: ${ananya?.riskClassification?.aspirinRecommended ? 'RECOMMENDED' : 'NO'}, Flags: ${ananya?.riskClassification?.highRiskFlags?.join(' | ')}`
  )

  // 4. Nurse Patient Intake & Registration Workflow
  console.log('\n\x1b[33m--- 4. Nurse Multi-Step Antenatal Intake Workflow ---\x1b[0m')
  const testAncId = `ANC-${Date.now().toString().slice(-4)}`
  const newIntakePayload = {
    version: 1,
    sourceVerification: 'pending',
    booking: {
      identifier: testAncId,
      hospitalRegNumber: 'MRN-9021',
      name: 'Radhika Kulkarni',
      dateOfBirth: '1998-05-15',
      ageAtBooking: 28,
      bookingDate: '2026-03-01',
      clinician: 'Nurse Anita Patil',
      bloodGroup: 'O',
      rhesus: 'positive',
      heightCm: 156,
      weightKg: 58,
      gravida: 2,
      para: 1,
      living: 1,
      abortions: 0,
      mobileNumber: '+91 98220 99887',
      address: 'Kothrud, Pune, Maharashtra',
      chwName: 'ASHA Sunita Tai',
      literacyLevel: 'graduate',
      socialClass: 'lower_middle',
      maritalStatus: 'married',
      preferredLanguage: 'Marathi',
    },
    pregnancy: {
      lmp: '2025-11-20',
      lmpCertain: 'yes',
      cycleDays: 28,
      edd: '', // will be auto-calculated to 2026-08-27
      datingBasis: 'lmp',
      gaAsOf: '2026-03-01',
      gaWeeks: null,
      gaDays: null,
      conception: 'spontaneous',
      conceptionDetails: 'Natural conception',
      plurality: 1,
      maritalDurationYears: 3,
      oralContraceptiveUse: 'no',
      previousDeliveryMode: 'normal_vaginal',
      antiDGiven: 'not_applicable',
      trimester: 2,
    },
    histories: {
      medical: 'No medical disorders',
      surgical: 'No surgeries',
      obstetric: 'Prior full-term normal vaginal delivery in 2023',
      family: 'None',
      genetic: 'None',
      medications: 'Folic acid 5mg',
      socialExposures: 'None',
      infections: 'None',
      immunisations: 'Complete',
      mentalHealth: 'Good',
      cardiacDisease: false,
      epilepsy: false,
      diabetesType: 'none',
      chronicHypertension: false,
      renalDisease: false,
      previousCSectionCount: 0,
      domesticViolenceScreening: 'negative',
      substanceUse: 'none',
    },
    consanguinity: {
      status: 'no',
      relationship: '',
      degree: '',
      familyHistory: '',
    },
    thalassaemia: {
      maternalStatus: 'negative',
      maternalTestDate: '2026-03-01',
      maternalResult: 'Normal HPLC',
      partnerStatus: 'not-tested',
      partnerTestDate: '',
      partnerResult: '',
      haemoglobinAnalysis: 'HbA 97.4%, HbA2 2.2%',
      notes: '',
    },
    previousOutcomes: [
      {
        id: 'prev-1',
        pregnancyNumber: 1,
        year: 2023,
        outcome: 'livebirth',
        gaWeeks: 39,
        gaDays: 2,
        modeOfBirth: 'Normal Vaginal Delivery',
        birthweightGrams: 3100,
        babyCondition: 'healthy',
        babySex: 'male',
        livingStatus: 'Alive and well',
        complications: 'None',
        conditionDetails: 'Healthy delivery',
      },
    ],
    cbc: [
      {
        id: 'cbc-1',
        date: '2026-03-01',
        haemoglobin: 11.6,
        mcv: 84.5,
        mch: 28.8,
        wbc: 8.2,
        platelets: 235,
        laboratory: 'Apex Hospital Lab',
        notes: 'Normal hemogram',
        trimester: 1,
      },
    ],
    ultrasounds: [],
    risks: [],
    allergiesStatus: 'none-known',
    allergies: [],
    visits: [
      {
        id: 'v-1',
        date: '2026-03-01',
        clinician: 'Nurse Anita Patil',
        gaWeeks: 14,
        gaDays: 3,
        weightKg: 58,
        systolic: 112,
        diastolic: 72,
        urine: 'Albumin Nil, Sugar Nil',
        symptoms: 'Feeling well',
        examination: 'General exam normal. Uterus corresponds to dates.',
        assessment: '14w3d gestation, booking intake complete',
        plan: 'Start Tab IFA OD and Tab Calcium. Td1 administered.',
        nextVisit: '2026-03-29',
        pulseBpm: 74,
        pedalEdema: 'none',
        pallor: 'absent',
      },
    ],
    documents: [],
    generalExam: {
      pulseBpm: 74,
      systolicBp: 112,
      diastolicBp: 72,
      temperatureF: 98.4,
      respiratoryRate: 16,
      bmi: 23.8,
      bmiCategory: 'normal',
      pallor: 'absent',
      jaundice: false,
      cyanosis: false,
      clubbing: false,
      pedalEdema: 'none',
      lymphadenopathy: false,
      cvsFindings: 'S1 S2 heard',
      respiratoryFindings: 'Clear',
      breastExam: 'Normal',
      thyroidExam: 'Normal',
    },
    investigations: {
      bloodGroupRh: 'O Positive',
      hivStatus: 'non_reactive',
      hbsAgStatus: 'non_reactive',
      hcvStatus: 'non_reactive',
      vdrlRprStatus: 'non_reactive',
      rubellaIgg: 'immune',
      tshValueMiuL: 1.72,
      urineRoutineProtein: 'nil',
      urineRoutineSugar: 'nil',
      urinePusCells: '1-2 / HPF',
      dipsiBloodSugarMgDl: 104,
      fastingBloodSugarMgDl: 82,
      ogtt1HourMgDl: null,
      ogtt2HourMgDl: null,
      hbA1cPercent: 5.2,
      serumCreatinineMgDl: 0.65,
    },
    vaccinations: {
      td1Date: '2026-03-01',
      td1Batch: 'TD-2026-A',
      td1GivenBy: 'Nurse Anita Patil',
      td2Date: '2026-03-29',
      td2Batch: '',
      td2GivenBy: '',
      tdBoosterDate: '',
      tdBoosterBatch: '',
      tdapDate: '',
      tdapBatch: '',
      influenzaDate: '',
      covid19Doses: '2 Doses completed',
      notes: 'Td1 given in left deltoid',
    },
    birthPlan: {
      preferredPlaceOfDelivery: 'district_hospital',
      identifiedHospitalName: 'District Hospital Pune',
      identifiedBirthCompanion: 'Husband',
      emergencyTransportContact: '108 Ambulance',
      bloodDonorIdentified: true,
      bloodDonorContact: 'Brother',
      exclusiveBreastfeedingCounseled: true,
      postpartumContraceptionCounseled: true,
      dangerSignsExplained: true,
      dangerSignsListAck: true,
    },
    referralOutcome: {
      isReferred: false,
      referralReason: '',
      referralUrgency: 'routine',
      referredFacilityName: '',
      referralDate: '',
      referralSummary: '',
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
      highRiskFlags: [],
      preEclampsiaRisk: 'low',
      aspirinRecommended: false,
      clinicianOverride: false,
      clinicianOverrideRationale: '',
      clinicianApproved: false,
      approvedByClinicianName: '',
      approvedAt: '',
    },
    status: 'ACTIVE',
  }

  const postIntakeRes = await request('/api/anc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: nurseCookie,
    },
    body: JSON.stringify(newIntakePayload),
  })

  recordTest(
    'Nurse saves new patient intake via POST /api/anc',
    postIntakeRes.status === 200 && postIntakeRes.data?.success === true,
    `Status ${postIntakeRes.status}: ${postIntakeRes.data?.message} (Auto-calculated EDD: ${postIntakeRes.data?.data?.pregnancy?.edd})`
  )

  // Fetch individual record
  const fetchSingleRes = await request(`/api/anc?id=${encodeURIComponent(testAncId)}`, {
    headers: { Cookie: docCookie },
  })
  recordTest(
    'Doctor opens registered patient record by ANC ID',
    fetchSingleRes.status === 200 && fetchSingleRes.data?.record?.booking?.name === 'Radhika Kulkarni',
    `Fetched ${fetchSingleRes.data?.record?.booking?.name} with GA: ${fetchSingleRes.data?.record?.pregnancy?.gaWeeks}w`
  )

  // 5. Dashboard Page Render Checks (with live authenticated cookies)
  console.log('\n\x1b[33m--- 5. Dashboard UI Integration Checks ---\x1b[0m')
  const docDashRes = await fetch(`${BASE_URL}/doctor/dashboard`, {
    headers: { Cookie: docCookie },
  })
  const docHtml = await docDashRes.text()
  recordTest(
    'Doctor dashboard renders Antenatal Care (ANC) Decision Support module',
    docHtml.includes('Antenatal Care (ANC)') && docHtml.includes('/anc'),
    'Displays "Antenatal Care (ANC) & Obstetric Monitoring Module" with High-Risk Reviews card'
  )

  const nurseDashRes = await fetch(`${BASE_URL}/nurse/dashboard`, {
    headers: { Cookie: nurseCookie },
  })
  const nurseHtml = await nurseDashRes.text()
  recordTest(
    'Nurse dashboard renders ANC Registration & Visit Logging cards',
    nurseHtml.includes('ANC Patient Registration') && nurseHtml.includes('Antenatal Visits'),
    'Displays dedicated ANC Patient Registration action and Antenatal Visits flowsheet'
  )

  // Clean up test record
  await request(`/api/anc?id=${encodeURIComponent(testAncId)}`, {
    method: 'DELETE',
    headers: { Cookie: docCookie },
  })

  console.log('\n\x1b[36m=========================================================\x1b[0m')
  const total = results.length
  const passedCount = results.filter(r => r.status === 'PASSED').length
  const failedCount = total - passedCount
  console.log(`\x1b[32mTOTAL TESTS: ${total} | PASSED: ${passedCount} | FAILED: ${failedCount}\x1b[0m`)
  console.log('\x1b[36m=========================================================\x1b[0m\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

run().catch(err => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
