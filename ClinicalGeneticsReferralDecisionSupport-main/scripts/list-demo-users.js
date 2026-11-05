import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URI || 'postgresql://helix_app:helix_dev_password_2026@localhost:5432/helix_staging'
})

async function run() {
  const res = await pool.query('SELECT id, name, email, role, category, enabled FROM users')
  console.log('Registered Users in DB:')
  console.table(res.rows)
  await pool.end()
}

run().catch(console.error)
