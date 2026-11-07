import psycopg2, json, os

db_url = None
with open('ClinicalGeneticsReferralDecisionSupport-main/.env.local') as f:
    for line in f:
        if line.startswith('DATABASE_URI='):
            db_url = line.strip().split('=', 1)[1].strip('"\'')
            break

conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("SELECT id, full_name, mrn, age, pregnancy_status FROM patients LIMIT 10;")
patients = cur.fetchall()
print(f"Patients in DB: {len(patients)}")
for p in patients:
    print(f"  ID: {p[0]} | Name: {p[1]} | MRN: {p[2]} | Age: {p[3]} | Status: {p[4]}")

cur.execute("SELECT id, workflow_key, state, decision, pathway_slug, created_at FROM clinical_workflows ORDER BY created_at DESC LIMIT 10;")
workflows = cur.fetchall()
print(f"\nClinical Workflows in DB: {len(workflows)}")
for w in workflows:
    print(f"  ID: {w[0]} | Key: {w[1]} | State: {w[2]} | Decision: {w[3]} | Pathway: {w[4]} | Created: {w[5]}")

cur.execute("SELECT count(*) FROM assessments;")
print(f"\nAssessments in DB: {cur.fetchone()[0]}")

cur.execute("SELECT count(*) FROM pedigrees;")
print(f"\nPedigrees in DB: {cur.fetchone()[0]}")

cur.execute("SELECT count(*) FROM audit_logs;")
print(f"\nAudit logs in DB: {cur.fetchone()[0]}")

conn.close()
