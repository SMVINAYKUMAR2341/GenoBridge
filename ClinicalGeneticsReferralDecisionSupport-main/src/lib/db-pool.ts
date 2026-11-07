import pg from 'pg'
const { Pool } = pg

let poolInstance: pg.Pool | null = null

export function getPgPool(): pg.Pool {
  if (!poolInstance) {
    const connStr =
      process.env.DATABASE_URI ||
      'postgresql://genobridge_app:genobridge_dev_password_2026@localhost:5432/genobridge_staging'
    const isSsl = connStr.includes('sslmode=require') || connStr.includes('neon.tech')
    poolInstance = new Pool({
      connectionString: connStr,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    })
  }
  return poolInstance
}

export async function dbQuery<T extends pg.QueryResultRow = any>(text: string, params: any[] = []): Promise<pg.QueryResult<T>> {
  const pool = getPgPool()
  return await pool.query<T>(text, params)
}

