import { RateLimitService } from '../services/index.js';
import { addAuditEntry, getAuditLog, getStats, clearAuditLog } from '../audit/AuditLog.js';
import { getRedisClient } from '../singletons/index.js';

export class RateLimitController {
  constructor() {
    this.service = new RateLimitService();
  }

  async check(req, res, next) {
    try {
      const result = await this.service.check(req);

      res.setHeader('X-RateLimit-Remaining', result.remaining ?? 0);
      res.setHeader('X-RateLimit-Reset', result.resetAt ?? 0);

      addAuditEntry({
        apiKey: req.apiKey,
        ip: req.ip,
        allowed: result.success,
        deniedBy: result.deniedBy || null,
        remaining: result.remaining,
        resetAt: result.resetAt,
        correlationId: req.correlationId,
      });

      if (!result.success) {
        const retryAfterSeconds = result.resetAt
          ? Math.ceil((result.resetAt - Date.now()) / 1000)
          : 60;

        res.setHeader('Retry-After', retryAfterSeconds);

        return res.status(result.statusCode || 429).json({
          allowed: false,
          error: 'Too Many Requests',
          message: buildMessage(result.deniedBy, retryAfterSeconds),
          deniedBy: result.deniedBy,
          remaining: result.remaining ?? 0,
          resetAt: result.resetAt,
          retryAfter: `${retryAfterSeconds} seconds`,
          correlationId: req.correlationId,
        });
      }

      return res.status(200).json({
        allowed: true,
        remaining: result.remaining,
        resetAt: result.resetAt,
        correlationId: req.correlationId,
      });
    } catch (err) {
      next(err);
    }
  }

  auditLog(req, res) {
    const { limit, apiKey, allowed } = req.query;
    const entries = getAuditLog({
      limit: parseInt(limit) || 50,
      apiKey,
      allowed: allowed !== undefined ? allowed === 'true' : undefined,
    });
    return res.json({ entries });
  }

  stats(req, res) {
    return res.json(getStats());
  }

  async clearCache(req, res, next) {
    try {
      clearAuditLog();

      const redis = getRedisClient();
      const limitKeys = await redis.keys('ratelimit:*');
      const analyticsKeys = await redis.keys('analytics:*');
      const allKeys = [...limitKeys, ...analyticsKeys];

      if (allKeys.length > 0) {
        await redis.del(allKeys);
      }

      return res.status(200).json({ message: 'Cache and logs cleared successfully' });
    } catch (err) {
      next(err);
    }
  }
}

function buildMessage(deniedBy, retryAfterSeconds) {
  const retry = retryAfterSeconds > 60
    ? `${Math.ceil(retryAfterSeconds / 60)} minute(s)`
    : `${retryAfterSeconds} second(s)`;

  switch (deniedBy) {
    case 'plan': return `Plan limit exceeded. Try again in ${retry}.`;
    case 'ip': return `Too many requests from your IP. Try again in ${retry}.`;
    case 'user': return `User rate limit exceeded. Try again in ${retry}.`;
    default: return `Rate limit exceeded. Try again in ${retry}.`;
  }
}