import { IClientRepository } from './IClientRepository.js'

const globalClientsMap = new Map();

export class InMemoryClientRepository extends IClientRepository {
    
    constructor() {
        super();
        this.clients = globalClientsMap;
    }

    async findByApiKey(apiKey) {
        return this.clients.get(apiKey) || null;
    }

    async save(clientConfig) {
        if (!clientConfig.apiKey) throw new Error('clientConfig.apiKey is required');
        this.clients.set(clientConfig.apiKey, clientConfig);
        return clientConfig;
    }
    
    async delete(apiKey) {
        return this.clients.delete(apiKey);
    }

    async findAll() {
        return Array.from(this.clients.values());
    }
}