# @rate-limiter/sdk

Client and Express middleware for the Rate Limiter as a Service.

## Usage

```javascript
import { RateLimiterMiddleware } from '@rate-limiter/sdk';

app.use(RateLimiterMiddleware({
  serviceUrl: 'http://localhost:3000',
  apiKey: 'your-service-api-key',
}));
```

Every route registered after this middleware is automatically rate limited. If the limit is exceeded, the middleware responds with `429` and an `X-RateLimit-Remaining` header — your route handler never runs.

## Using the client directly

For non-Express use cases, or to check a limit without blocking a route:

```javascript
import { RateLimiterClient } from '@rate-limiter/sdk';

const client = new RateLimiterClient({
  serviceUrl: 'http://localhost:3000',
  apiKey: 'your-service-api-key',
});

const result = await client.check({ ip: '1.2.3.4', userId: 'abc123' });
console.log(result.allowed, result.remaining);
```

## Behavior when the rate limiter service is unreachable

The middleware fails open — if the rate limiter service itself is down or unreachable, requests are allowed through rather than blocking your entire app. This is a deliberate trade-off: an unrelated service outage shouldn't take down everything that depends on it.