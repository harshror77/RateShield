import { IRateLimiter } from './IRateLimiter.js';
import { getRedisClient } from '../singletons/RedisClient.singleton.js';

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refillRate = tonumber(ARGV[3])
local ttlSeconds = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1]) or capacity
local lastRefill = tonumber(data[2]) or now

local elapsed = (now - lastRefill) / 1000
tokens = math.min(capacity, tokens + elapsed * refillRate)

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
redis.call('EXPIRE', key, ttlSeconds)

return { allowed, math.floor(tokens) }
`;

export class TokenBucketLimiter extends IRateLimiter {
    constructor({ capacity, refillRate }) {
        super();
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.redis = getRedisClient();
        this.ttl = Math.ceil(this.capacity / this.refillRate) + 1;
    }

    async isAllowed(reqOrKey) {
        const key = typeof reqOrKey === 'string' ? reqOrKey : (reqOrKey.apiKey || reqOrKey.ip || 'global');
        const redisKey = `ratelimit:token_bucket:${key}`;
        const now = Date.now();

        const [allowed, remaining] = await this.redis.eval(
            TOKEN_BUCKET_SCRIPT, 1, redisKey,
            now, this.capacity, this.refillRate, this.ttl
        );

        return {
            allowed: allowed === 1,
            remaining: Number(remaining),
            resetAt: now + this.ttl * 1000
        };
    }

    getName() { return 'token_bucket'; }
}