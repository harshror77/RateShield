import {BaseLimiterDecorator} from './BaseLimiterDecorator.js'
import {TokenBucketLimiter} from '../algorithms/TokenBucketLimiter.js'

export class UserLimiterDecorator extends BaseLimiterDecorator{
    
    constructor(wrappedLimiter,userLimits){
        super(wrappedLimiter);
        this.userLimiter = new TokenBucketLimiter(userLimits);
    }

    async isAllowed(req,options){
        if(!req.userId){
            return this.wrappedLimiter.isAllowed(req,options);
        }
        const userKey = `user:${req.userId}`;
        const userResult = await this.userLimiter.isAllowed(userKey);

        if(!userResult.allowed){
            return{
                allowed:false,
                remaining:userResult.remaining,
                resetAt:userResult.resetAt,
                deniedBy:'user'
            };
        }
        const wrappedResult = await this.wrappedLimiter.isAllowed(req,options);
        if(!wrappedResult.allowed) return wrappedResult;
        return{
            allowed:true,
            remaining: userResult.remaining,
            resetAt: userResult.resetAt
        };
    }
}