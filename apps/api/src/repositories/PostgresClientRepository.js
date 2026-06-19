import { IClientRepository } from './IClientRepository.js'
import { getDb } from '../database/db.js'

export class PostgresClientRepository extends IClientRepository {
  constructor() {
    super()
    this.db = getDb()
  }

  async findByApiKey(apiKey) {
    const result = await this.db.query(
      'SELECT * FROM clients WHERE api_key = $1',
      [apiKey]
    )
    if (result.rows.length === 0) return null
    return this.#toClient(result.rows[0])
  }

  async save(clientConfig) {
    const { apiKey, clientName, planId, algorithm } = clientConfig
    const result = await this.db.query(
      `INSERT INTO clients (api_key, client_name, plan_id, algorithm)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (api_key) DO UPDATE
       SET client_name = $2, plan_id = $3, algorithm = $4
       RETURNING *`,
      [apiKey, clientName, planId, algorithm]
    )
    return this.#toClient(result.rows[0])
  }

  async delete(apiKey) {
    const result = await this.db.query(
      'DELETE FROM clients WHERE api_key = $1',
      [apiKey]
    )
    return result.rowCount > 0
  }

  async findAll() {
    const result = await this.db.query(
      'SELECT * FROM clients ORDER BY created_at DESC'
    )
    return result.rows.map(this.#toClient)
  }

  #toClient(row) {
    return {
      apiKey: row.api_key,
      clientName: row.client_name,
      planId: row.plan_id,
      algorithm: row.algorithm,
    }
  }
}