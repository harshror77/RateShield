import { IRateLimiter } from './IRateLimiter.js';
import { getRedisClient } from '../singletons/RedisClient.singleton.js';

export class TokenBucketLimiter extends IRateLimiter {
  
  constructor({ capacity, refillRate }) {
    super();
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.redis = getRedisClient();
  }

  async isAllowed(key) {
    const redisKey = `ratelimit:token_bucket:${key}`;
    const now = Date.now();

    const data = await this.redis.hmget(redisKey, 'tokens', 'lastRefill');
    let tokens = data[0] !== null ? parseFloat(data[0]) : this.capacity;
    let lastRefill = data[1] !== null ? parseInt(data[1]) : now;

    const elapsedSeconds = (now - lastRefill) / 1000;
    const refillAmount = elapsedSeconds * this.refillRate;
    tokens = Math.min(this.capacity, tokens + refillAmount);

    let allowed = false;
    if (tokens >= 1) {
      tokens -= 1;
      allowed = true;
    }

    const ttlSeconds = Math.ceil(this.capacity / this.refillRate) + 1;
    await this.redis.hmset(redisKey, 'tokens', tokens, 'lastRefill', now);
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