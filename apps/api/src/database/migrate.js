import { getDb } from './db.js'

async function migrate() {
  const db = getDb()
  await db.query(`
    CREATE TABLE IF NOT EXISTS clients (
      api_key     VARCHAR(255) PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      plan_id     VARCHAR(50)  NOT NULL DEFAULT 'free',
      algorithm   VARCHAR(50)  NOT NULL DEFAULT 'token_bucket',
      created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
    );
  `)
  console.log('[Migrate] Done')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('[Migrate] Failed:', err.message)
  process.exit(1)
})