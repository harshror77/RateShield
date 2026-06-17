import { InMemoryClientRepository } from '../repositories/index.js';

export class ClientConfigService {
  constructor() {
    this.repository = new InMemoryClientRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getByApiKey(apiKey) {
    const client = await this.repository.findByApiKey(apiKey);
    if (!client) {
      const error = new Error(`Client not found: ${apiKey}`);
      error.name = 'NotFoundError';
      throw error;
    }
    return client;
  }

  async create(clientData) {
    const existing = await this.repository.findByApiKey(clientData.apiKey);
    if (existing) {
      const error = new Error(`Client already exists: ${clientData.apiKey}`);
      error.name = 'ConflictError';
      throw error;
    }
    return this.repository.save(clientData);
  }

  async update(apiKey, updates) {
    const existing = await this.repository.findByApiKey(apiKey);
    if (!existing) {
      const error = new Error(`Client not found: ${apiKey}`);
      error.name = 'NotFoundError';
      throw error;
    }
    return this.repository.save({ ...existing, ...updates, apiKey });
  }

  async remove(apiKey) {
    const deleted = await this.repository.delete(apiKey);
    if (!deleted) {
      const error = new Error(`Client not found: ${apiKey}`);
      error.name = 'NotFoundError';
      throw error;
    }
    return { deleted: true };
  }
}