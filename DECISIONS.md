# Application Tracker — Decisions & Progress Log

Companion to `README.md`. The README states the current spec/plan (including what's still `TO DO`); this file is the rationale trail behind it — what we decided, the goal each decision serves, and why we picked that option over the alternatives. Living document: update it as new decisions get made, don't just leave it as a snapshot of today.

For a visual view of the architecture and domain model described below, see `C4-MODEL.md` — keep it in sync when a relevant decision changes.

## Product goal (context for everything below)

A personal job-application tracker: log an application (title, description, link to the posting, company), then move it through statuses over time (Waiting Feedback, Interview Scheduled, Rejected, Offer, ...), capturing extra context at each transition (interviewer, date, rejection reason, notes) via a modal. Includes a stats dashboard and works anonymously first, persisting only on registration. Built explicitly as a learning project — TDD, DDD, deliberate design-pattern use — so some choices favor learning value over minimal effort (see "may contain overengineering" in the README).

---

## Decisions so far

### 1. Single deployable service, not microservices
- **Goal:** keep deployment/operational overhead low while still practicing DDD's internal boundaries.
- **Why this way:** nginx is already the single entry point needed (routing `domain.com` / `api.domain.com`); splitting into real microservices would add network calls and deployment complexity with no matching benefit at this scale. DDD bounded contexts (`applications`, `identity`) are kept as internal module boundaries instead — the seam is real, the deployment cost isn't paid yet.

### 2. Backend language/framework: NestJS (TypeScript)
- **Goal:** ship something usable soon, while still getting solid architecture/pattern practice.
- **Why this way:** picked over Go because existing TypeScript knowledge beats learning a new language mid-build. NestJS's module/DI system maps naturally onto DDD bounded contexts (`ApplicationsModule`, `IdentityModule`), and its decorator system (guards, interceptors, pipes) doubles as design-pattern practice — directly serving the "apply design patterns deliberately" requirement.

### 3. API style: REST
- **Goal:** keep the API simple to build, test, and document.
- **Why this way:** GraphQL would add schema/resolver overhead with no clear payoff for this project's size — consistent with picking the simplest option at each fork (see decision 1).

### 4. Storage: PostgreSQL via Prisma
- **Goal:** persistence that doesn't fight the DDD goal of keeping domain and persistence concerns separate.
- **Why this way:** TypeORM's `@Entity`/`@Column` decorators make it easy — and idiomatic — to reuse the same class as both the persistence row and the domain object, which conflates the two unless you deliberately keep them apart. Prisma generates plain data types with no entity class at all, so there's nothing to be tempted to reuse as `Application`; the repository-mapping boundary happens structurally rather than by self-discipline. Trade-off: NestJS's first-party integration is with TypeORM, so Prisma needs a small hand-written `PrismaService` wrapper — a one-time, well-documented cost.

### 5. Repository pattern on top of Prisma
- **Goal:** stop Prisma's generated types from leaking into domain/service code, and make the domain layer unit-testable without a real database.
- **Why this way:** one repository per aggregate root (`ApplicationRepository`, `UserRepository`) translates between Prisma types and domain aggregates. Application services depend on a repository *interface*, so domain-layer unit tests can fake it — real Postgres is only needed for the integration-test layer (see decision 11).

### 6. Service pattern: thin orchestrators, not where business rules live
- **Goal:** avoid an anemic domain model — the exact anti-pattern this project exists to practice avoiding.
- **Why this way:** NestJS's Controller → Service → Repository shape isn't optional, so the discipline is in what the service *doesn't* do: `ApplicationsService` calls the domain's state-machine logic and the repository, maybe emits an event — the actual transition rules live inside the `Application` aggregate / State pattern object itself.

### 7. Bounded contexts: Applications vs. Identity
- **Goal:** keep user-account concerns and application-tracking concerns from tangling, and leave the door open to extracting Identity later if ever needed.
- **Why this way:** `Application` only holds a `userId` reference — it never reaches into `User` internals. That boundary is what would make pulling Identity into its own service later a small change instead of a rewrite, without us actually paying for a second service today.

### 8. Domain model — Applications context
*(confirmed 2026-08-11, entity/relationship level; per-entity attribute types and invariants are the next step)*

- **`Application`** (aggregate root) — title, description, external link (job posting URL), company (ref), current status, createdAt.
  - **Goal:** one clear owner for an application's identity and current state.
  - **Why this way:** holds the job's own info directly rather than referencing a separate `JobPosting` entity, because a record is only ever created *after* applying — there's no "saved, not yet applied" state in this product to justify a second entity with its own lifecycle.
- **`Company`** (entity, own table).
  - **Goal:** let multiple applications reference the same company and eventually be filtered/listed by it.
  - **Why this way:** modeled as an entity (not a plain string field) specifically because it has an identity worth querying independently — that's the line DDD draws between entity and value object, and Company is on the entity side of it.
- **`StatusChange`** (append-only child entity, one row per transition — status, occurredAt, notes, rejectionReason).
  - **Goal:** never lose the history of how an application progressed; feed the dashboard stats naturally.
  - **Why this way:** overwriting a `status` field in place would destroy history; appending a new immutable row per transition matches the "select status → modal asks for more info" flow directly and gives history "for free" from something we already had to build.
- **`Contact`** (value object — `name`, `email` only — embedded per `StatusChange`).
  - **Goal:** capture who you dealt with at each stage, without losing that history as the point of contact changes.
  - **Why this way:** a contact only ever changes *alongside* a status update in this product, so it never needs independent identity or its own update history — attaching it to the already-append-only `StatusChange` log gives contact history for free, with no separate versioning mechanism to build. In Postgres this lands as plain columns (`contact_name`, `contact_email`) on `status_changes`, not a separate table — value objects don't get their own table, only entities (like `Company`) do.
- **`User`** — lives entirely in the Identity module/context (see decision 7), not modeled here.

> Visual reference: [entity/relationship diagram](https://claude.ai/code/artifact/f7f56b06-c50a-4ac2-879c-913cc34f2e2d) worked out during the 2026-08-11 session.

### 9. State machine for status transitions
- **Goal:** stop invalid transitions (e.g. `INTERVIEW → APPLIED`) from being representable at all, and give the domain layer somewhere to own that rule.
- **Why this way:** State pattern / guarded-transition value object living in the domain layer, not ad hoc `if` checks scattered across a controller or service — a direct, deliberate application of the "implement design patterns" project requirement.

### 10. Auth: JWT in an httpOnly cookie, scoped to `.domain.com`
- **Goal:** authenticate requests from the frontend to the API without exposing the token to JS.
- **Why this way:** cookie scoped to the parent domain is sent automatically to `api.domain.com`; CORS is configured for credentials plus the explicit frontend origin. Chosen over a bearer-token-in-header approach specifically for XSS resistance — a token in `localStorage`/JS memory is readable by any injected script, an httpOnly cookie isn't.

### 11. Anonymous usage: client-side first, bulk upload on registration
- **Goal:** let people use the tracker with zero signup friction, per the product requirement, without backend complexity for data that might never be claimed.
- **Why this way:** anonymous mode is fully client-side (IndexedDB/localStorage) — no backend calls until registration. On registration, the frontend bulk-uploads local applications once, then switches to API-backed mode. Chosen over a backend "guest session" concept specifically to avoid orphaned-guest-data cleanup and account-linking complexity — the trade-off is pushed to the client, where it's cheap, instead of the server, where it isn't.

### 12. Test pyramid
- **Goal:** confidence at the right cost per layer.
- **Why this way:** unit tests on the domain layer (state machine, aggregates — no DB), integration tests on repositories (real Postgres), e2e tests on the HTTP layer. Mirrors decision 5 directly — the repository interface is what makes the unit layer fast and DB-free.

### 13. Infrastructure: nginx as the single reverse-proxy entry point — PARTIALLY SUPERSEDED (see decisions 23–24)
- **Goal:** one predictable entry point instead of exposing multiple services/ports directly.
- **Why this way:** `domain.com` routes to the frontend, `api.domain.com` routes to the API — the piece of infra that made decision 1 (single service, no microservice gateway) viable in the first place.
- **Superseded for the public deploy, revived for local dev:** decision 22/24 drops self-hosted nginx for the *public* deploy in favor of Vercel + Render. Decision 23 brings nginx back for *local development only* — a real nginx + Docker Compose stack, kept ready to redeploy to a VPS in a later phase.

### 14. Runtime: Node.js 22
- **Goal:** get the Nest CLI available so the project can actually be scaffolded.
- **Why this way:** plain prerequisite, no alternatives considered — Nest CLI needs a Node runtime.

### 15. `Application` attributes & invariants (first pass)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | system-generated | identity |
| `title` | string | yes | max 255 chars |
| `description` | text | no | unbounded — usage not yet known, so no length cap imposed upfront |
| `externalUrl` | string (URL) | no | the LinkedIn/job-post link |
| `salary` | float | no | single value, not a range; no currency captured |
| `companyId` | ref → `Company` | yes | |
| `userId` | ref → `User` | yes | anonymous data never reaches the backend (decision 11), so every server-side `Application` belongs to a registered user |
| `currentStatus` | Status | yes, system-managed | see invariants |
| `createdAt` | timestamp | system-generated | immutable |

- **Goal:** pin down `Application`'s exact shape so the remaining entities (which reference it) and the eventual Prisma schema have something concrete to build against.
- **Why this way** (architectural invariants only — field types/lengths above are just definitions, not decisions):
  - `currentStatus` is never set directly — only through a domain method that validates the transition against the state machine (decision 9) and appends a `StatusChange` in the same operation, so the denormalized field (kept for the indexed listing/filtering from decision 9) never drifts from the history it's derived from.
  - An `Application` can't exist without at least one `StatusChange` — creation atomically creates the first one (`status = APPLIED`).
  - `companyId`/`userId` are required — no application without an owner or a company.

### 16. `StatusChange` (+ `Contact`) attributes & invariants

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | system-generated | identity |
| `applicationId` | ref → `Application` | yes | owning aggregate |
| `status` | Status (enum) | yes | the status this row represents |
| `eventDate` | date | yes | when the event actually happened |
| `notes` | text | no | free text, covers rejection reasons too — no separate field |
| `contactName` | string | no | `Contact`, embedded, independent of `contactEmail` |
| `contactEmail` | string | no | `Contact`, embedded, independent of `contactName` |
| `interviewCategory` | enum (`TECHNICAL` \| `NON_TECHNICAL`) | only when `status = INTERVIEW_SCHEDULED` | added by decision 18 — backs the dashboard's technical/non-technical interview stat |
| `createdAt` | timestamp | system-generated | insertion order — determines "current status" |

- **Goal:** pin down `StatusChange`'s exact shape (and `Contact`'s, embedded within it), since `Application`'s invariants (decision 15) already depend on it.
- **Why this way** (architectural invariants only — field types above are just definitions, not decisions):
  - Rows are immutable and append-only — never updated or deleted once written (restates decision 8's framing as a hard rule).
  - "Current status" for an `Application` is the `status` of the row with the latest `createdAt` for that `applicationId` — insertion order, not `eventDate`, so a backdated event date can never reorder what counts as current.

### 17. `Company` attributes & invariants

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | system-generated | identity |
| `name` | string | yes | normalized on write — see invariants |
| `website` | string (URL) | no | |

- **Goal:** support the planned autocomplete-or-create flow (search existing companies, create one if it doesn't exist) without producing duplicate rows for the same real company.
- **Why this way** (architectural invariants only — field types above are just definitions, not decisions):
  - No `userId` — unlike `Application`/`StatusChange`, `Company` is shared/global across all users, since the autocomplete flow only works if everyone searches the same pool.
  - `name` is normalized before persisting (lowercase the whole string, then capitalize the first character) and must be unique after normalization — this is what makes "Google" and "google" resolve to the same row. Enforced in the domain/backend layer specifically, since the uniqueness guarantee can't depend on a client doing the right thing.

### 18. State machine: status enum & transition rules

**Statuses:** `APPLIED`, `WAITING_FEEDBACK`, `ASSIGNMENT`, `INTERVIEW_SCHEDULED`, `OFFER`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `REJECTED`.

**Transition rule** (guard logic, not a hand-picked pair list):
1. `APPLIED` is entry-only, set automatically at creation (decision 15) — no transition ever leads back to it.
2. `OFFER_ACCEPTED`, `OFFER_DECLINED`, and `REJECTED` are terminal — no transitions out.
3. `WAITING_FEEDBACK`, `ASSIGNMENT`, `INTERVIEW_SCHEDULED`, and `OFFER` move freely among each other, including self-loops (covers another interview round, or a revised offer after renegotiation), or to `REJECTED`.
4. `OFFER_ACCEPTED`/`OFFER_DECLINED` are reachable only from `OFFER` — you can't accept or decline without an offer first.

| From ＼ To | APPLIED | WAITING_FEEDBACK | ASSIGNMENT | INTERVIEW_SCHEDULED | OFFER | OFFER_ACCEPTED | OFFER_DECLINED | REJECTED |
|---|---|---|---|---|---|---|---|---|
| **APPLIED** | – | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| **WAITING_FEEDBACK** | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| **ASSIGNMENT** | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| **INTERVIEW_SCHEDULED** | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| **OFFER** | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **OFFER_ACCEPTED** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **OFFER_DECLINED** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **REJECTED** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Interview typing — adds `interviewCategory` to `StatusChange` (decision 16), not a separate status per type:**
- **Goal:** the dashboard needs a technical/non-technical interview count, but a single application can go through many interview rounds of different flavors (HR, behavioral, hiring manager, system design, etc.) — a status enum can't cheaply represent that without exploding.
- **Why this way:** one `INTERVIEW_SCHEDULED` status keeps the state machine's transition rules unchanged no matter how many interview flavors exist — a new flavor is just a new value somewhere else, not a new state with its own guard logic. `interviewCategory` (`TECHNICAL` | `NON_TECHNICAL`) is required only on rows where `status = INTERVIEW_SCHEDULED`, and is structured (not folded into `notes` like `rejectionReason` was) specifically because it backs a real stats requirement — finer flavors (HR vs. behavioral vs. manager) don't have a stats requirement behind them, so those stay in `notes`.
- **Why `OFFER` isn't terminal:** an offer can be accepted, declined, or renegotiated (looping back through the free-movement group before landing on a revised `OFFER`) — only the outcome states (`OFFER_ACCEPTED`/`OFFER_DECLINED`) are terminal.

### 19. NestJS scaffold: location, package manager, linker

- **Goal:** get a running backend skeleton in place to build the domain model (decisions 15–18) against.
- **Why this way:**
  - Lives at `application-tracker/api/`, not `backend/` — matches the `api` naming already used in `C4-MODEL.md` and decision 13's `api.domain.com`.
  - Package manager is **Yarn Berry** (`yarn@4.18.0`, via corepack) — user's choice, prior job experience with it.
  - Linker is **`nodeLinker: node-modules`**, not PnP — deliberate, because Prisma (decision 4) has a well-known history of resolution issues under Yarn PnP; NestJS itself has no PnP issues.
  - Scaffolded with `npx @nestjs/cli new api --skip-install --skip-git --package-manager yarn` rather than a global `nest` install, since the Nest CLI isn't (and doesn't need to be) a global tool — restates decision 14's Node.js prerequisite without adding another global binary.
- **Verified:** `yarn install` completed clean (665 packages, `node_modules` present, confirming the node-modules linker took effect); `yarn start` boots the app and `GET /` returns 200.

### 20. `applications` module internal layout: domain/ + infrastructure/, rest flat

- **Goal:** make the boundaries decisions 5 and 6 already committed to (repository interface vs. Prisma adapter; domain owns the rules, service just orchestrates) visible in the file tree, without over-building folder ceremony for a module this size.
- **Why this way:**
  - `domain/` holds `Application`/`StatusChange`/`Contact`/`Company` (decisions 15–17), the state machine (decisions 9, 18), and the repository *interfaces* (decision 5's port side).
  - `infrastructure/` holds the Prisma-backed repository *implementations* (decision 5's adapter side) — the only place Prisma types are allowed to appear.
  - Everything else (`applications.controller.ts`, `applications.service.ts`, `dto/`) stays flat at the module root, matching normal Nest CLI conventions, rather than adding further layer folders (e.g. a dedicated `application/`/`use-cases/` layer) — considered and rejected as more ceremony than this module's size justifies, and `application/` specifically would read confusingly as a folder name right next to the `Application` entity.
  - `Company` stays inside `applications/`, not its own module — decision 7 only names two bounded contexts (Applications, Identity); `Company` was never scoped as a third.
  - `identity/` isn't scaffolded yet — `User`'s attributes/invariants were never decided (only `Application`/`StatusChange`/`Contact`/`Company` were, decisions 15–17), so scaffolding it now would mean guessing. Stays in "Still open" below.

### 21. `api/Dockerfile` + `docker-compose.yml`: dev-only container, not the production image

- **Goal:** let the user run/test the api manually without ever executing app code directly on the host — everything runs inside a container.
- **Why this way:** explicitly scoped as dev-only (single stage, `yarn start:dev` watch mode, bind-mounted source) and labeled as such in the file itself, so it isn't mistaken later for the real production/deploy image — that decision (target platform, optimization) is still open per the README's Deploy section. Wired as an `api` service in this project's own `docker-compose.yml`, kept self-contained to `application-tracker/` — nothing about how this project runs depends on anything outside its own folder. An anonymous `node_modules` volume keeps the image's own install from being overwritten by the host bind mount.
- **Not verified by me** — Docker wasn't available in the environment used to write this, so `docker compose build/up api` needs to be run and checked by the user.

---

### 22. Frontend framework, CSS strategy, and deploy target

- **Goal:** unblock frontend/deploy work under a one-week deadline (needed for job applications), without over-researching choices that don't matter much at this project's scale.
- **Why this way:**
  - **Frontend: React + Vite (SPA), TypeScript.** Next.js was considered — its main payoffs are SEO (crawlable static/server-rendered pages) and faster first paint on public content — but this app has no crawlable content: it's either anonymous-only (client-side/local) or behind auth, and all data is per-user and dynamic, so nothing benefits from SSR or static generation. Picking Next.js here would add routing/rendering-mode complexity with no matching payoff, the same reasoning already used to reject GraphQL (decision 3) and microservices (decision 1).
  - **CSS: Tailwind CSS.** Fastest path to a clean UI without hand-writing/maintaining separate stylesheets, which matters given the deadline.
  - **Deploy: Vercel (frontend) + Render (API), not self-hosted nginx — for now.** The original infra note (nginx as single reverse-proxy gateway, `domain.com` / `api.domain.com`) assumed self-hosting on one server; that's dropped for the *public* deploy in favor of two managed platforms with free tiers and near-zero deploy config, faster to stand up this week and needing no server/nginx maintained by hand. Trade-off: Render's free web service cold-starts after inactivity — acceptable for a portfolio demo, not for production traffic. Database provider and domain scheme refined by decisions 23–24; local development takes a different path than the public deploy (decision 23).

### 23. Domain/subdomain scheme; local dev mirrors self-hosted target architecture

- **Goal:** pick a domain scheme that works identically regardless of deploy target (managed platforms now, a VPS later), and let local development rehearse the real self-hosted architecture (nginx + containers) without committing to self-hosting *now*.
- **Why this way:**
  - **Public subdomains:** `application-tracker.lucassenarj.dev` (frontend), `api.application-tracker.lucassenarj.dev` (API) — real subdomains under the user's own domain, not the placeholder `domain.com`/`api.domain.com` used earlier. This scopes decision 10's auth cookie to `.application-tracker.lucassenarj.dev` specifically, not the user's whole personal domain, and is deploy-target-agnostic: switching the API from Render to a self-hosted VPS later only means repointing DNS, not changing the cookie/auth architecture.
  - **Local subdomains:** `local.application-tracker.lucassenarj.dev` / `local.api.application-tracker.lucassenarj.dev`, resolved to `127.0.0.1` via `/etc/hosts`. Using a real subdomain of the owned domain (rather than a fake TLD like `.test`) was considered against `.local` (rejected — reserved for mDNS/Bonjour, RFC 6762, can misbehave) — but since the domain is `.dev`, which is entirely on the browser HSTS preload list (`include_subdomains: true, mode: force-https`), every subdomain including the local ones is forced to HTTPS by the browser regardless of hosting. **mkcert** is used to issue a locally-trusted TLS cert for local nginx, so local dev runs HTTPS end-to-end too — closer parity with production, not just a workaround.
  - **Local infra partially un-supersedes decision 13:** local development runs the full self-hosted-style stack via Docker Compose — `nginx` (reverse proxy, TLS via mkcert), `api`, `frontend`, `db` (Postgres) containers — so it's ready to redeploy as-is to a VPS in a later phase. This is *only* for local dev; decision 22/24's managed-platform choice for the *public* deploy stands unchanged.

### 24. Temporary public deploy target: Vercel + Render + Neon (phase 1)

- **Goal:** have a live, linkable deployment this week for job applications, without taking on self-hosted VPS setup/maintenance risk under deadline pressure.
- **Why this way:**
  - **Database: Neon**, not Render's own Postgres. Render's free Postgres expires 30 days after creation (14-day grace period, then deletion, no backups on the free tier) — a real risk of the demo silently breaking mid-job-search. Verified Neon's free tier is permanent (no credit card, never expires), with only scale-to-zero compute suspension after 5 minutes idle, not data deletion.
  - **Custom domains:** `application-tracker.lucassenarj.dev` → Vercel, `api.application-tracker.lucassenarj.dev` → Render, both configured as custom domains on their respective free tiers (decision 23's scheme applies from day one, not just after a future VPS migration).
  - **Phase 2 (not now, not blocking this week):** swap this deploy target for the self-hosted VPS running decision 23's local Docker Compose stack, once there's no deadline pressure. Only DNS targets and the DB connection string change — the domain scheme, cookie/auth architecture, and container layout stay the same.

### 25. `User` attributes & invariants

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | system-generated | identity |
| `email` | string | yes | unique |
| `passwordHash` | string | only when `authProvider = PASSWORD` | `null` for social-login-only accounts |
| `authProvider` | enum (`PASSWORD` initially, more values added per provider later) | yes, system-managed | see rationale below |
| `name` | string | no | editable later (profile page) |
| `avatar` | string (URL) | no | editable later (profile page) |
| `role` | enum (`USER` \| `ADMIN`) | yes, system-managed, default `USER` | |
| `isActive` | boolean | yes, default `true` | admin can disable to stop abuse without deleting the account/data |
| `createdAt` | timestamp | system-generated | |

- **Goal:** pin down `User`'s exact shape before Identity module implementation begins — mirrors how decisions 15–18 did this for `Application` before that module was built.
- **Why this way:**
  - `passwordHash` nullable + `authProvider` as an enum (not a boolean flag) specifically to leave room for future social login without a schema-shape change later — an enum can grow new provider values, a boolean can't represent *which* provider. Social login itself is explicitly **not** being built now; this only avoids painting the schema into a corner.
  - `role` + `isActive` exist to support a lightweight admin capability, decided alongside this: an admin can disable a user's account to stop abusive behavior (e.g. spamming random `Company` rows) without deleting their data. Deliberately **not** a full SaaS/subscription/admin-dashboard layer — considered and set aside as disproportionate to this app's actual product shape (a personal tool, not multi-tenant B2B); `role`/`isActive` alone covers basic account moderation.
  - `name`/`avatar` optional and editable later, matching the profile page mentioned in the README's usage model.
  - Account linking (one user, multiple auth methods e.g. password + Google) is a real future possibility but needs a separate linked-accounts table (`userId`, `provider`, `providerAccountId`), not a field on `User` itself — out of scope until social login is actually decided.

### 26. Password hashing: Argon2id

- **Goal:** hash `passwordHash` securely, per current best practice rather than an outdated default.
- **Why this way:** Argon2id is the current OWASP-recommended default — memory-hard, resistant to GPU/ASIC cracking — over bcrypt (older, still acceptable, not the modern default) or scrypt/PBKDF2 (not recommended for new projects). Implemented via the `argon2` npm package.

### 27. Auth: access + refresh token split, with rotation and reuse detection

- **Goal:** resolve the "access/refresh token split" question decision 10 left open — reduce the blast radius of a stolen/leaked token.
- **Why this way:** decision 10 only specified a single JWT in an httpOnly cookie with no expiration strategy, so a stolen token stayed valid until it naturally expired. Fix: a short-lived access token (~15 min) plus a separately-stored, longer-lived refresh token (~30 days), both in `httpOnly`/`Secure`/`SameSite` cookies — the refresh cookie scoped to the refresh endpoint's path only. Every refresh rotates the token (the old one is invalidated, a new one issued); reuse of an already-rotated-away token is treated as a theft signal, revoking the whole token family. Chosen over the simpler single-long-lived-token approach as a deliberate complexity trade-off (needs a refresh endpoint, token-family storage, rotation/reuse-detection logic) — accepted because it demonstrates a real, recognizable pattern, per this project's "intentionally overengineer for learning" allowance.

### 28. CSRF protection: explicit double-submit token

- **Goal:** resolve the CSRF question decision 10 left open — cookie-based auth is exactly the pattern CSRF targets.
- **Why this way:** `SameSite=Strict`/`Lax` alone would handle most CSRF scenarios but isn't airtight (known edge cases). Chosen instead: an explicit double-submit CSRF token as defense-in-depth on top of `SameSite`, validated on state-changing requests.

### 29. Yarn workspaces (monorepo dependency sharing): deferred, not adopted yet

- **Goal:** avoid installing duplicate copies of tooling shared between `api/` and `frontend/` (e.g. `typescript`, `semantic-release` + plugins) across two independent `node_modules` trees.
- **Why not now:** `api/Dockerfile.prod` is already live in production with a simple, self-contained install (`api/package.json`+`api/yarn.lock` only) that took two separate failed-deploy cycles to get right. Converting to Yarn workspaces changes that install mechanism (root lockfile, `yarn workspaces focus api` instead of a plain install) for a tooling-convenience benefit, not a bug fix — real regression risk to something already stable, and it would also touch `docker-compose.yml`, CI cache paths, and both projects' lockfiles at once. The actual dependency overlap between the two stacks is smaller than it might seem, too — NestJS-specific deps (`@nestjs/*`, `prisma`, `argon2`) and frontend-specific ones (`react`, `@tanstack/*`, shadcn's ecosystem) don't overlap; the real shared surface is just `typescript` and the `semantic-release` toolchain.
- **Decision:** keep `api/` and `frontend/` as fully independent npm projects (separate `package.json`/`yarn.lock`/`node_modules` each) for now. Revisit workspaces as its own deliberately-scoped piece of work later, on its own branch, so the Docker/CI implications can be verified in isolation rather than entangled with unrelated feature work.

### 30. Repository scoping rule: a repository is only ever injected into its own domain's service

- **Goal:** fix `ApplicationsService` reaching directly into `CompanyRepository` and duplicating find-or-create logic that belongs to Company's own domain — and establish a durable rule before a second domain (`Tag`) hit the same temptation.
- **Why this way:** a repository is the data-access boundary for its own aggregate's invariants; letting another domain's service inject it directly erodes that boundary one shortcut at a time. Going forward, cross-domain access goes through that domain's *service* (`CompaniesService`, `TagsService`), never its repository.
- **Decision:** `ApplicationsService` depends on `CompaniesService` and `TagsService` only. `Company` was also physically moved into its own `src/companies/` module (previously nested under `applications/`), since it has its own identity and lifecycle independent of `Application` (a planned future admin app manages it directly) — the module boundary now matches the domain boundary that already existed conceptually.

### 31. `Tag` attributes & invariants

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | system-generated | identity |
| `name` | string | yes | normalized on write — see invariants |

- **Goal:** let users attach freeform-but-deduped labels to an `Application` (e.g. "Remote", "Dream Job") without producing duplicate rows for the same label, mirroring `Company`'s autocomplete-or-create flow exactly.
- **Why this way** (architectural invariants only):
  - No `userId` — like `Company`, `Tag` is shared/global across all users: the autocomplete flow needs one shared pool, and generic tag names aren't per-user-sensitive data that would need scoping.
  - `name` normalized the same way as `Company.name` (lowercase, then capitalize the first letter of each word) and unique after normalization.
  - `Application`↔`Tag` is an implicit many-to-many (Prisma-managed join table) — no explicit join entity, since the pairing itself carries no extra fields.
  - `Application.tagIds` is set once, at creation time, via `TagsService.findOrCreate` per given name (same silent-reuse semantics as company resolution). No endpoint exists yet to edit an existing application's tags — out of scope until a real need shows up.

### 32. Email provider: Resend

- **Goal:** send real transactional emails (password reset, signup verification) without the deliverability risk of self-hosting SMTP.
- **Why this way:** self-hosted SMTP was ruled out — a fresh domain has no sending reputation and no SPF/DKIM/DMARC history, so mail would land in spam by default. Resend's free tier (3,000/month, 100/day) comfortably covers this project's scale with a simple API. Brevo was the runner-up if a higher daily cap is ever needed. **Flagged, not yet done:** emails are currently plain text with no branded template — a shared HTML template across all transactional emails is still outstanding.

### 33. Password reset & email verification: time-limited, one-time tokens; unconditional vs. opt-in session revocation

- **Goal:** let users recover a forgotten password and verify ownership of their email, without opening an account-enumeration hole or leaving stale tokens usable indefinitely.
- **Why this way:** `PasswordResetToken` and `EmailVerificationToken` are separate entities (same shape, kept apart since they authorize different actions) — both 1-hour TTL, one-time use. `requestPasswordReset` always resolves successfully regardless of whether the email exists or is verified, specifically to avoid leaking account existence. A password **reset** unconditionally revokes every active session (the account may have been compromised); a voluntary password **change** only optionally revokes other sessions, since the user is already authenticated and the threat model is weaker. Login rejects unverified accounts, but that check happens *after* password verification — so the rejection itself can't be used to enumerate which emails have registered. A repeat registration against an existing but *unverified* email resends the verification token and updates the password/name, instead of a `ConflictException` — register doubles as "resend verification" with no extra endpoint, and `ConflictException` only fires once an account is actually verified.

### 34. Rate limiting: `@nestjs/throttler`, per-IP, tiered by endpoint — resolves decision 29 (Still open)

- **Goal:** protect the routes with real abuse cost (credential stuffing on `/login`, Resend's 100/day email quota via `/register` and `/forgot-password`) without overbuilding limits for routes that don't need them.
- **Why this way:** `ThrottlerModule` registered globally as an `APP_GUARD`, keyed per-IP (every at-risk route is pre-authentication, so there's no other identity to key on yet). Two named tiers: a 30/min default applied everywhere, and a separate hourly tier (a no-op everywhere except where explicitly overridden) applied only to `register`/`forgot-password`, since those two burn email quota specifically. `main.ts` sets `trust proxy` to `1`, since the throttler keys on `req.ip` and this app always sits behind exactly one reverse proxy — without it, every request would appear to come from the proxy's own address, collapsing all clients into one shared limit. A coarse `limit_req` baseline (10r/s, burst 20) was also added to the local nginx stack's API server block as defense-in-depth, load-tested manually (confirmed a real mix of `200`s and `503`s under concurrent load).

### 35. Observability: Axiom for backend request logging — resolves decision 29's open "Observability: strategy" item

- **Goal:** see real request traffic (method, path, status, duration) in production, including sequence-dependent bugs this project has actually hit, without adding a self-hosted logging stack.
- **Why this way:** Axiom over Better Stack/Grafana — a managed, free-tier log destination (compared against a self-hosted Grafana stack, rejected as more infra than this project's scale justifies) with a simple ingest API. Every request is logged, not just errors — the free tier's ingest volume isn't a realistic constraint here, and a full request trail helps debug sequence-dependent issues, not just failures. Known-sensitive fields (passwords, tokens) are redacted before logging regardless of status. The logging interceptor hooks the response object's native `'finish'` event rather than an RxJS `tap()` operator — NestJS doesn't finalize the real HTTP status code until *after* the interceptor's observable resolves, so `tap()` would read a stale value; `'finish'` fires once, after the response is truly sent, for both success and error paths. Sentry for frontend error tracking is designed but not yet built.

### 36. Keep-alive ping: `cron-job.org` hitting a dedicated `/health` endpoint

- **Goal:** keep Render's free-tier instance warm during likely-traffic hours, without burning a disproportionate share of the standalone repo's GitHub Actions minutes.
- **Why this way:** GitHub Actions was the original plan, but the numbers don't work for a *private* repo — a 10-minute ping across a 9-hour weekday window would consume roughly 58% of the private-repo free tier's entire 2,000-minute/month budget, risking starving the same pool used for real CI. `cron-job.org`'s free tier has no comparable metered cap. `GET /health` is a dedicated, trivial endpoint (no DB call, immediate `200`) — deliberately excluded from decision 35's request logging, since ~1,170 pings/month would bury real traffic in noise. Alerting reuses `cron-job.org`'s own built-in failure notification instead of building anything custom.

### 37. Daily DB backup: GitHub Actions + Backblaze B2, with a two-key credential split

- **Goal:** recover from a bad migration, accidental deletion, or provider-side incident — Neon's free tier only gives a 6-hour point-in-time recovery window, with no backup policy beyond that today.
- **Why this way:**
  - **GitHub Actions, not `cron-job.org`** — unlike decision 36, this runs only once/day, costing roughly 4.5% of the private-repo minutes budget, and the job needs real tooling (`pg_dump`, a storage API client) that fits a CI runner better than an external cron pinging a URL.
  - **Backblaze B2 over GitHub Actions artifacts** — B2's 10GB free tier has no forced expiration; artifacts cap at 500MB (private repos) with a hard 90-day retention ceiling regardless of configured policy. A real backup strategy shouldn't have its retention capped by the storage platform itself.
  - **`pg_dump -Fc` (custom format)** over plain SQL/directory/tar — compressed automatically, supports selective/parallel restore via `pg_restore`, and is Postgres' own documented general-purpose recommendation.
  - **Validation beyond "the file has bytes":** every run does an actual test-restore into a throwaway Postgres service container, then checks a real table has real rows — proving the backup is restorable, not just present. This is the "0" in the 3-2-1-1-0 backup rule (zero errors, verified by testing restores).
  - **Retention enforced by Backblaze itself, provisioned as code:** a 30-day lifecycle rule and a 7-day Object Lock (Governance mode) are set on the bucket via a committed script (`scripts/bootstrap-b2.sh`), not a console click — so the policy is reviewable in git, not just account state. Object Lock's 7-day window is deliberately shorter than the 30-day deletion window, since a lifecycle rule's delete attempt fails while a file is still locked.
  - **Two separate B2 keys, not one:** the daily workflow's key (stored as a GitHub Secret) is scoped to `writeFiles` only — it can upload but never delete a backup, even if leaked. The more-privileged setup key (needed to configure the bucket itself) is minted fresh each run from the account's master key, used once locally, and never stored anywhere, including CI — confirmed this key cannot also be bucket-restricted, since `writeBuckets` (needed for lifecycle rules) is explicitly disallowed on bucket-scoped keys.

### 38. Observability: Sentry for frontend error tracking

- **Goal:** catch and report render-time/unhandled JS errors in the React app — Axiom (decision 35) only covers backend request logging, nothing on the client.
- **Why this way:** scoped to error tracking only, not performance tracing or session replay — those sit on a separate, more limited free-tier quota, and this project's scale doesn't justify the added complexity yet. URLs are scrubbed of `token` values (via `beforeBreadcrumb`/`beforeSend`) before anything leaves the browser, since `/reset-password?token=...` and `/verify-email?token=...` put real, sensitive tokens directly in the URL — the same concern as decision 35's body redaction, applied client-side. Only `userId` is attached (`Sentry.setUser`), not email, since that's enough to correlate a report to a user without putting an email address into a third-party system unnecessarily. Error boundaries: one top-level safety net, plus granular per-widget boundaries on the Dashboard specifically, extending that page's existing per-widget data-loading isolation to render-time crashes too — other pages are each one cohesive concern, so a single boundary is the right granularity there.
- **Operational dependency worth flagging explicitly, since it would otherwise be easy to lose:** readable (non-minified) stack traces require source maps uploaded to Sentry via `@sentry/vite-plugin`, which needs a `SENTRY_AUTH_TOKEN` set as a build-time environment variable **on whatever platform runs the production build** — currently Vercel (decision 24). This token is deliberately never stored in any file in this repo, local or otherwise — only on Vercel itself. If this project's frontend hosting ever moves off Vercel, this token has to be re-added on the new platform, or production stack traces silently go back to unreadable minified code (the build itself still succeeds either way — the plugin is configured to skip quietly when the token is absent, not fail the build).

### 39. Personal access tokens for programmatic API access — backend, phase 1 of the browser-extension job-capture feature

- **Goal:** let a Chrome extension (scraping LinkedIn job postings) create `Application`s on a user's behalf, without extending or depending on the web session's own auth lifecycle.
- **Why this way:** PATs (random token, only the hash persisted, shown once), not shared-cookie SSO — the web app's `accessToken` cookie is a 15-minute JWT kept alive only by the frontend's own refresh-rotation dance; an extension reading that cookie would need to reimplement that dance just to stay logged in. Scoped structurally, not via a generic permissions system: `ApiTokenGuard` is wired to exactly one route (`POST /external/applications`), so a leaked token can create applications and nothing else — no `scope` field on the entity, since there's no second use case yet to justify generalizing. CSRF is skipped on that route by omission, not a special-cased bypass — CSRF protection in this codebase is opt-in per module/route already, and conceptually doesn't apply here anyway, since it defends against a browser automatically attaching *ambient* credentials (cookies) to a cross-site request, and a Bearer token set programmatically by a client is never ambient. The external endpoint reuses `ApplicationsService.create`'s existing `companyName`/`tagNames` resolution rather than duplicating company/tag find-or-create logic. Re-capturing the same job (same `externalUrl`, same user) is idempotent — returns the existing `Application` (`200`) instead of creating a duplicate (`201`) — so the extension can be used defensively (e.g. clicking capture twice by accident) without cluttering the applications list.
- **Not yet built:** the frontend token-management page (create/list/revoke) and the extension itself — both separate, later phases.

### 40. Static code scanning (Semgrep) + non-root dev containers — security hardening pass

- **Goal:** catch real vulnerability patterns in source (SAST) automatically on every PR/push, and reduce the blast radius if a running dev container were ever exploited.
- **Why this way:** Semgrep chosen over OWASP ZAP for this first pass — ZAP is dynamic analysis (attacks a *running* app), needs a live target, and an active scan against the real deployed prod carries real risk (rate-limit trips, fuzzed POST data creating junk records); Semgrep needs nothing running, just source, and has solid free rulesets (`security-audit`, `owasp-top-ten`, JS/TS). Runs via the official `semgrep/semgrep` Docker image in a new `security-scan.yml` workflow (whole repo in one pass, no per-project deps to install), with results surfaced in GitHub's built-in Security → Code Scanning tab — no Semgrep account/token needed. The first run found 44 findings across 4 real categories: GitHub Actions pinned to mutable tags, missing Yarn `npmMinimalAgeGate`, dev Dockerfiles running as root, and nginx trusting `$host` without an allow-list.
- **Triage so far:** Yarn minimal age gate (`npmMinimalAgeGate: "7d"`) added to all four `.yarnrc.yml` files, delaying resolution of newly-published package versions — mitigates a compromised-maintainer-account attack getting caught before it reaches this project. `api`/`frontend` Dockerfiles switched to the built-in non-root `node` user (confirmed host UID 1000 matches `node`'s built-in UID first, so the bind-mounted dev volumes stay writable) — the two steps that genuinely need root (`apt-get`, `corepack enable`) still run first, before the user switch. All four finding categories resolved: GitHub Actions pinned to SHAs
  (with Dependabot to keep them current), and nginx's `$host` usage
  replaced with hardcoded per-block domains plus a `map`-based allow
  list for the shared redirect block — the one remaining Semgrep
  finding on that file is a false positive (the rule can't tell the
  map's own validation input apart from an untrusted use), excluded via
  `.semgrepignore` since inline `nosemgrep` suppression doesn't take
  effect for this generic-mode rule.
- **Not yet decided:** whether/when the scan becomes a required (blocking) check on `main` — intentionally non-blocking (`continue-on-error: true`) for now, so the existing findings can be triaged without locking up every PR on day one. OWASP ZAP (dynamic scanning) deferred as a separate, later decision.

## Still open (see README `TO DO` sections for the authoritative list)

- **Domain model:** none — `Application`, `StatusChange`/`Contact`, `Company`, the state machine, and now `User` are all defined (decisions 15–18, 25).
- **Frontend:** framework/CSS/deploy target decided (decisions 22–24); FE optimization strategy still open. Group 4's auth flows and Sentry's error boundaries/scrubbing are decided (decisions 33, 38) and in progress.
- **Infrastructure:** local dev infra (nginx + containers) and public deploy target decided (decisions 23–24); local Docker Compose stack itself not yet built.
- **Deploy:** platform decided (decisions 22–24); concrete CI/CD pipeline and BE optimization still open.
- **Identity (future idea, not scoped):** possible user-level settings — currency, timezone, other locale data — raised while discussing `Application.salary`. Also: social login (decision 25's `authProvider`/nullable `passwordHash` leave room for it, but no provider is decided or being built) and account linking (needs a separate linked-accounts table, not scoped).
- **Backup credential least-privilege:** decision 37's `DATABASE_URL` currently reuses the app's full read/write connection string; a dedicated read-only Neon role would mirror the same least-privilege split already applied to the B2 keys.

## Next planned step

Backend-only work for Groups 3 (rate limiting, observability), 4 (password change, forgot password, signup email confirmation), and 6 (keep-alive ping, daily DB backup) is done (decisions 32–37), and so is Group 4's frontend. Next: finishing Group 3's Sentry integration (decision 38) — error boundaries, URL scrubbing, and source maps are designed, implementation in progress. Group 5 (social login) remains deliberately deferred until this wraps up.

---

*Keep this file in sync as we go: append a numbered decision when something new gets settled, move items out of "Still open" as they're resolved, and update "Next planned step" every time we finish one.*
