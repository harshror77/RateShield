import { TokenBucketLimiter, SlidingWindowLimiter, FixedWindowLimiter } from '../algorithms/index.js';
import { IpLimiterDecorator, UserLimiterDecorator, PlanLimiterDecorator } from '../decorators/index.js';
import { ALGORITHMS, planLimits, PLANS } from '../config/plans.config.js';

const IP_LIMITS = { capacity: 5, refillRate: 1 };
const USER_LIMITS = { capacity: 3, refillRate: 1 };

export class RateLimiterFactory {
  constructor() {
    this.stackCache = new Map();
  }

  #createAlgorithm(clientConfig) {
    const planId = clientConfig.planId || PLANS.FREE;
    const limits = clientConfig.customLimits?.plan || planLimits[planId] || planLimits[PLANS.FREE];

    const baselineWindow = { maxRequests: limits.maxRequests, windowMs: limits.windowMs };
    const baselineBucket = {
      capacity: limits.maxRequests,
      refillRate: Math.max(1, Math.ceil(limits.maxRequests / (limits.windowMs / 1000)))
    };

    switch (clientConfig.algorithm) {
      case ALGORITHMS.SLIDING_WINDOW:
        return new SlidingWindowLimiter(baselineWindow);
      case ALGORITHMS.FIXED_WINDOW:
        return new FixedWindowLimiter(baselineWindow);
      case ALGORITHMS.TOKEN_BUCKET:
      default:
        return new TokenBucketLimiter(baselineBucket);
    }
  }

  #buildStack(clientConfig) {
    const innermost = this.#createAlgorithm(clientConfig);
    const withIpCheck = new IpLimiterDecorator(innermost, IP_LIMITS);
    const withUserCheck = new UserLimiterDecorator(withIpCheck, USER_LIMITS);
    return new PlanLimiterDecorator(withUserCheck);
  }

  createLimiter(clientConfig) {
    const cacheKey = clientConfig.apiKey;
    if (this.stackCache.has(cacheKey)) return this.stackCache.get(cacheKey);

    const stack = this.#buildStack(clientConfig);
    this.stackCache.set(cacheKey, stack);
    return stack;
  }
}