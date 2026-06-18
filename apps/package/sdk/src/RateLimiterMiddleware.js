import { RateLimiterClient } from './RateLimiterClient.js';

export function RateLimiterMiddleware({ serviceUrl, apiKey, timeout }) {
  const client = new RateLimiterClient({ serviceUrl, apiKey, timeout });

  return async function (req, res, next) {
    try {
      const result = await client.check({
        ip: req.ip,
        userId: req.userId,
      });

      if (!result.allowed) {
        res.setHeader('X-RateLimit-Remaining', result.remaining ?? 0);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          deniedBy: result.deniedBy,
          remaining: result.remaining,
          resetAt: result.resetAt,
        });
      }

      res.setHeader('X-RateLimit-Remaining', result.remaining ?? 0);
      next();
    } catch (err) {
      next();
    }
  };
}