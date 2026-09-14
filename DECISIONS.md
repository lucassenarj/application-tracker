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

## Still open (see README `TO DO` sections for the authoritative list)

- **Domain model:** none — `Application`, `StatusChange`/`Contact`, `Company`, and the state machine are all defined (decisions 15–18).
- **Frontend:** framework/CSS/deploy target decided (decisions 22–24, this week); FE optimization strategy still open.
- **Infrastructure:** local dev infra (nginx + containers) and public deploy target decided (decisions 23–24, this week); local Docker Compose stack itself not yet built.
- **Deploy:** platform decided (decisions 22–24, this week); concrete CI/CD pipeline and BE optimization still open.
- **Observability:** strategy — why, what, how.
- **Identity (future idea, not scoped):** possible user-level settings — currency, timezone, other locale data — raised while discussing `Application.salary`.
- **Auth: access/refresh token split.** Decision 10 only specifies a single JWT in an httpOnly cookie. A stolen token currently stays valid until it naturally expires — the standard mitigation is a short-lived access token plus a separately revocable long-lived refresh token. Not yet decided whether to adopt that split.
- **CSRF protection.** Decision 10's cookie-based auth is exactly the pattern CSRF targets (a malicious site tricking a logged-in user's browser into firing a request using their session cookie). No CSRF-token strategy decided yet.
- **Rate limiting.** No decision yet on limits per user/IP/endpoint, or overall — needed before this goes anywhere near production.

## Next planned step

`Application` aggregate construction/invariants implemented under TDD (see `application.ts`/`.spec.ts`). Domain skeleton (StatusChange/Contact, Company, repository interfaces, service/controller shells, DTOs) in place. Domain scheme, local dev infra, and phase-1 public deploy target decided (decisions 23–24). Next: build the local Docker Compose stack (nginx + api + frontend + db containers, mkcert TLS) per decision 23, even though the frontend/API aren't functional yet — deliberately built ahead so there's a working local rehearsal environment ready as soon as they are.

---

*Keep this file in sync as we go: append a numbered decision when something new gets settled, move items out of "Still open" as they're resolved, and update "Next planned step" every time we finish one.*
