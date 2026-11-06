# Application Tracker API

Backend service for [Application Tracker](../README.md), a personal portfolio project. This README covers how to run, test, and work on this service specifically — for the domain model, state machine, and architecture decisions, see the root `README.md` and `DECISIONS.md`.

## Tech stack
- **[NestJS](https://nestjs.com)** (TypeScript) — one deployable service, organized into DDD-style modules per bounded context.
- **PostgreSQL via [Prisma](https://www.prisma.io)** — repository pattern on top of generated Prisma types, keeping persistence out of the domain layer.
- **[Argon2id](https://www.npmjs.com/package/argon2)** — password hashing.
- **JWT access + refresh tokens**, httpOnly cookies, rotation with reuse detection.
- **[csrf-csrf](https://www.npmjs.com/package/csrf-csrf)** — double-submit CSRF protection.
- **[@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)** — per-IP rate limiting, tiered higher on `register`/`login`/`forgot-password`.
- **[Resend](https://resend.com)** — transactional email (signup verification, password reset).
- **[@axiomhq/js](https://axiom.co)** — every request logged (sensitive fields redacted), with a Monitor alerting on `status >= 500`.
- **Jest** — unit, integration (real Postgres), and e2e (supertest) tiers.

## Domain modules
- `identity/` — users, authentication, sessions, password/email lifecycle.
- `applications/` — the `Application` aggregate and its status state machine.
- `companies/` — the shared `Company` entity.
- `tags/` — tagging for applications.
- `observability/` — the request-logging interceptor and Axiom client.
- `utils/` — small stateless cross-module helpers (e.g. the transactional email template).

## Local setup
This service is normally run as part of the root Docker Compose stack — see the root `README.md`'s "Running the stack" section for the full flow (nginx + api + frontend + db together). To run just the API on its own instead:

1. Install dependencies: `yarn install`
2. Point `DATABASE_URL` (and the other env vars from the root `.env.example`) at a running Postgres instance.
3. Run migrations: `npx prisma migrate dev`
4. Start in watch mode: `yarn start:dev`

## Testing
- `yarn test` — unit tests, domain layer, no DB
- `yarn test:integration` — repository tests, real Postgres
- `yarn test:e2e` — HTTP layer, via supertest
- `yarn test:all` — all three tiers
- `yarn test:cov` — unit tests with coverage

Integration and e2e tests need a real Postgres reachable at `DATABASE_URL` — already true when running inside the Docker Compose stack.

## Local development scripts
- `yarn seed:smoke-test` — seeds realistic `Application`/`Company`/`Tag`/`User` data for manual/smoke testing against a local or staging environment.
- `yarn unseed:smoke-test` — removes that seeded data again.

## Linting & type checking
- `yarn lint`
- `yarn typecheck`
