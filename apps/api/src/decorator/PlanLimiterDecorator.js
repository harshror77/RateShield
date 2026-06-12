import {BaseLimiterDecorator} from './BaseLimiterDecorator.js'
import {TokenBucketLimiter} from '../algorithms/TokenBucketLimiter.js'
import {planLimits,PLANS} from '../config/plans.config.js'

export class PlanLimiterDecorator extends BaseLimiterDecorator{

    constructor(wrappedLimiter){
        super(wrappedLimiter);
        this.planLimiterCache = new Map();
    }

    getLimiterForPlan(planId){
        if(this.planLimiterCache.has(planId)){
            return this.planLimiterCache.get(planId);
        }
        const limits = planLimits[planId] || planLimits[PLANS.FREE];
        const limiter = new TokenBucketLimiter({
            capacity:limits.maxRequests,
            refillRate:limits.maxRequests / (limits.windowMs/1000)
        });
        this.planLimiterCache.set(planId,limiter);
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

        return this.wrappedLimiter.isAllowed(request,options);
    }
}