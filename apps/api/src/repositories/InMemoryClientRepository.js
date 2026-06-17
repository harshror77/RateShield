import {IClientRepository} from './IClientRepository.js'
import {PLANS,ALGORITHMS} from '../config/plans.config.js'

export class InMemoryClientRepository extends IClientRepository{
    
    constructor(){
        super();
        this.clients = new Map();
        this.#seedTestClients();
    }

    #seedTestClients(){
        this.clients.set('free-test-key',{
            apiKey:'free-test-key',
            clientName:'Free Tier Test Client',
            planId:PLANS.FREE,
            algorithm:ALGORITHMS.TOKEN_BUCKET
        });
        this.clients.set('pro-test-key',{
            apiKey:'pro-test-key',
            clientName:'Pro Tier Test Client',
            planId:PLANS.PRO,
            algorithm:ALGORITHMS.SLIDING_WINDOW
        });
        this.clients.set('enterprise-test-key',{
            apiKey:'enterprise-test-key',
            clientName:'Enterprise Tier Test Client',
            planId:PLANS.ENTERPRISE,
            algorithm:ALGORITHMS.FIXED_WINDOW
        });
    }

    async findByApiKey(apiKey){
        return this.clients.get(apiKey) || null;
    }

    async save(clientConfig){
        if(!clientConfig.apiKey) throw new Error('clientConfig.apiKey is required');
        this.clients.set(clientConfig.apiKey,clientConfig);
        return clientConfig;
    }
    
    async delete(apiKey){
        return this.clients.delete(apiKey);
    }

    async findAll(){
        return Array.from(this.clients.values());
    }
}