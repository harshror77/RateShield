import {IRateLimiter} from './IRateLimiter.js'
import {getRedisClient} from '../singletons/RedisClient.singleton.js'

export class SlidingWindowLimiter extends IRateLimiter{
    
    constructor({maxRequests,windowMs}){
        super();
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.redis = getRedisClient();
    }

    async isAllowed(key){
        const redisKey = `ratelimit:sliding_window:${key}`;
        const now = Date.now();
        const windowStart = now - this.windowMs;

        await this.redis.zremrangebyscore(redisKey,0,windowStart);
        const curCount = await this.redis.zcard(redisKey);

        let allowed = false;
        if(curCount<this.maxRequests){
            allowed=true;
            await this.redis.zadd(redisKey,now,`${now}`);
        }

        await this.redis.expire(redisKey,Math.ceil(this.windowMs/1000));
        const rem = Math.max(0,this.maxRequests - curCount - (allowed?1:0));

        return {
            allowed,
            rem,
            resetAt:now+this.windowMs
        };
    }

    getName(){
        return 'sliding_window';
    }
}