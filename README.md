# Application tracker

## Overview
Project that gives you an application manager for job applications.

You can store an application
- User should provide the details of the application, like:
    - Title (name)
    - Description
    - Company (name)
    - Contact person (name, email, position)
    - Application status (interview, waiting, rejected, etc)
    - And others

The application should have a page that lists the applications with filters available
- When the user clicks on an application, it should display a page with the details of the application
- User can update status
    - Select box with the available statuses
    - Display statuses in logical order (from application until possible feedback like rejection and job offer)
    - When a status is selected, it should open a modal asking the user for more information
        - Should have a text area for the user to provide more information
        - Recruiter information is optional
        - Date
        - Text area for extra information

Project should have a dashboard with statistics about the applications,
- Application total
- Total rejections
- Total Offers
- Total interviews (technical and non-technical)

Users must register/log in to use the application — there is no anonymous mode

If the user is logged in, they can see a profile page

## Technologies
### Overview
- Project for study purposes, so it may contain overengineering.
- The goal is to learn how to work using AI as an assistant
- Learn architecture and design pattern principles

### Frontend
- **Framework: React + Vite, TypeScript.** Next.js's payoffs (SEO, SSR for public content) don't apply here — the app is either anonymous/client-only or behind auth, and all data is per-user and dynamic, so nothing benefits from static generation or server rendering. Same "simplest option that fits" reasoning as REST over GraphQL and one service over microservices. See `DECISIONS.md` #22.
- **CSS: Tailwind CSS** — fastest path to a clean UI without hand-maintained stylesheets. See `DECISIONS.md` #22.

**TO DO:**
- How to handle optimization

### Backend
One deployable service, not microservices - a Go-style gateway-plus-services split would just add deployment/communication overhead without a matching benefit at this scale.

- **Language/framework: NestJS (TypeScript).** Chosen over Go so the app can actually be used soon (existing TS knowledge beats learning a new language while building it). NestJS's module/DI system maps naturally onto DDD bounded contexts (an `applications` module, an `identity` module) inside the single service, and its decorators (guards, interceptors, pipes) double as design-pattern practice.
- **API style: REST.** Simpler to build, test, and document than GraphQL; consistent with picking the simplest option at each fork of this project (managed deploy platforms over a self-hosted gateway, one service over microservices).
- **Storage: PostgreSQL, via Prisma.**
    - **Why Prisma over TypeORM:** TypeORM's entities are TS classes decorated directly with persistence annotations (`@Entity`, `@Column`), which makes it easy - and is the "normal" TypeORM way - to reuse that same class as the domain object. That conflates persistence with domain and only stays clean if you deliberately keep a separate domain class and map by hand every time. Prisma has no entity class at all: it generates plain, type-safe data types from a schema file, so there's nothing to be tempted to reuse as `Application`. That forces the repository-mapping boundary to happen structurally instead of by self-discipline, which fits the point of this project (practicing DDD deliberately) better. Prisma's migration workflow (`prisma migrate dev`) and end-to-end type safety are also smoother than TypeORM's, which matters given the goal of actually shipping this app soon. The trade-off: NestJS's first-party integration is with TypeORM (`@nestjs/typeorm`, `@InjectRepository`); Prisma needs a small hand-written `PrismaService` wrapper instead - a well-documented, one-time cost, not an ongoing one.
    - **Repository pattern, on top of Prisma:** one repository per aggregate root (`ApplicationRepository`, `UserRepository`). This is the layer that translates between Prisma's generated types and the domain aggregates, so Prisma never leaks into domain or service code. It also means application services can depend on a repository interface, so domain-layer unit tests can fake it - no real Postgres needed to test business logic (see Test pyramid below).
    - **Service pattern:** NestJS is Controller → Service → Repository by design, so this layer isn't optional. The important part is what does *not* go in the service: the `ApplicationsService` should stay a thin orchestrator (call the domain's state-machine logic, call the repository, maybe emit an event), while the actual transition rules live inside the domain layer itself (the `Application` aggregate / the State pattern object below). Letting the service hold the business rules instead would produce an anemic domain model - the exact anti-pattern this project is meant to practice avoiding.
- **Domain model** (fully defined — entities, attributes, invariants, and the state machine; see `DECISIONS.md` #15–18 for the detail behind each):
    - Two bounded contexts: **Applications** (below) and **Identity** (`User`, in its own module — `Application` only holds a `userId` reference, no reach-through, which is what would let Identity become its own service later if ever needed).
    - `Application` aggregate root — title (max 255), description (optional, unbounded), external link (job posting URL, optional), salary (optional, single float, no currency for now), company (ref), current status, createdAt. Holds the job's own info directly; no separate `JobPosting` entity, since an `Application` is only ever created after applying (there's no "saved, not yet applied" state to model). Field-level detail and invariants: see `DECISIONS.md` #15.
    - `Company` — entity (own table), shared/global across all users (not scoped to `userId`), to support a search-or-create autocomplete flow. `name` is normalized (lowercase, then capitalize the first character) and unique after normalization; `website` optional. Field-level detail: see `DECISIONS.md` #17.
    - `StatusChange` — an append-only child entity/log (status, eventDate, notes, `interviewCategory`, createdAt), rather than overwriting fields on `Application`. One row per transition. "Current status" is the row with the latest `createdAt` for that application — insertion order, not `eventDate`, so a backdated event can't reorder what counts as current. This is what "update status with more info" and the dashboard stats naturally derive from. Field-level detail: see `DECISIONS.md` #16.
    - `Contact` — value object (`name`, `email` only), embedded per `StatusChange` rather than a fixed field on `Application`, since a contact only ever changes alongside a status update. Attaching it to the append-only `StatusChange` log gives full contact history for free, with no separate versioning to build. In Postgres this is plain columns (`contact_name`, `contact_email`) on the `status_changes` table — value objects don't get their own table, only entities (like `Company`) do.
    - `User` aggregate lives in the identity module — `email`, `passwordHash` (nullable, for future social login), `authProvider`, `name`/`avatar` (optional, editable later), `role` (`USER`/`ADMIN`, basic account moderation), `isActive`. Field-level detail: see `DECISIONS.md` #25.
- **State machine:** encapsulated in the domain layer (State pattern / guarded transition value object) — a direct application of the "implement design patterns" goal, rather than ad hoc checks in a controller/service. Statuses: `APPLIED` → `WAITING_FEEDBACK` / `ASSIGNMENT` / `INTERVIEW_SCHEDULED` / `OFFER` (freely, including self-loops) or `REJECTED`; `OFFER` also → `OFFER_ACCEPTED` / `OFFER_DECLINED` (terminal). `APPLIED` is never re-entered. Full transition table and rationale: see `DECISIONS.md` #18.
- **Domain events (optional/stretch, not required for v1):** NestJS's built-in `EventEmitter`, e.g. an `ApplicationStatusChanged` event decoupling dashboard-stat recalculation from the write path (Observer pattern).
- **Listing/filtering:** query params + DB indexes on `status`/`company`, paginated.
- **Auth:** JWT in an httpOnly cookie scoped to `.application-tracker.lucassenarj.dev`, so it's sent automatically to `api.application-tracker.lucassenarj.dev`. CORS configured for credentials plus the explicit frontend origin. Chosen over a bearer-token-in-header approach for XSS resistance. Access + refresh token split with rotation/reuse detection, Argon2id password hashing, and an explicit double-submit CSRF token: see `DECISIONS.md` #26–28. A second mechanism, personal access tokens, exists for third-party/programmatic clients (currently the Chrome extension), deliberately scoped to a single route rather than full account access: see `DECISIONS.md` #39.
- **Test pyramid:** unit tests on the domain layer (state machine, aggregates - no DB), integration tests on repositories (real Postgres), e2e tests on the HTTP layer.

### Infrastructure
- **Local dev:** full self-hosted-style stack via Docker Compose — `nginx` (reverse proxy, TLS via mkcert), `api`, and (once scaffolded) `frontend`/`db` containers, kept ready to redeploy as-is to a VPS in a later phase. See `DECISIONS.md` #23.
- **Public deploy (phase 1, this week):** no self-hosted reverse proxy — Vercel and Render each handle their own routing/TLS. See Deploy below and `DECISIONS.md` #24.

#### Local setup prerequisites
- [mkcert](https://github.com/FiloSottile/mkcert) — required because `.dev` domains are forced to HTTPS by browsers via HSTS preload, so local nginx needs a locally-trusted TLS cert. Install it, then run once per machine:
  ```
  mkcert -install
  ```
  Then generate the project's local cert (gitignored, not committed — regenerate per machine):
  ```
  mkdir -p nginx/certs
  mkcert -cert-file nginx/certs/local.pem \
         -key-file nginx/certs/local-key.pem \
         local.application-tracker.lucassenarj.dev local.api.application-tracker.lucassenarj.dev
  ```
- Add to `/etc/hosts`:
  ```
  127.0.0.1 local.application-tracker.lucassenarj.dev
  127.0.0.1 local.api.application-tracker.lucassenarj.dev
  ```

#### Running the stack
1. Copy the root env file and fill in real values (see "Providers & external services" below for where each one comes from): `cp .env.example .env`
2. Copy the frontend's own env file (Vite reads `.env.local`, separate from the root `.env` used by Docker Compose): `cp frontend/.env.example frontend/.env.local`
3. Build and start everything — `nginx`, `api`, `frontend`, `db`: `docker compose up --build`
4. Run the database migrations (first run only, or after pulling new ones): `docker compose exec api npx prisma migrate dev`
5. Visit `https://local.application-tracker.lucassenarj.dev`. The API is reachable directly at `https://local.api.application-tracker.lucassenarj.dev`, proxied by the local nginx container the same way the real deploy's reverse proxy would be.

#### Running tests
See each project's own README for the full command list.
- `docker compose exec api yarn test`
- `docker compose exec frontend yarn test`

### Deploy
- Constraint: prefer a cheap or free hosting option.
- **Frontend: Vercel. API: Render. Database: Neon.** All three have free tiers and near-zero deploy config, so no server or reverse proxy to provision/maintain by hand. Render's own free Postgres was dropped for Neon instead — it expires 30 days after creation with no backups, while Neon's free tier is permanent (scale-to-zero after 5 min idle, not deletion). Trade-off: Render's free web service cold-starts after inactivity — acceptable for a portfolio demo, not production traffic. See `DECISIONS.md` #22 and #24.

**TO DO:**
- How to deploy (concrete steps/CI pipeline)
- How to optimize FE
- How to optimize BE

### Providers & external services
Beyond the three deploy platforms above, the running app depends on:
- **[Resend](https://resend.com)** — transactional email (signup verification, password reset). Free tier: 3,000/month, 100/day.
- **[Axiom](https://axiom.co)** — backend request logging (every request, all status codes, sensitive fields redacted) plus a Monitor alerting on `status >= 500`. Free tier: 500GB/month ingest.
- **[Sentry](https://sentry.io)** — frontend crash/error tracking (unhandled exceptions, promise rejections, React render crashes via an Error Boundary). Free tier: 5,000 errors/month.
- **[Backblaze B2](https://www.backblaze.com/cloud-storage)** — private bucket storing daily database backups (30-day lifecycle, 7-day Object Lock), uploaded by a scheduled GitHub Actions workflow.
- **[cron-job.org](https://cron-job.org)** — pings the API's `/health` endpoint every 10 minutes on weekdays to keep Render's free-tier backend from cold-starting during likely-traffic hours.
- **GitHub Actions** — the daily database backup workflow and the keep-alive ping above, plus CI.

Full rationale for each is in `DECISIONS.md` and `notes/backend-hardening/`.

### Observability
**Backend:** every request logged to Axiom (method, path, status, duration, redacted body), via a `LoggingInterceptor` hooking the response's native `'finish'` event. An Axiom match monitor alerts by email on `status >= 500`.
**Frontend:** Sentry captures unhandled exceptions, unhandled promise rejections, and React render crashes (top-level Error Boundary plus granular per-widget boundaries on the Dashboard). URL query params are scrubbed before any event is sent.
Full design docs: `notes/backend-hardening/observability-design-doc.md` and `notes/backend-hardening/sentry-frontend-design-doc.md`.
