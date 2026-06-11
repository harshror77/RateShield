import {IRateLimiter} from './IRateLimiter.js';
import {getRedisClient} from '../singletons/RedisClient.singleton.js'

export class FixedWindowLimiter extends IRateLimiter{

    constructor({maxRequests,windowMs}){
        super();
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.redis = getRedisClient();
    }

    async isAllowed(key){
        const now = Date.now();
        const windowId = Math.floor(now/this.windowMs);
        const redisKey = `ratelimit:fixed_window:${key}:${windowId}`;
        const count = await this.redis.incr(redisKey);

        if(count==1) await this.redis.expire(redisKey,Math.ceil(this.windowMs/1000));

        const allowed = count<=this.maxRequests;
        const rem = Math.max(0,this.maxRequests-count);
        const windowEnd = (windowId+1)*this.windowMs;

        return{
            allowed,
            rem,
            resetAt:windowEnd
        };
    }

    getName(){
        return 'fixed_window';
    }
}