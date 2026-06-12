import {BaseLimiterDecorator} from './BaseLimiterDecorator.js'
import {TokenBucketLimiter} from '../algorithms/TokenBucketLimiter.js'

export class IpLimiterDecorator extends BaseLimiterDecorator{

    constructor(wrappedLimiter,iplimits){
        super(wrappedLimiter);
        this.ipLimiter = new TokenBucketLimiter(iplimits);
    }

    async isAllowed(req,options){
        const ipKey = `ip:${req.ip}`;
        const ipResult = await this.ipLimiter.isAllowed(ipKey);

        if(!ipResult.allowed){
            return{
                allowed:false,
                remaining:ipResult.remaining,
                resetAt:ipResult.resetAt,
                deniedBy:'ip'
            };
        }

        return this.wrappedLimiter.isAllowed(req,options);
    }
}