import { BaseLimiterDecorator } from './BaseLimiterDecorator.js';
import { FixedWindowLimiter } from '../algorithms/FixedWindowLimiter.js';
import { planLimits, PLANS } from '../config/plans.config.js';

export class PlanLimiterDecorator extends BaseLimiterDecorator {
  constructor(wrappedLimiter) {
    super(wrappedLimiter);
    this.planLimiterCache = new Map();
  }

  getLimiterFor(request) {
    const cacheKey = request.customLimits?.plan
      ? `custom:${request.apiKey}`
      : `plan:${request.planId || PLANS.FREE}`;

    if (this.planLimiterCache.has(cacheKey)) {
      return this.planLimiterCache.get(cacheKey);
    }

    const limits = request.customLimits?.plan || planLimits[request.planId] || planLimits[PLANS.FREE];

    const limiter = new FixedWindowLimiter({
      maxRequests: limits.maxRequests,
      windowMs: limits.windowMs,
    });
    this.planLimiterCache.set(cacheKey, limiter);
    return limiter;
  }

  async isAllowed(request, options) {
    const planLimiter = this.getLimiterFor(request);
    const planKey = `plan:${request.planId || 'custom'}:${request.apiKey}`;
    const planResult = await planLimiter.isAllowed(planKey);

    if (!planResult.allowed) {
      return {
        allowed: false,
        remaining: planResult.remaining,
        resetAt: planResult.resetAt,
        deniedBy: 'plan',
      };
    }

    const wrappedResult = await this.wrappedLimiter.isAllowed(request, options);
    if (!wrappedResult.allowed) return wrappedResult;
    return {
      allowed: true,
      remaining: planResult.remaining,
      resetAt: planResult.resetAt
    };
  }
}