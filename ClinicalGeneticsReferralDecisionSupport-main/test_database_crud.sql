-- Test CRUD operations with synthetic data
-- Testing GENOBRIDGE application with PostgreSQL

-- Test 1: Create a test admin user
INSERT INTO admins (email, login_attempts) 
VALUES ('admin@genobridge-test.local', 0)
RETURNING id, email, created_at;

-- Test 2: Create a test clinical user
INSERT INTO users (full_name, email, role, active) 
VALUES ('Dr. Jane Smith', 'jane.smith@genobridge-test.local', 'provider', true)
RETURNING id, full_name, email, role, created_at;

-- Test 3: Create a test patient
INSERT INTO patients (full_name, mrn, dob, age, pregnancy_status, gestational_age_weeks, intake_summary, intake_completed_by)
VALUES (
  'Patient Test Alpha', 
  'MRN-TEST-001', 
  '1990-05-15', 
  34, 
  'pregnant_second_trimester', 
  22,
  'Synthetic test patient for PostgreSQL verification',
  'Test Nurse'
)
RETURNING id, full_name, mrn, pregnancy_status, created_at;

-- Test 4: Create a clinical pathway
INSERT INTO clinical_pathways (title, slug, short_code, category, summary, estimated_seconds, primary_guidelines, default_referral_target_routine, default_referral_target_urgent)
VALUES (
  'Test Pathway',
  'test-pathway-verification',
  'TPV001',
  'gynecology',
  'Test pathway for database verification',
  120,
  'Test Guidelines 2026',
  'Test Genetics Clinic',
  'Emergency Genetics Department'
)
RETURNING id, title, slug, created_at;

-- Test 5: Create audit log entry
INSERT INTO audit_logs (event_code, actor_name, actor_role, action_type, resource_ref, details, encryption_verified)
VALUES (
  'TEST-AUDIT-001',
  'System Test',
  'Clinic Administrator',
  'METRICS_EXPORT',
  'database-verification-test',
  'Testing audit log creation with PostgreSQL',
  true
)
RETURNING id, event_code, actor_name, action_type, created_at;

-- Test 6: Verify record counts
SELECT 'Patients' as collection, COUNT(*) as record_count FROM patients
UNION ALL
SELECT 'Users' as collection, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Admins' as collection, COUNT(*) as record_count FROM admins
UNION ALL
SELECT 'Clinical Pathways' as collection, COUNT(*) as record_count FROM clinical_pathways
UNION ALL
SELECT 'Audit Logs' as collection, COUNT(*) as record_count FROM audit_logs;
