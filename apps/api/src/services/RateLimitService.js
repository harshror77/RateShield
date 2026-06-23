import { HandlerChainFactory, RateLimiterFactory } from '../factories/index.js';
import { PostgresClientRepository } from '../repositories/index.js';

export class RateLimitService {
    constructor() {
        const clientRepository = new PostgresClientRepository();
        const rateLimiterFactory = new RateLimiterFactory();

        this.chainFactory = new HandlerChainFactory(
            clientRepository,
            rateLimiterFactory
        );

        // ✅ Build ONCE and reuse — not per request
        // This keeps PlanLimiterDecorator's cache alive across all requests
        this.chain = this.chainFactory.buildChain();
    }

    async check(rawRequest) {
        const request = {
            headers:      rawRequest.headers,
            connectionIp: rawRequest.body?.ip || rawRequest.ip,
            userId:       rawRequest.body?.userId || null,
        };

        // ✅ Reuse the same chain instance
        const result = await this.chain.handle(request);
        return result;
    }
}