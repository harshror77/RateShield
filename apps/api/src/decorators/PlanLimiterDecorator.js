import { BaseLimiterDecorator } from './BaseLimiterDecorator.js';
import { FixedWindowLimiter } from '../algorithms/FixedWindowLimiter.js';
import { planLimits, PLANS } from '../config/plans.config.js';

export class PlanLimiterDecorator extends BaseLimiterDecorator {
  constructor(wrappedLimiter) {
    super(wrappedLimiter);
    this.planLimiterCache = new Map();
  }

  getLimiterForPlan(planId) {
    if (this.planLimiterCache.has(planId)) {
      return this.planLimiterCache.get(planId);
    }
    const limits = planLimits[planId] || planLimits[PLANS.FREE];
    const limiter = new FixedWindowLimiter({
      maxRequests: limits.maxRequests,
      windowMs: limits.windowMs,
    });
    this.planLimiterCache.set(planId, limiter);
    return limiter;
  }

  async isAllowed(request, options) {
    const planId = request.planId || PLANS.FREE;
    const planLimiter = this.getLimiterForPlan(planId);
    const planKey = `plan:${planId}:${request.apiKey}`;
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
    if(!wrappedResult.allowed) return wrappedResult;
    return {
      allowed: true,
      remaining: planResult.remaining,
      resetAt:  planResult.resetAt
    };
  }
}