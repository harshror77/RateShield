import {HandlerChainFactory, RateLimiterFactory} from '../factories/index.js';
import {PostgresClientRepository} from '../repositories/index.js'

export class RateLimitService{
    constructor(){
        const clientRepository = new PostgresClientRepository();
        const rateLimiterFactory = new RateLimiterFactory();

        this.chainFactory = new HandlerChainFactory(
            clientRepository,
            rateLimiterFactory
        );
    }

    async check(rawRequest){
        const request = {
            headers:rawRequest.headers,
            connectionIp:rawRequest.body?.ip || rawRequest.ip,
            userId:rawRequest.body?.userId || null,
        };

        const chain = this.chainFactory.buildChain();
        const result = await chain.handle(request);
        return result;
    }
}