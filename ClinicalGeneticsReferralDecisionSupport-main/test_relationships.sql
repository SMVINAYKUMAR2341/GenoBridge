-- Test UUID relationships across collections

-- Create a second patient
INSERT INTO patients (full_name, mrn, dob, age, pregnancy_status, intake_summary, intake_completed_by)
VALUES (
  'Patient Test Beta',
  'MRN-TEST-002',
  '1988-08-20',
  36,
  'preconception',
  'Second synthetic test patient for relationship verification',
  'Nurse Mary Johnson'
)
RETURNING id, full_name, mrn;

-- Get the patient ID and user ID we just created
SELECT id as patient_id FROM patients WHERE mrn = 'MRN-TEST-002' \gset
SELECT id as provider_id FROM users WHERE email = 'jane.smith@helix-test.local' \gset

-- Create a clinical workflow linked to patient and provider
INSERT INTO clinical_workflows (
  workflow_key,
  revision,
  revision_key,
  patient_id,
  actor_id,
  state,
  pathway_slug,
  form_snapshot,
  criteria_matched
)
VALUES (
  'WF-TEST-001',
  1,
  'WF-TEST-001-R1',
  :'patient_id',
  :'provider_id',
  'DRAFT',
  'test-pathway-verification',
  '{"test": "workflow data"}',
  '[]'
)
RETURNING id, workflow_key, state, patient_id, actor_id, created_at;

-- Verify the relationship works
SELECT 
  cw.id as workflow_id,
  cw.workflow_key,
  cw.state,
  p.full_name as patient_name,
  p.mrn as patient_mrn,
  u.name as provider_name,
  u.role as provider_role,
  cw.created_at
FROM clinical_workflows cw
LEFT JOIN patients p ON cw.patient_id = p.id
LEFT JOIN users u ON cw.actor_id = u.id
WHERE cw.workflow_key = 'WF-TEST-001';

-- Test update operation
UPDATE patients 
SET intake_summary = 'Updated test summary to verify UPDATE works'
WHERE mrn = 'MRN-TEST-001'
RETURNING id, mrn, intake_summary, updated_at;

-- Verify data persistence (read operation)
SELECT COUNT(*) as total_patients FROM patients;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_workflows FROM clinical_workflows;
SELECT COUNT(*) as total_audit_logs FROM audit_logs;
