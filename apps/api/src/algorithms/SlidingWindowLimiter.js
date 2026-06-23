import { IRateLimiter } from './IRateLimiter.js'
import { getRedisClient } from '../singletons/RedisClient.singleton.js'

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxReq = tonumber(ARGV[3])
local windowSec = tonumber(ARGV[4])
local memberId = ARGV[5]
local windowStart = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
local count = redis.call('ZCARD', key)

if count < maxReq then
  redis.call('ZADD', key, now, now .. '-' .. memberId)
  redis.call('EXPIRE', key, windowSec)
  return { 1, maxReq - count - 1 }
end

return { 0, 0 }
`;

export class SlidingWindowLimiter extends IRateLimiter {
    constructor({ maxRequests, windowMs }) {
        super();
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.redis = getRedisClient();
    }

    async isAllowed(reqOrKey) {
        const key = typeof reqOrKey === 'string' ? reqOrKey : (reqOrKey.apiKey || reqOrKey.ip || 'global');
        const redisKey = `ratelimit:sliding_window:${key}`;
        const now = Date.now();
        const windowSec = Math.ceil(this.windowMs / 1000);
        const memberId = Math.floor(Math.random() * 1000000);

        const [allowed, remaining] = await this.redis.eval(
            SLIDING_WINDOW_SCRIPT, 1, redisKey,
            now, this.windowMs, this.maxRequests, windowSec, memberId
        );

        return {
            allowed: allowed === 1,
            remaining: Number(remaining),
            resetAt: now + this.windowMs
        };
    }

    getName() { return 'sliding_window'; }
}