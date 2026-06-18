# Rate Limiter as a Service

A standalone rate limiting microservice. Other services call it before doing real work and get an allow/deny decision back, instead of every team writing their own rate limiting logic.

Built to show a few classic design patterns (Strategy, Decorator, Chain of Responsibility, Factory, Repository) working together in a real, runnable system — not just diagrams. See [DESIGN.md](./DESIGN.md) for the architecture decisions and trade-offs.

## Stack

- **API:** Node.js, Express, Redis (ioredis)
- **Dashboard:** React, Vite, Tailwind, React Router, Axios
- **Infra:** Docker Compose (Redis)

## Project structure

```
RateLimiter/
├── apps/
│   ├── api/          backend service
│   └── dashboard/     React admin UI
├── packages/
│   ├── sdk/           npm package for consuming services
│   └── shared/        shared types/constants
├── docker-compose.yml
└── DESIGN.md
```

## Setup

Requires Node 18+, Docker, npm.

```bash
# from project root
npm install

# start Redis
docker-compose up -d

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

The API seeds three test clients on startup, no database setup needed:

| API Key | Plan | Algorithm |
|---|---|---|
| `free-test-key` | Free (100 req/min) | Token Bucket |
| `pro-test-key` | Pro (1000 req/min) | Sliding Window |
| `enterprise-test-key` | Enterprise (10000 req/min) | Fixed Window |

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

Run it more than 100 times in a minute on the free key and it switches to `allowed: false`.

## Environment variables

See `.env.example` in `apps/api/`. Defaults work out of the box for local development.

## Known limitations

- Circuit Breaker is implemented but not yet wired into the live Redis calls.
- Client storage is in-memory — restarting the API resets to the three seeded test clients.

Full reasoning behind these and other decisions in [DESIGN.md](./DESIGN.md).