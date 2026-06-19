import { RateLimiterClient } from './RateLimiterClient.js';

export function RateLimiterMiddleware({ serviceUrl, apiKey, timeout, onLimitExceeded } = {}) {
  const client = new RateLimiterClient({ serviceUrl, apiKey, timeout });

  return async function (req, res, next) {
    if (req.method === 'OPTIONS' || req.originalUrl === '/favicon.ico') {
      return next();
    }

    try {
      const result = await client.check({
        ip: req.ip,
        userId: req.user?.id || req.userId,
      });

      res.setHeader('X-RateLimit-Remaining', result.remaining ?? 0);
      res.setHeader('X-RateLimit-Reset', result.resetAt ?? 0);
      res.setHeader('X-RateLimit-Denied-By', result.deniedBy || '');

      if (!result.allowed) {
        const resetTime = result.resetAt
          ? new Date(result.resetAt).toISOString()
          : null;

        const retryAfterSeconds = result.resetAt
          ? Math.ceil((result.resetAt - Date.now()) / 1000)
          : 60;

        res.setHeader('Retry-After', retryAfterSeconds);

        if (onLimitExceeded) {
          return onLimitExceeded(req, res, result);
        }

        return res.status(429).json({
          error: 'Too Many Requests',
          message: buildMessage(result.deniedBy, retryAfterSeconds),
          deniedBy: result.deniedBy,
          remaining: result.remaining ?? 0,
          resetAt: result.resetAt,
          retryAfter: `${retryAfterSeconds} seconds`,
          retryAfterISO: resetTime,
        });
      }

      next();
    } catch (err) {
      console.warn('[RateShield] Service unreachable, failing open:', err.message);
      next();
    }
  };
}

function buildMessage(deniedBy, retryAfterSeconds) {
  const retry = retryAfterSeconds > 60
    ? `${Math.ceil(retryAfterSeconds / 60)} minute(s)`
    : `${retryAfterSeconds} second(s)`;

  switch (deniedBy) {
    case 'plan':
      return `You have exceeded your plan's request limit. Please try again in ${retry}.`;
    case 'ip':
      return `Too many requests from your IP address. Please try again in ${retry}.`;
    case 'user':
      return `You are sending requests too quickly. Please slow down and try again in ${retry}.`;
    default:
      return `Rate limit exceeded. Please try again in ${retry}.`;
  }
}