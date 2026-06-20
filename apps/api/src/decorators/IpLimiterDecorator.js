import { BaseLimiterDecorator } from './BaseLimiterDecorator.js'
import { TokenBucketLimiter } from '../algorithms/TokenBucketLimiter.js'

export class IpLimiterDecorator extends BaseLimiterDecorator {

    constructor(wrappedLimiter, defaultIpLimits) {
        super(wrappedLimiter);
        this.defaultIpLimits = defaultIpLimits;
        this.limiterCache = new Map();
    }

    getLimiterFor(request) {
        if (!request.customLimits?.ip) return this.#getDefault();

        const cacheKey = `custom:${request.apiKey}`;
        if (this.limiterCache.has(cacheKey)) return this.limiterCache.get(cacheKey);

        const limiter = new TokenBucketLimiter(request.customLimits.ip);
        this.limiterCache.set(cacheKey, limiter);
        return limiter;
    }

    #getDefault() {
        if (!this.defaultLimiter) {
            this.defaultLimiter = new TokenBucketLimiter(this.defaultIpLimits);
        }
        return this.defaultLimiter;
    }

    async isAllowed(req, options) {
        const ipLimiter = this.getLimiterFor(req);
        const ipKey = `ip:${req.ip}`;
        const ipResult = await ipLimiter.isAllowed(ipKey);

        if (!ipResult.allowed) {
            return {
                allowed: false,
                remaining: ipResult.remaining,
                resetAt: ipResult.resetAt,
                deniedBy: 'ip'
            };
        }
        const wrappedResult = await this.wrappedLimiter.isAllowed(req, options);
        if (!wrappedResult.allowed) return wrappedResult;

        return {
            allowed: true,
            remaining: ipResult.remaining,
            resetAt: ipResult.resetAt
        }
    }
}