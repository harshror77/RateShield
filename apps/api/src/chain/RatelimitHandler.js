import { AbstractHandler } from './AbstractHandler.js';

export class RateLimitHandler extends AbstractHandler {
 
  constructor(limiter) {
    super();
    this.limiter = limiter;
  }

  async handle(request) {
    const result = await this.limiter.isAllowed(request);

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