# Design Document

Rate limiter microservice. Other services call `POST /api/check` before doing real work and get an allow/deny decision back.

## Structure

`apps/` for things that run as their own process (api, dashboard). `packages/` for things that get imported (sdk, shared types). Inside `src/`, folders are named after the pattern they implement (`algorithms/`, `decorators/`, `chain/`, `factories/`) instead of generic layers like `controllers/`/`services/`. The folder names should tell you the architecture before you read any code.

## Algorithms (Strategy pattern)

`IRateLimiter` defines the contract — `isAllowed()` and `getName()`. Three implementations:

- **Token Bucket** — allows bursts, refills over time. Good for usage that comes in spikes (app open, search).
- **Sliding Window** — most accurate. Stores every request timestamp in a Redis sorted set. Higher memory cost.
- **Fixed Window** — cheapest, one counter per time bucket. Known weakness: a client can burst at the boundary between two windows and briefly exceed the limit.

Callers only ever call `.isAllowed()` — they don't know or care which one is underneath.

## Decorators — IP / User / Plan checks

Each check is its own class, wrapping the next:

```
Plan(User(Ip(algorithm)))
```

Each layer checks itself first. Fail → deny immediately, never call the inner layer (saves a Redis round trip). Pass → delegate.

**Decision:** each decorator returns its own `remaining`/`resetAt`, not a merged minimum across layers. Earlier version did `Math.min(own, wrapped)` for every layer, which meant a Pro client's response was getting dragged down by an unrelated IP-level number. Now: deny → return that layer's own state plus `deniedBy`. Allow all the way through → return the Plan layer's state, since that's the number actually meaningful to the caller.

**Decision:** `PlanLimiterDecorator` uses Fixed Window, not Token Bucket. Token Bucket refills continuously, so a client sending requests slowly enough never actually hits the limit — wrong behavior for something that's supposed to be a hard quota like "100/min". Fixed Window enforces it as a real ceiling.

## Chain of Responsibility — request validation

`IpExtractionHandler` → `AuthKeyHandler` → `RateLimitHandler`. Any handler can stop the chain on failure. Rate limit check is last on purpose — it's the only step that costs a Redis call, so cheap checks reject bad requests first.

Different from the decorators above: this validates whether the request is well-formed/authenticated. Decorators apply the actual rate-limit rules once the request is known to be valid.

## Factories

`RateLimiterFactory` builds the full decorator stack from a client's config, cached per algorithm (not per client) — three possible algorithms means at most three cached stacks, no matter how many clients exist. `HandlerChainFactory` builds the chain, injecting the repository and the rate limiter factory into the handlers that need them.

## Repository

`IClientRepository` is the interface. `InMemoryClientRepository` is the current implementation — a `Map`, seeded with three test clients. `AuthKeyHandler` only depends on the interface, so swapping in Postgres later won't touch it.

## Circuit Breaker — built, not wired in yet

`CircuitBreaker` (CLOSED/OPEN/HALF_OPEN) and `InMemoryFallbackLimiter` are both implemented but not yet wrapping the live Redis calls. Deliberate — get core rate limiting correct first, add resilience as a separate pass.

## Bugs found during integration

- Algorithms were getting a request object passed as the key in some call paths and a plain string in others, producing a literal `[object Object]` Redis key shared by everyone. Fixed by normalizing to a string (`apiKey` or `ip`) at the top of `isAllowed()`.
- `TokenBucketLimiter` used `hmset`/`hmget`, deprecated in newer ioredis, failing silently. Every check started from a fresh bucket because nothing was actually being written. Switched to `hset`/`hgetall`.
- Decorator remaining/resetAt conflation and Plan algorithm choice — both covered above.

## Known gaps

- Circuit Breaker not wired into the Redis calls yet.
- `InMemoryClientRepository` resets on restart — Postgres repo is the natural next step, same interface.
- Dashboard uses hardcoded test API keys rather than its own admin auth.