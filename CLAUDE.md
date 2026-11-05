# CLAUDE.md

This file is the central and mandatory guide for any coding AI working on this project. It consolidates the technical vision, architectural decisions, and development patterns already approved in `DECISIONS.md` and `C4-MODEL.md`.

Precedence rules:
- `DECISIONS.md` is the primary source of decisions and rationale.
- `C4-MODEL.md` is the system's architectural and visual view.
- `README.md` contains the current functional plan/state and what remains open.
- If there is a conflict between documents, `DECISIONS.md` takes precedence; if the architecture changes, `C4-MODEL.md` and this file must also be updated.

---

## 1. Overview & Stack

### Project purpose
A personal job application tracker:
- register an application with a title, description, external link, company, and relevant details;
- move the application through several stages throughout the recruitment process;
- capture context at each transition (interviewer, date, notes, rejection reason, interview category);
- visualize pipeline statistics.

Requires an account — there is no anonymous/local-only mode. An earlier version of this doc described a client-side-first, bulk-upload-on-registration model; that was never implemented and is dropped here rather than kept as stale intent.

### Current technical stack
- Runtime: Node.js 22
- Backend: NestJS + TypeScript
- API style: REST
- Persistence: PostgreSQL via Prisma
- Package manager: Yarn Berry (`yarn@4.18.0`, via corepack)
- Yarn linker: `nodeLinker: node-modules` to avoid known Prisma/PnP issues
- Containerization: Docker Compose for the local development environment only
- Frontend: React + Vite, TypeScript, Tailwind CSS
- Deploy: Vercel (frontend), Render (API + Postgres) — no self-hosted reverse proxy; each platform handles its own routing/TLS (see `DECISIONS.md` #22)
- Authentication: access + refresh JWT split with rotation and reuse detection, both in `httpOnly`/`Secure`/`SameSite` cookies scoped to `.application-tracker.lucassenarj.dev`; Argon2id password hashing; explicit double-submit CSRF token on state-changing requests (`DECISIONS.md` #26–28)

### Usage model
- Register or log in to use the app — every route requires an authenticated session.
- All application data is scoped to the authenticated user (`userId`); `Company` is the one shared/global entity (see decision 17).

---

## 2. Current Architecture

### High-level view
The project follows a single deployable service architecture, not microservices. Internally, however, it maintains DDD bounded contexts:
- `Applications` (applications, statuses, companies, history)
- `Identity` (user authentication/account)

There is no deploy-level separation into multiple services; the goal is to keep operational complexity low while practicing DDD and good internal boundaries.

### C4 container summary
- Frontend: React + Vite SPA, Tailwind CSS. Deployed to Vercel.
- Backend API: NestJS, TypeScript, REST. Deployed to Render.
- Database: PostgreSQL, hosted on Render.
- No reverse proxy container — Vercel and Render each terminate TLS/routing for their own service (see decision 22; `C4-MODEL.md` updated to match).

### Main backend components
- `ApplicationsController`: application area endpoints
- `ApplicationsService`: light orchestration; does not contain heavy business rules
- `Application domain`: aggregate and state machine for transitions
- `ApplicationRepository`: adapter from the aggregate to Prisma
- `CompanyRepository`: find/create by normalized company name
- `AuthController` / `AuthService`: register/login/refresh/logout, access+refresh token rotation and reuse detection, CSRF token issuance
- `UserRepository`: adapter from the user aggregate to persistence
- `PrismaService`: manual Prisma client wrapper

### Main domain model
- `Application` (aggregate root): application identity and current state
- `Company` (entity): shared/global entity to avoid duplication
- `StatusChange` (append-only entity): immutable transition history
- `Contact` (value object): name/email embedded in `StatusChange`
- `User` (aggregate root, Identity context): `email`, `passwordHash` (nullable, for future social login), `authProvider`, `name`/`avatar` (optional), `role` (`USER`/`ADMIN`), `isActive` — see `DECISIONS.md` #25

### Critical domain rules
- The current application state is not updated arbitrarily; it is derived from the latest valid `StatusChange`.
- An application can never exist without at least one initial `StatusChange` (`APPLIED`).
- `StatusChange` is immutable and append-only; it is never deleted or replaced.
- `Company.name` is normalized and must be unique after normalization.
- The `Application` context cannot depend on `User` internally; it only references `userId`.

### Status state machine
Defined states:
- `APPLIED`
- `WAITING_FEEDBACK`
- `ASSIGNMENT`
- `INTERVIEW_SCHEDULED`
- `OFFER`
- `OFFER_ACCEPTED`
- `OFFER_DECLINED`
- `REJECTED`

Main rule:
- `APPLIED` is the entry state and is never revisited.
- `OFFER_ACCEPTED`, `OFFER_DECLINED`, and `REJECTED` are terminal.
- `WAITING_FEEDBACK`, `ASSIGNMENT`, `INTERVIEW_SCHEDULED`, and `OFFER` can move freely among themselves and to `REJECTED`.
- `OFFER_ACCEPTED` and `OFFER_DECLINED` are only reachable from `OFFER`.

The interview category is `interviewCategory` on `StatusChange`, not a separate state: `TECHNICAL` or `NON_TECHNICAL`.

---

## 3. Development Rules

### 3.1. Required architectural patterns
1. Keep `Applications` and `Identity` separated as bounded contexts, even within the same service.
2. Never mix Prisma-generated types with the domain. Use repository interfaces to isolate the domain layer.
3. Business logic and transition rules must live in the domain, not in controllers/services as scattered `if` statements.
4. `ApplicationsService` must be a thin orchestrator; the real rules live in the aggregate and state machine.
5. Do not elevate the architecture into microservices without explicit need; this project is DDD-focused learning, but with low operational overhead.

### 3.2. Coding patterns and conventions
- TypeScript in NestJS, without duplicating rules across multiple layers.
- One repository per aggregate root: `ApplicationRepository`, `CompanyRepository`, `UserRepository`.
- Module structure for `applications/`:
  - `domain/` for entities, state machine, and repository interfaces
  - `infrastructure/` for Prisma implementations
  - remaining module code at the root for `controller`, `service`, and `dto`
- The `infrastructure` layer is the only one allowed to know Prisma types.
- Any change in domain modeling or transitions must also be reflected in `DECISIONS.md` and `C4-MODEL.md`.

### 3.3. Tests and TDD
- TDD is mandatory for domain and state logic.
- Pyramid priority:
  1. domain unit tests (state and aggregates)
  2. repository integration tests with real Postgres
  3. HTTP e2e tests
- Do not write business logic before first writing a test describing the behavior.
- Test variable names must be domain-specific, not generic: name the thing under test by its role (`applicationService`, `companyRepository`, not `service`/`repository`), and name entities by what they represent, not by generic result words (`newApplication`, `firstCompany`, `updatedApplication`, `foundApplication` — not `result`, `first`/`second`, `updated`, `found`). When a test needs two instances of the same type, distinguish them with a descriptive prefix rather than positional names.
- Group tests with a nested `describe` block per method under test (e.g. `describe('create', ...)`, `describe('findById', ...)` inside the outer `describe('ClassName', ...)`), so test output reads as `ClassName › methodName › behavior` and it's clear which method each test targets at a glance. Skip this nesting when a class has only one public method being tested — nothing to disambiguate.
- Keep test names terse — do not append explanatory suffixes like "never passed in" (e.g. `generates id on creation`, not `generates id on creation, never passed in`).
- Do not “mock the behavior we are trying to prove”; test the real behavior of the domain.
- When a file/component under test has multiple remaining sections or behaviors still to build, list the rest as `it.todo('...')` placeholders for the user to review before writing any of them for real — don't silently build straight through. This applies whenever a feature naturally decomposes into several similar-shaped pieces (e.g. a page with multiple sections, a service with several methods), not just when explicitly asked.
- **Mandatory mechanical check before presenting any test draft** (this has recurred repeatedly even after being written down — a vague "watch for duplication" reminder does not work, so do this literally): after writing the draft, go block by block through every `it(...)` and every `mockImplementation`/fixture-building call inside it. For each line, check whether the same line (or the same shape, e.g. a `render(<X .../>)` call or a `fetchMock.mockImplementation(() => Promise.resolve({ ok: true, json: ... }))` wrapper) already appears in another block in this same file. If it appears in 2+ blocks, extract it — into `beforeEach`/`beforeAll` for setup that doesn't vary, or into a local builder function (`renderX(overrides)`, `mockXResult(data)`) for setup that varies by one or two arguments. Do this pass as a distinct, final step after a draft feels "done," not something to hold in mind while writing. Exception: a test whose whole point is exercising the creation/save/render call itself still needs its own local, distinctly-named instance, since reusing a shared fixture would stop it from testing what it claims to.
- **Forms using `mode: 'onBlur'` + `reValidateMode: 'onChange'` with a zod resolver, whose submit button is `disabled={... || !isValid}`** (the pattern used by every auth form): a field's error only populates into `formState.errors` (and so becomes visible in the DOM) once *that specific field* has itself received a blur/change — blurring a different field does not surface it, even though `isValid` is correctly computed against the whole schema under the hood. Two consequences for tests:
  - To assert a validation-error message for field X, the test must focus-then-blur field X itself (e.g. `await user.click(fieldX); await user.tab()`, or type into it then `await user.tab()`), not just blur some other field or rely on the button's disabled state.
  - To actually submit, use the shared `submitWhenEnabled` helper (`frontend/src/test-utils/submit-when-enabled.ts`) instead of a raw `user.click(submitButton)` — a disabled button can't take focus, so clicking it is a silent no-op (no blur fires, no handler runs). Make sure the last field typed into is blurred (tab/click-away) before calling it, otherwise `isValid` may not have settled to `true` yet and the wait times out.

### 3.4. State machine rules
- Never change `currentStatus` directly in service code.
- The transition must go through a domain method that validates the rule and creates the corresponding `StatusChange`.
- Any invalid transition must be rejected explicitly and immediately.
- Change history must be append-only and immutable once written.

### 3.5. Persistence and data
- `Company` is a global entity, not per user.
- `Contact` must not become a separate table; it remains embedded in `StatusChange`.
- `StatusChange.eventDate` must not be used to define "current status"; creation order defines the current state.
- `Company.name` must be normalized before being saved.

### 3.6. Security and authentication
- Access token (~15 min) + refresh token (~30 days), both `httpOnly`/`Secure`/`SameSite` cookies — the refresh cookie scoped to the refresh endpoint's path only (`DECISIONS.md` #27).
- Every refresh rotates the token; reuse of an already-rotated-away token revokes the whole token family (theft signal).
- Passwords hashed with Argon2id (`DECISIONS.md` #26), never bcrypt/scrypt/PBKDF2 for new code.
- CSRF: explicit double-submit token (`DECISIONS.md` #28) on top of `SameSite`, required on state-changing requests (`x-csrf-token` header, fetched via `GET /auth/csrf-token`).
- Do not use `localStorage` for session tokens.
- Rate limiting is still not implemented — tracked as `BACKLOG.md`/issue #28, needed before any real production traffic.

### 3.7. Non-negotiable conventions for AI
- Keep the code simple and explicit, without unnecessary “extra architecture”.
- Do not introduce microservices, empty layers, or abstractions that do not solve a real problem.
- When a new behavior is decided, document it in the decision log and C4 model.
- Prioritize incremental evolution of the domain and applications module before creating new modules.

### 3.8. Commit message convention
- Format: `type(scope): summary` (Conventional Commits).
- `scope` is the domain/module touched (e.g. `application`, `company`, `authentication`, `ci`, `docs`) — not the project name (`application-tracker`). Commits are made from the monorepo root, and the project is already evident from the changed file paths, so a project-name scope is redundant.
- This applies going forward only; existing commit history is not being rewritten.

---

## 4. Current State and Next Steps

### What is already done
- **Backend: done for the MVP.** Applications + Identity domains fully implemented under TDD, real Prisma persistence, full CI/CD with automated releases, deployed to production (Render + Neon). See `API.md` for the endpoint reference.
- **Frontend: in progress.** Foundation, Login, Register, Dashboard, and the Applications List page are built, tested, and deployed (Vercel). See `FRONTEND.md`.

### What is still open
See `BACKLOG.md` for the full, current list of open work (mirrors the GitHub issues + project board) — don't re-derive "what's left" from this file, it goes stale fast. As of this doc's last update: remaining frontend pages (Applications search, New Application modal, Application Detail, Profile, persistent nav/logout), backend rate limiting and observability, and a handful of deferred/second-phase items.

### Concrete next step
Check `BACKLOG.md` (or the live GitHub issues) for current priority — don't assume a specific next step from this file.

---

## 5. Operational checklist for AI agents

**Never assume, never presume. Always ask, wait for an explicit yes, then act.** This applies to every file edit, not just "big" ones — proposing a plan and then immediately implementing it in the same turn is a violation even if the plan itself was correct. The sequence is always: ask/propose → wait for the user's explicit answer → only then write code. Presenting a diff is not permission to apply it; "here's the plan" is not "go ahead." If this rule is ever unclear in a specific situation, stop and ask rather than guessing which way it applies.

Before changing code, confirm:
- [ ] The change aligns with `DECISIONS.md` and the C4 model.
- [ ] The business rule belongs in the domain and is not scattered.
- [ ] A test covers the change before implementation.
- [ ] No new module or infrastructure has been created without need.
- [ ] The repository + domain + service pattern has been preserved.
- [ ] If the architecture changed, `DECISIONS.md` and `C4-MODEL.md` were updated.

After any file is created or edited in this container, run `chown -R ubuntu:ubuntu /application-tracker` (or scope it to the specific path touched) before ending the turn. Files written inside this container default to root ownership, which silently breaks host-side `git checkout`/`pull`/editor operations later — this must be done proactively, not only after the user hits a permission error.

This file is intentionally strict: prefer correctness, domain clarity, and incremental evolution over premature abstraction.

---

## 6. Known gaps
Both gaps previously listed here are resolved: CI now runs lint/typecheck/test on every PR (`api-ci.yml`/`frontend-ci.yml`), and `api/`'s `isolatedModules` gap is covered by a separate `yarn typecheck` script (`tsc --noEmit`) that CI runs independently of `yarn test`. Current gaps are tracked in `BACKLOG.md`, not here.
