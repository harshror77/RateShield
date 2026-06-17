import { AbstractHandler } from './AbstractHandler.js';

export class RateLimitHandler extends AbstractHandler {
  constructor(rateLimiterFactory) {
    super();
    this.rateLimiterFactory = rateLimiterFactory;
  }

  async handle(request) {
    const limiter = this.rateLimiterFactory.createLimiter(request.clientConfig);
    const result = await limiter.isAllowed(request);

    if (!result.allowed) {
      return {
        success: false,
        statusCode: 429,
        error: 'Rate limit exceeded',
        deniedBy: result.deniedBy,
        remaining: result.remaining,
        resetAt: result.resetAt,
      };
    }

    return {
      success: true,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };
  }
}