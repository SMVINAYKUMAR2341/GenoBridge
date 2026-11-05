import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URI || 'postgresql://helix_app:helix_dev_password_2026@localhost:5432/helix_staging',
  max: 20,
})

async function run() {
  console.log('Connecting to PostgreSQL...')
  const client = await pool.connect()

  try {
    console.log('Creating UNLOGGED cache table in PostgreSQL...')
    await client.query(`
      CREATE UNLOGGED TABLE IF NOT EXISTS helix_cache (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        hit_count BIGINT NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_helix_cache_expires_at ON helix_cache (expires_at);
      CREATE INDEX IF NOT EXISTS idx_helix_cache_tags ON helix_cache USING GIN (tags);
    `)
    console.log('UNLOGGED helix_cache table & indexes verified!')

    // Benchmark Write
    const t0 = performance.now()
    await client.query(`
      INSERT INTO helix_cache (key, value, tags, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at, hit_count = helix_cache.hit_count + 1
    `, ['benchmark:test', JSON.stringify({ status: 'ok', benchmark: true, timestamp: Date.now() }), ['benchmark']])
    const writeMs = performance.now() - t0

    // Benchmark Read
    const t1 = performance.now()
    const res = await client.query('SELECT value FROM helix_cache WHERE key = $1 AND expires_at > NOW()', ['benchmark:test'])
    const readMs = performance.now() - t1

    console.log('=== PostgreSQL In-Memory Cache Benchmark Results ===')
    console.log(`Write Latency: ${writeMs.toFixed(3)} ms`)
    console.log(`Read Latency:  ${readMs.toFixed(3)} ms`)
    console.log('Cached Value:', res.rows[0]?.value)

    // Benchmark 100 warm queries
    console.log('Running 100 warm cache queries...')
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      await client.query('SELECT value FROM helix_cache WHERE key = $1', ['benchmark:test'])
    }
    const avgMs = (performance.now() - start) / 100
    console.log(`Average warm PG Cache Read Latency: ${avgMs.toFixed(3)} ms`)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error('Error setting up cache:', err)
  process.exit(1)
})
