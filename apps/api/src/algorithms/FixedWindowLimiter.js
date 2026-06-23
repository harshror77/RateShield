import { IRateLimiter } from './IRateLimiter.js';
import { getRedisClient } from '../singletons/RedisClient.singleton.js'

export class FixedWindowLimiter extends IRateLimiter {

    constructor({ maxRequests, windowMs }) {
        super();
        this.maxRequests = maxRequests;
        this.windowMs    = windowMs;
        this.redis       = getRedisClient();
    }

    async isAllowed(reqOrKey) {
        const key      = typeof reqOrKey === 'string' ? reqOrKey : (reqOrKey.apiKey || reqOrKey.ip || 'global');
        const now      = Date.now();
        const windowId = Math.floor(now / this.windowMs);
        const redisKey = `ratelimit:fixed_window:${key}:${windowId}`;
        const windowSec = Math.ceil(this.windowMs / 1000);

        const pipeline = this.redis.pipeline();
        pipeline.incr(redisKey);
        pipeline.expire(redisKey, windowSec);
        const [[, count]] = await pipeline.exec();

        const allowed  = count <= this.maxRequests;
        const windowEnd = (windowId + 1) * this.windowMs;

        return {
            allowed,
            remaining: Math.max(0, this.maxRequests - count),
            resetAt:   windowEnd
        };
    }

    getName() { return 'fixed_window'; }
}