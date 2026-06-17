import { IRateLimiter } from './IRateLimiter.js';
import { getRedisClient } from '../singletons/RedisClient.singleton.js';

export class TokenBucketLimiter extends IRateLimiter {
  constructor({ capacity, refillRate }) {
    super();
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.redis = getRedisClient();
  }

  async isAllowed(reqOrKey) {
    const key = typeof reqOrKey === 'string' ? reqOrKey : (reqOrKey.apiKey || reqOrKey.ip || 'global');
    const redisKey = `ratelimit:token_bucket:${key}`;
    const now = Date.now();

    const data = await this.redis.hgetall(redisKey);
    let tokens = data?.tokens !== undefined ? parseFloat(data.tokens) : this.capacity;
    let lastRefill = data?.lastRefill !== undefined ? parseInt(data.lastRefill) : now;

    const elapsedSeconds = (now - lastRefill) / 1000;
    tokens = Math.min(this.capacity, tokens + elapsedSeconds * this.refillRate);

    let allowed = false;
    if (tokens >= 1) {
      tokens -= 1;
      allowed = true;
    }

    const ttlSeconds = Math.ceil(this.capacity / this.refillRate) + 1;
    await this.redis.hset(redisKey, 'tokens', tokens, 'lastRefill', now);
    await this.redis.expire(redisKey, ttlSeconds);

    return {
      allowed,
      remaining: Math.floor(tokens),
      resetAt: now + ttlSeconds * 1000,
    };
  }

  getName() {
    return 'token_bucket';
  }
}