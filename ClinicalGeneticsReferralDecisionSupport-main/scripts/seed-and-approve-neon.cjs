const { Pool } = require('pg');

const connStr = process.env.DATABASE_URI || 'postgresql://neondb_owner:npg_d5BPMcoLaT3I@ep-flat-mouse-bev6a08v-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('--- Registering nurse@hospital.org ---');
  await fetch('http://localhost:3000/api/auth/signup', {
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
  }).then(r => r.json()).then(console.log).catch(console.error);

  console.log('--- Registering admin@helix-test.local ---');
  await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@helix-test.local',
      phone: '+91 9999999999',
      password: 'password123',
      confirmPassword: 'password123',
      category: 'gynecologist',
      medicalRegistrationNumber: 'ADMIN-2026-NMC',
      stateMedicalCouncil: 'Delhi Medical Council',
      hospitalClinicName: 'AIIMS New Delhi',
      department: 'Platform Administration',
      designation: 'Chief Medical Administrator',
      termsAccepted: true,
      privacyAccepted: true,
      verificationConsent: true,
    }),
  }).then(r => r.json()).then(console.log).catch(console.error);

  console.log('--- Updating user roles & approving in Neon DB ---');
  const res = await pool.query(`
    UPDATE users 
    SET verification_status = 'APPROVED', 
        enabled = true, 
        reviewed_by = 'Medical Governance Board', 
        reviewed_at = NOW() 
    WHERE email IN ('nurse@hospital.org', 'doctor@hospital.org', 'admin@helix-test.local');
  `);
  console.log('Approved users count:', res.rowCount);

  // Set admin role for admin@helix-test.local in users table
  await pool.query("UPDATE users SET role = 'admin' WHERE email = 'admin@helix-test.local';");

  // Copy doctor password hash & salt into admins table for admin@helix-test.local
  const adminUser = await pool.query("SELECT salt, hash FROM users WHERE email = 'admin@helix-test.local'");
  if (adminUser.rows.length > 0) {
    const { salt, hash } = adminUser.rows[0];
    await pool.query(`
      INSERT INTO admins (id, email, salt, hash, created_at, updated_at)
      VALUES (gen_random_uuid(), 'admin@helix-test.local', $1, $2, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET salt = EXCLUDED.salt, hash = EXCLUDED.hash, updated_at = NOW();
    `, [salt, hash]);
    console.log('Admin account admin@helix-test.local synchronized in admins table!');
  }

  // Verify registered accounts
  const check = await pool.query("SELECT id, email, role, category, verification_status, enabled FROM users");
  console.log('Active verified accounts in Neon:');
  console.table(check.rows);

  await pool.end();
}

main().catch(console.error);
