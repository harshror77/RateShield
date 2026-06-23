import { AbstractHandler } from './AbstractHandler.js';
import { CircuitBreaker, CircuitState } from '../circuit-breaker/CircuitBreaker.js';
import { InMemoryFallbackLimiter } from '../circuit-breaker/InMemoryFallbackLimiter.js';
import { getConfig } from '../singletons/configLoader.singleton.js';

const cbConfig = getConfig().circuitBreaker;
const circuitBreaker = new CircuitBreaker(cbConfig);
const fallbackLimiter = new InMemoryFallbackLimiter({ maxRequests: 1000, windowMs: 60000 });

export class RateLimitHandler extends AbstractHandler {
  constructor(rateLimiterFactory) {
    super();
    this.rateLimiterFactory = rateLimiterFactory;
  }

  async handle(request) {
    const limiter = this.rateLimiterFactory.createLimiter(request.clientConfig);
    let result;

    try {
      result = await circuitBreaker.execute(() => limiter.isAllowed(request));
    } catch (err) {
      if (err.message === 'CIRCUIT_OPEN' || circuitBreaker.state === CircuitState.OPEN) {
        const fallbackKey = `${request.apiKey}:${request.ip}`;
        result = await fallbackLimiter.isAllowed(fallbackKey);
        result.deniedBy = result.allowed ? null : 'fallback';
      } else {
        throw err;
      }
    }

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