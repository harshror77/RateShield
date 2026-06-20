import { BaseLimiterDecorator } from './BaseLimiterDecorator.js'
import { TokenBucketLimiter } from '../algorithms/TokenBucketLimiter.js'

export class UserLimiterDecorator extends BaseLimiterDecorator {

    constructor(wrappedLimiter, defaultUserLimits) {
        super(wrappedLimiter);
        this.defaultUserLimits = defaultUserLimits;
        this.limiterCache = new Map();
    }

    getLimiterFor(request) {
        if (!request.customLimits?.user) return this.#getDefault();

        const cacheKey = `custom:${request.apiKey}`;
        if (this.limiterCache.has(cacheKey)) return this.limiterCache.get(cacheKey);

        const limiter = new TokenBucketLimiter(request.customLimits.user);
        this.limiterCache.set(cacheKey, limiter);
        return limiter;
    }

    #getDefault() {
        if (!this.defaultLimiter) {
            this.defaultLimiter = new TokenBucketLimiter(this.defaultUserLimits);
        }
        return this.defaultLimiter;
    }

    async isAllowed(req, options) {
        if (!req.userId) {
            return this.wrappedLimiter.isAllowed(req, options);
        }
        const userLimiter = this.getLimiterFor(req);
        const userKey = `user:${req.userId}`;
        const userResult = await userLimiter.isAllowed(userKey);

        if (!userResult.allowed) {
            return {
                allowed: false,
                remaining: userResult.remaining,
                resetAt: userResult.resetAt,
                deniedBy: 'user'
            };
        }
        const wrappedResult = await this.wrappedLimiter.isAllowed(req, options);
        if (!wrappedResult.allowed) return wrappedResult;
        return {
            allowed: true,
            remaining: userResult.remaining,
            resetAt: userResult.resetAt
        };
    }
}