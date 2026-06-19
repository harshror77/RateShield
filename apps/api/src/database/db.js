import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

let pool = null

export function getDb() {
  if (pool) return pool
  pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'secret',
    database: process.env.POSTGRES_DB || 'rate_limiter',
  })
  pool.on('error', (err) => {
    console.error('[Postgres] Unexpected error:', err.message)
  })
  return pool
}

export async function disconnectDb() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('[Postgres] Disconnected cleanly')
  }
}