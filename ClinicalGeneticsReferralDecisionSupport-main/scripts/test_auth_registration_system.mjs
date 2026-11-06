/**
 * GENOBRIDGE CLINICAL GENETICS — AUTHENTICATION & ROLE-BASED REGISTRATION TEST SUITE
 * Tests public professional registration, verification workflows, role-based login,
 * security protections, and role matching.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const results = []

function recordTest(name, passed, details = '') {
  const status = passed ? 'PASSED' : 'FAILED'
  const color = passed ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}[${status}]\x1b[0m ${name}${details ? ` : ${details}` : ''}`)
  results.push({ name, status, details })
}

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
    return { status: res.status, data, headers: res.headers }
  } catch (err) {
    return { status: 0, error: err.message, data: null }
  }
}

async function run() {
  console.log('\x1b[36m=========================================================\x1b[0m')
  console.log('\x1b[36mSTARTING GENOBRIDGE ROLE-BASED AUTH & REGISTRATION TEST SUITE\x1b[0m')
  console.log('\x1b[36m=========================================================\x1b[0m\n')

  // 1. Verify Page Routes HTTP 200
  const pages = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/account-pending',
    '/account-rejected',
    '/doctor/dashboard',
    '/nurse/dashboard',
    '/admin/dashboard',
  ]

  for (const page of pages) {
    const res = await request(page, { method: 'GET', redirect: 'manual' })
    const isOk = res.status === 200 || res.status === 307 || res.status === 308
    recordTest(`Page Route: ${page}`, isOk, `HTTP ${res.status}`)
  }

  // 2. Security: Block Administrator Signup
  const adminAttempt = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Malicious',
      lastName: 'Actor',
      email: `admin_hack_${Date.now()}@hospital.org`,
      phone: '+91 9876543210',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      category: 'admin',
      role: 'admin',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  recordTest(
    'Security: Admin Public Registration Blocked',
    adminAttempt.status === 403,
    `Status ${adminAttempt.status}: ${adminAttempt.data?.message}`
  )

  // 3. Validation: Block Invalid Category
  const badCategory = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: `badcat_${Date.now()}@hospital.org`,
      phone: '+91 9876543210',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      category: 'surgeon', // Not gynecologist or nurse
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  recordTest(
    'Validation: Unsupported Category Blocked',
    badCategory.status === 400,
    `Status ${badCategory.status}: ${badCategory.data?.message}`
  )

  // 4. Validation: Password mismatch
  const mismatch = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Doctor',
      lastName: 'Mismatch',
      email: `mismatch_${Date.now()}@hospital.org`,
      phone: '+91 9876543210',
      password: 'SecurePassword123!',
      confirmPassword: 'DifferentPassword123!',
      category: 'gynecologist',
      medicalRegistrationNumber: 'MMC/12345',
      stateMedicalCouncil: 'Maharashtra Medical Council',
      registrationState: 'Maharashtra',
      hospitalClinicName: 'Apollo Hospital',
      designation: 'Consultant',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  recordTest(
    'Validation: Password Mismatch Blocked',
    mismatch.status === 400,
    `Status ${mismatch.status}: ${mismatch.data?.message}`
  )

  // 5. Successful Gynecologist Registration
  const uniqueDoctorEmail = `dr_priya_${Date.now()}@apollohospitals.com`
  let doctorVerificationToken = ''

  const doctorReg = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Priya',
      lastName: 'Nair',
      email: uniqueDoctorEmail,
      phone: '+91 9811223344',
      password: 'ClinicalSecret2026!',
      confirmPassword: 'ClinicalSecret2026!',
      category: 'gynecologist',
      medicalRegistrationNumber: 'MMC/2026/88741',
      stateMedicalCouncil: 'Maharashtra Medical Council',
      registrationState: 'Maharashtra',
      hospitalClinicName: 'Apollo Hospital Mumbai',
      department: 'Obstetrics and Fetal Medicine',
      designation: 'Consultant OB-GYN',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  doctorVerificationToken = doctorReg.data?.verificationToken || ''
  recordTest(
    'Registration: Gynecologist / OB-GYN',
    doctorReg.status === 201 && doctorReg.data?.success === true,
    `Status ${doctorReg.status}: ${doctorReg.data?.message}`
  )

  // 6. Security: Prevent Duplicate Email Registration
  const dupEmail = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Another',
      lastName: 'Doctor',
      email: uniqueDoctorEmail,
      phone: '+91 9811223355',
      password: 'ClinicalSecret2026!',
      confirmPassword: 'ClinicalSecret2026!',
      category: 'gynecologist',
      medicalRegistrationNumber: 'MMC/2026/99999',
      stateMedicalCouncil: 'Maharashtra Medical Council',
      registrationState: 'Maharashtra',
      hospitalClinicName: 'Apollo Hospital Mumbai',
      designation: 'Consultant OB-GYN',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  recordTest(
    'Security: Duplicate Email Prevented',
    dupEmail.status === 409,
    `Status ${dupEmail.status}: ${dupEmail.data?.message}`
  )

  // 7. Successful Nurse Registration
  const uniqueNurseEmail = `nurse_anita_${Date.now()}@manipalhospitals.com`

  const nurseReg = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Anita',
      lastName: 'Deshmukh',
      email: uniqueNurseEmail,
      phone: '+91 9765432109',
      password: 'NursePassword2026!',
      confirmPassword: 'NursePassword2026!',
      category: 'nurse',
      nursingRegistrationNumber: 'KNC/RN/99214',
      stateNursingCouncil: 'Karnataka State Nursing Council',
      hospitalClinicName: 'Manipal Hospital Bangalore',
      department: 'Clinical Genetics & ANC Clinic',
      designation: 'Genetic Nurse Coordinator',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  recordTest(
    'Registration: Nurse / Medical Assistant',
    nurseReg.status === 201 && nurseReg.data?.success === true,
    `Status ${nurseReg.status}: ${nurseReg.data?.message}`
  )

  // 8. Email Verification Workflow
  const verifyEmail = await request('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: doctorVerificationToken,
      email: uniqueDoctorEmail,
    }),
  })
  recordTest(
    'Workflow: Email Verification',
    verifyEmail.status === 200 && verifyEmail.data?.success === true,
    `Status ${verifyEmail.status}: ${verifyEmail.data?.message}`
  )

  // =========================================================================
  // ROLE-BASED LOGIN VALIDATION & SECURITY TESTS
  // =========================================================================

  // 9. Login: Missing Role Selection Blocked (Status 400)
  const missingRoleLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueDoctorEmail,
      password: 'ClinicalSecret2026!',
    }),
  })
  recordTest(
    'Login Validation: Missing Role Selection Blocked',
    missingRoleLogin.status === 400 && missingRoleLogin.data?.message?.includes('select your professional role'),
    `Status ${missingRoleLogin.status}: ${missingRoleLogin.data?.message}`
  )

  // 10. Login: Missing Email or Password Blocked (Status 400)
  const missingCredsLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'gynecologist',
      email: '',
      password: '',
    }),
  })
  recordTest(
    'Login Validation: Missing Credentials Blocked',
    missingCredsLogin.status === 400 && missingCredsLogin.data?.message?.includes('Work email and password are required'),
    `Status ${missingCredsLogin.status}: ${missingCredsLogin.data?.message}`
  )

  // 11. Login Scenario C: Bad Credentials Return 401 Generic
  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'gynecologist',
      email: uniqueDoctorEmail,
      password: 'WrongPassword999!',
    }),
  })
  recordTest(
    'Login Scenario C: Bad Password Returns Generic 401',
    badLogin.status === 401 && badLogin.data?.message?.includes('Invalid email or password'),
    `Status ${badLogin.status}: ${badLogin.data?.message}`
  )

  // 12. Login Scenario D: Pending Account Blocked with Waiting Message
  const pendingLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'gynecologist',
      email: uniqueDoctorEmail,
      password: 'ClinicalSecret2026!',
    }),
  })
  const isPendingOk =
    pendingLogin.status === 403 &&
    pendingLogin.data?.message?.includes('awaiting administrator verification') &&
    pendingLogin.data?.redirectTo === '/account-pending'
  recordTest(
    'Login Scenario D: Pending Account Blocked with Awaiting Verification Message',
    isPendingOk,
    `Status ${pendingLogin.status}: message = "${pendingLogin.data?.message}"`
  )

  // 13. Professional Verification: Admin Approves Gynecologist Account
  const { execSync } = await import('node:child_process')
  const psqlPath = '"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"'
  const psqlEnv = { ...process.env, PGPASSWORD: 'genobridge_dev_password_2026' }

  execSync(
    `${psqlPath} -U genobridge_app -d genobridge_staging -c "UPDATE users SET verification_status = 'APPROVED', enabled = true, reviewer_authorized = true, reviewer_qualification = 'Consultant OB-GYN (MMC)', reviewed_by = 'Medical Governance Board', reviewed_at = now() WHERE email = '${uniqueDoctorEmail}';"`,
    { env: psqlEnv }
  )
  await new Promise((r) => setTimeout(r, 400))

  // 14. Login Scenario B: Role Mismatch (Gynecologist logging in with Nurse role)
  const doctorMismatchLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'nurse', // Incorrect selected role!
      email: uniqueDoctorEmail,
      password: 'ClinicalSecret2026!',
    }),
  })
  const isDocMismatchOk =
    doctorMismatchLogin.status === 403 &&
    doctorMismatchLogin.data?.message === 'The selected professional role does not match your registered account.'
  recordTest(
    'Login Scenario B: Role Mismatch (Doctor selecting Nurse) Blocked',
    isDocMismatchOk,
    `Status ${doctorMismatchLogin.status}: ${doctorMismatchLogin.data?.message}`
  )

  // 15. Login Scenario A: Approved Gynecologist with Correct Role -> 200 & /doctor/dashboard
  const approvedDocLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'gynecologist',
      email: uniqueDoctorEmail,
      password: 'ClinicalSecret2026!',
    }),
  })
  const isDocApproved =
    approvedDocLogin.status === 200 &&
    approvedDocLogin.data?.redirectTo === '/doctor/dashboard' &&
    approvedDocLogin.data?.status === 'APPROVED'
  recordTest(
    'Login Scenario A: Approved Gynecologist Login Granted',
    isDocApproved,
    `Status ${approvedDocLogin.status}: redirectTo = ${approvedDocLogin.data?.redirectTo}`
  )

  // 16. Professional Verification: Admin Approves Nurse Account
  execSync(
    `${psqlPath} -U genobridge_app -d genobridge_staging -c "UPDATE users SET verification_status = 'APPROVED', enabled = true, reviewed_by = 'Nursing Governance Board', reviewed_at = now() WHERE email = '${uniqueNurseEmail}';"`,
    { env: psqlEnv }
  )
  await new Promise((r) => setTimeout(r, 400))

  // 17. Login Scenario B: Role Mismatch (Nurse logging in with Gynecologist role)
  const nurseMismatchLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'gynecologist', // Incorrect selected role!
      email: uniqueNurseEmail,
      password: 'NursePassword2026!',
    }),
  })
  const isNurseMismatchOk =
    nurseMismatchLogin.status === 403 &&
    nurseMismatchLogin.data?.message === 'The selected professional role does not match your registered account.'
  recordTest(
    'Login Scenario B: Role Mismatch (Nurse selecting Gynecologist) Blocked',
    isNurseMismatchOk,
    `Status ${nurseMismatchLogin.status}: ${nurseMismatchLogin.data?.message}`
  )

  // 18. Login Scenario A: Approved Nurse with Correct Role -> 200 & /nurse/dashboard
  const approvedNurseLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'nurse',
      email: uniqueNurseEmail,
      password: 'NursePassword2026!',
    }),
  })
  const isNurseApproved =
    approvedNurseLogin.status === 200 &&
    approvedNurseLogin.data?.redirectTo === '/nurse/dashboard' &&
    approvedNurseLogin.data?.status === 'APPROVED'
  recordTest(
    'Login Scenario A: Approved Nurse Login Granted',
    isNurseApproved,
    `Status ${approvedNurseLogin.status}: redirectTo = ${approvedNurseLogin.data?.redirectTo}`
  )

  // 19. Login Scenario E: Rejected Account Prohibited
  const rejectedEmail = `rejected_${Date.now()}@unverified.org`
  await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Unverified',
      lastName: 'Applicant',
      email: rejectedEmail,
      phone: '+91 9988776655',
      password: 'SecretPassword123!',
      confirmPassword: 'SecretPassword123!',
      category: 'gynecologist',
      medicalRegistrationNumber: 'INVALID/0000',
      stateMedicalCouncil: 'Delhi Medical Council',
      registrationState: 'Delhi (NCT)',
      hospitalClinicName: 'Unregistered Hospital',
      designation: 'Practitioner',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })

  execSync(
    `${psqlPath} -U genobridge_app -d genobridge_staging -c "UPDATE users SET verification_status = 'REJECTED', enabled = false, rejection_reason = 'Registration number not found in official Delhi Medical Council registry.' WHERE email = '${rejectedEmail}';"`,
    { env: psqlEnv }
  )
  await new Promise((r) => setTimeout(r, 400))

  const rejectedLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'gynecologist',
      email: rejectedEmail,
      password: 'SecretPassword123!',
    }),
  })
  const isRejectedOk =
    rejectedLogin.status === 403 &&
    rejectedLogin.data?.status === 'REJECTED' &&
    rejectedLogin.data?.redirectTo === '/account-rejected'
  recordTest(
    'Login Scenario E: Rejected Account Blocked with /account-rejected Redirect',
    isRejectedOk,
    `Status ${rejectedLogin.status}: redirectTo = ${rejectedLogin.data?.redirectTo}`
  )

  // 20. Login Scenario E: Suspended Account Prohibited
  execSync(
    `${psqlPath} -U genobridge_app -d genobridge_staging -c "UPDATE users SET verification_status = 'SUSPENDED', enabled = false WHERE email = '${rejectedEmail}';"`,
    { env: psqlEnv }
  )
  await new Promise((r) => setTimeout(r, 400))

  const suspendedLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'gynecologist',
      email: rejectedEmail,
      password: 'SecretPassword123!',
    }),
  })
  const isSuspendedOk = suspendedLogin.status === 403 && suspendedLogin.data?.status === 'SUSPENDED'
  recordTest(
    'Login Scenario E: Suspended Account Prohibited',
    isSuspendedOk,
    `Status ${suspendedLogin.status}: ${suspendedLogin.data?.message}`
  )

  // 21. Workflow: Forgot Password Request
  const forgot = await request('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueDoctorEmail }),
  })
  recordTest(
    'Workflow: Forgot Password Request',
    forgot.status === 200 && forgot.data?.success === true,
    `Status ${forgot.status}: ${forgot.data?.message}`
  )

  // 22. Direct API Protection: Unauthorized user cannot call admin verification API
  const unauthAdminApi = await request('/api/admin/verifications', {
    method: 'GET',
  })
  recordTest(
    'RBAC: Unauthorized Call to Admin Verifications API Blocked',
    unauthAdminApi.status === 403,
    `Status ${unauthAdminApi.status}: ${unauthAdminApi.data?.message}`
  )

  // 23. Session Logout Test
  const logoutRes = await request('/api/auth/logout', { method: 'POST' })
  recordTest(
    'Session: Logout Clears Session',
    logoutRes.status === 200,
    `Status ${logoutRes.status}`
  )

  console.log('\n\x1b[36m=========================================================\x1b[0m')
  console.log('\x1b[36mTEST SUITE EXECUTION SUMMARY\x1b[0m')
  console.log('\x1b[36m=========================================================\x1b[0m')

  const passed = results.filter((r) => r.status === 'PASSED').length
  const failed = results.filter((r) => r.status === 'FAILED').length
  console.log(`Total Tests: ${results.length} | Passed: \x1b[32m${passed}\x1b[0m | Failed: \x1b[31m${failed}\x1b[0m`)

  const fs = await import('node:fs')
  fs.writeFileSync('scripts/test_auth_results.json', JSON.stringify(results, null, 2))
}

run().catch(console.error)
