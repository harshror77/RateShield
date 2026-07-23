# Rate Limiter as a Service

A rate-limiting microservice that centralizes request-throttling logic behind a single API, 
so consuming services get an allow/deny decision instead of implementing their own limiter.

Implements three interchangeable rate-limiting algorithms (Token Bucket, Sliding Window, Fixed 
Window) as atomic Redis Lua scripts to eliminate race conditions under concurrent requests, 
layers IP/user/plan-level limits independently via the Decorator pattern, and stays available 
during Redis outages via a circuit breaker with an in-memory fallback limiter.

See DESIGN.md for the architecture decisions and trade-offs.

## Stack

- **API:** Node.js, Express, Redis (ioredis), PostgreSQL (pg)
- **Dashboard:** React, Vite, Tailwind, React Router, Axios
- **Infra:** Docker Compose (Redis + Postgres)

## Project structure

```
RateLimiter/
├── apps/
│   ├── api/               backend service
│   ├── dashboard/         React admin UI
│   └── package/
│       ├── sdk/           npm package for consuming services
│       └── shared/        shared types/constants
├── docker-compose.yml
└── DESIGN.md
```

## Setup

Requires Node 18+, Docker, npm.

```bash
# from project root
npm install

# start Redis + Postgres
docker-compose up -d

# create the clients table (first time only)
npm run migrate --workspace=apps/api

# start the API
npm run dev:api
```

The API runs on `http://localhost:3000`.

```bash
# in a separate terminal — start the dashboard
cd apps/dashboard
npm run dev
```

The dashboard runs on `http://localhost:5173`.

## Test clients

Client data is stored in Postgres — there's no seed data yet, so create a client first via the API or dashboard:

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "x-api-key: any-key-you-choose" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "free-test-key", "clientName": "Test Client", "planId": "free", "algorithm": "token_bucket"}'
```

Plans: `free` (100 req/min), `pro` (1000 req/min), `enterprise` (10000 req/min) — configurable in `apps/api/src/config/plans.config.js`.
Algorithms: `token_bucket`, `sliding_window`, `fixed_window`.

## API

**Check rate limit**
```
POST /api/check
Header: x-api-key: free-test-key
```
```json
{ "allowed": true, "remaining": 99, "resetAt": 1234567890 }
```

**Health check**
```
GET /health
```
Reports API + Redis status.

**Manage clients**
```
GET    /api/clients
GET    /api/clients/:apiKey
POST   /api/clients
PUT    /api/clients/:apiKey
DELETE /api/clients/:apiKey
```
All client routes require the `x-api-key` header.

## Quick test

```bash
curl -X POST http://localhost:3000/api/check \
  -H "x-api-key: free-test-key" \
  -H "Content-Type: application/json"
```

Run it more than 100 times in a minute on a free-plan key and it switches to `allowed: false`.

## Environment variables

Set in `apps/api/.env` (see `docker-compose.yml` for the full list of variables Postgres/Redis expect). Key ones: `PORT`, `REDIS_HOST`, `REDIS_PORT`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `CIRCUIT_BREAKER_THRESHOLD`, `CIRCUIT_BREAKER_RECOVERY_MS`, `DEFAULT_FREE_LIMIT`, `DEFAULT_PRO_LIMIT`, `DEFAULT_ENTERPRISE_LIMIT`, `DEFAULT_WINDOW_MS`.

## Known limitations

- Client config caching (in `RateLimiterFactory` and `AuthKeyHandler`) has no eviction for long-running processes — fine at demo scale, would need a TTL/LRU policy for real long-term production use.
- Circuit breaker's in-memory fallback limiter is per-process — running multiple API replicas means the effective fallback limit during a Redis outage multiplies per instance.
- `InMemoryClientRepository` still exists but is unused; `PostgresClientRepository` is what's actually wired in.

Full reasoning behind these and other decisions in [DESIGN.md](./DESIGN.md).