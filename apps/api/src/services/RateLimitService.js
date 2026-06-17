import {HandlerChainFactory, RateLimiterFactory} from '../factories/index.js';
import {InMemoryClientRepository} from '../repositories/index.js'
import {getConfig} from '../singletons/index.js'

export class RateLimitService{
    constructor(){
        const clientRepository = new InMemoryClientRepository();
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