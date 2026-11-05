-- Test workflow relationship creation

DO $$ 
DECLARE 
  v_patient_id uuid;
  v_provider_id uuid;
BEGIN
  SELECT id INTO v_patient_id FROM patients WHERE mrn = 'MRN-TEST-002';
  SELECT id INTO v_provider_id FROM users WHERE email = 'jane.smith@helix-test.local';
  
  INSERT INTO clinical_workflows (
    workflow_key,
    revision,
    revision_key,
    patient_id,
    actor_id,
    state,
    pathway_slug,
    intake,
    assessment_inputs
  ) VALUES (
    'WF-TEST-001',
    1,
    'WF-TEST-001-R1',
    v_patient_id,
    v_provider_id,
    'DRAFT',
    'test-pathway-verification',
    '{"patient_info": "test data", "pregnancy_status": "preconception"}',
    '{"risk_factors": ["test"], "screening_results": []}'
  );
  
  RAISE NOTICE 'Workflow created successfully';
END $$;

-- Verify the relationship works with UUID foreign keys
SELECT 
  cw.id as workflow_id,
  cw.workflow_key,
  cw.state,
  cw.revision,
  p.full_name as patient_name,
  p.mrn as patient_mrn,
  u.name as provider_name,
  u.role as provider_role,
  cw.created_at
FROM clinical_workflows cw
LEFT JOIN patients p ON cw.patient_id = p.id
LEFT JOIN users u ON cw.actor_id = u.id
WHERE cw.workflow_key = 'WF-TEST-001';
