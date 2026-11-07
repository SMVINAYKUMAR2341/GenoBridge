import psycopg2, json, os

db_url = None
with open('ClinicalGeneticsReferralDecisionSupport-main/.env.local') as f:
    for line in f:
        if line.startswith('DATABASE_URI='):
            db_url = line.strip().split('=', 1)[1].strip('"\'')
            break

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

# Check patients table columns
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients' ORDER BY ordinal_position;")
cols = cur.fetchall()
print("Patients columns:")
for c in cols:
    print(f"  {c[0]}: {c[1]}")

# Sync Ritika Singh from anc_records.json into patients table if not already present
with open('ClinicalGeneticsReferralDecisionSupport-main/.genobridge_data/anc_records.json') as f:
    anc_records = json.load(f)

print(f"Found {len(anc_records)} ANC records to check.")
for rec in anc_records:
    booking = rec.get('booking', {})
    name = booking.get('name')
    mrn = booking.get('hospitalRegNumber') or f"MRN-{booking.get('identifier', '001')}"
    dob = booking.get('dateOfBirth') or '2000-01-01'
    age = booking.get('ageAtBooking') or 25
    gravida = booking.get('gravida', 1)
    para = booking.get('para', 0)
    gpla = f"G{gravida}P{para}"
    
    cur.execute("SELECT id FROM patients WHERE mrn = %s;", (mrn,))
    existing = cur.fetchone()
    if not existing:
        cur.execute("""
            INSERT INTO patients (full_name, mrn, dob, age, pregnancy_status, gravida_para, intake_summary, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id, full_name, mrn;
        """, (name, mrn, dob, age, 'pregnant_first_trimester', gpla, f"ANC Intake: {booking.get('identifier')}"))
        inserted = cur.fetchone()
        print(f"Inserted patient into PostgreSQL: ID={inserted[0]}, Name={inserted[1]}, MRN={inserted[2]}")
    else:
        print(f"Patient already exists in PostgreSQL: ID={existing[0]}")

cur.execute("SELECT count(*) FROM patients;")
print(f"Total patients in PostgreSQL: {cur.fetchone()[0]}")

conn.close()
