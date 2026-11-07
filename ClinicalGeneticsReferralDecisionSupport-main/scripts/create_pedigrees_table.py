import os
import psycopg2

db_url = None
with open('ClinicalGeneticsReferralDecisionSupport-main/.env.local') as f:
    for line in f:
        if line.startswith('DATABASE_URI='):
            db_url = line.strip().split('=', 1)[1].strip('"\'')
            break

if not db_url:
    raise ValueError("DATABASE_URI not found in .env.local")

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS pedigrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Three-Generation Clinical Pedigree',
    consanguinity BOOLEAN NOT NULL DEFAULT FALSE,
    ancestries JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    members JSONB NOT NULL DEFAULT '[]'::jsonb,
    relationships JSONB NOT NULL DEFAULT '[]'::jsonb,
    canvas_layout JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedigrees_user_id ON pedigrees(user_id);
CREATE INDEX IF NOT EXISTS idx_pedigrees_updated_at ON pedigrees(updated_at DESC);
""")

print("Table 'pedigrees' created / verified successfully.")

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pedigrees';")
cols = cur.fetchall()
for col in cols:
    print(f"  {col[0]}: {col[1]}")

conn.close()

