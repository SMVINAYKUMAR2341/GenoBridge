import { execSync } from 'node:child_process'

async function seed() {
  const psqlPath = '"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"'
  const psqlEnv = { ...process.env, PGPASSWORD: 'helix_dev_password_2026' }

  // 1. Delete if exist to ensure fresh password123 hash
  try {
    execSync(
      `${psqlPath} -U helix_app -d helix_staging -c "DELETE FROM users WHERE email IN ('nurse@hospital.org', 'doctor@hospital.org');"`,
      { env: psqlEnv }
    )
  } catch (err) {
    console.error('Delete error:', err.message)
  }

  // 2. Signup Nurse
  const nurseRes = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Mary',
      lastName: 'Johnson',
      email: 'nurse@hospital.org',
      phone: '+91 9876543210',
      password: 'password123',
      confirmPassword: 'password123',
      category: 'nurse',
      nursingRegistrationNumber: 'DNC/RN/2026/8892',
      stateNursingCouncil: 'Delhi Nursing Council',
      hospitalClinicName: 'AIIMS New Delhi',
      department: 'Obstetrics & Clinical Genetics',
      designation: 'ANC Staff Nurse',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  const nurseData = await nurseRes.json()
  console.log('Nurse signup:', nurseRes.status, nurseData.message)

  // 3. Signup Doctor
  const docRes = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'doctor@hospital.org',
      phone: '+91 9811223344',
      password: 'password123',
      confirmPassword: 'password123',
      category: 'gynecologist',
      medicalRegistrationNumber: 'DMC/2026/55412',
      stateMedicalCouncil: 'Delhi Medical Council',
      registrationState: 'Delhi (NCT)',
      hospitalClinicName: 'AIIMS New Delhi',
      department: 'Obstetrics & Gynecology',
      designation: 'Consultant Gynecologist',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  })
  const docData = await docRes.json()
  console.log('Doctor signup:', docRes.status, docData.message)

  // 4. Update status to APPROVED in PostgreSQL
  execSync(
    `${psqlPath} -U helix_app -d helix_staging -c "UPDATE users SET verification_status = 'APPROVED', enabled = true, reviewed_by = 'Medical Governance Board', reviewed_at = now() WHERE email IN ('nurse@hospital.org', 'doctor@hospital.org');"`,
    { env: psqlEnv }
  )

  console.log('Successfully approved nurse@hospital.org and doctor@hospital.org!')
}

seed().catch(console.error)

