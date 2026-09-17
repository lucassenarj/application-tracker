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
- visualize pipeline statistics;
- initially work in anonymous client-side mode, with useful functionality without requiring sign-up.

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
- Authentication: JWT in an `httpOnly` cookie, scoped to the parent domain (`.domain.com`) for API usage

### Usage model
- An anonymous user can use the tracker locally on the client.
- When the user registers, the frontend bulk uploads local applications to the API.
- The backend data layer only receives applications from authenticated users.

---

## 2. Current Architecture

### High-level view
The project follows a single deployable service architecture, not microservices. Internally, however, it maintains DDD bounded contexts:
- `Applications` (applications, statuses, companies, history)
- `Identity` (user authentication/account)

There is no deploy-level separation into multiple services; the goal is to keep operational complexity low while practicing DDD and good internal boundaries.

### C4 container summary
- Frontend: React + Vite SPA, Tailwind CSS, stores data locally until registration. Deployed to Vercel.
- Backend API: NestJS, TypeScript, REST. Deployed to Render.
- Database: PostgreSQL, hosted on Render.
- No reverse proxy container — Vercel and Render each terminate TLS/routing for their own service (see decision 22; `C4-MODEL.md` updated to match).

### Main backend components
- `ApplicationsController`: application area endpoints
- `ApplicationsService`: light orchestration; does not contain heavy business rules
- `Application domain`: aggregate and state machine for transitions
- `ApplicationRepository`: adapter from the aggregate to Prisma
- `CompanyRepository`: find/create by normalized company name
- `IdentityController` / `IdentityService`: authentication and registration
- `UserRepository`: adapter from the user aggregate to persistence
- `PrismaService`: manual Prisma client wrapper

### Main domain model
- `Application` (aggregate root): application identity and current state
- `Company` (entity): shared/global entity to avoid duplication
- `StatusChange` (append-only entity): immutable transition history
- `Contact` (value object): name/email embedded in `StatusChange`
- `User`: outside the applications context; lives in the Identity bounded context

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
- Authentication via JWT in an `httpOnly` cookie.
- Do not use `localStorage` for session tokens.
- The current approach is a simple authentication model; the split between access/refresh tokens and the CSRF strategy have not yet been decided.
- Any production-relevant adjustment must consider rate limiting and CSRF protection.

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
- Clear product definition and context.
- Architecture decisions consolidated in `DECISIONS.md`.
- C4 model with context, container, component, and domain diagrams.
- Domain model and transition rules defined.
- NestJS backend scaffold in `api/`.
- Dev-container and Docker setup configured in `docker-compose.yml`.
- Runtime updated to Node.js 22 and Yarn Berry.

### What is still open
- Frontend build-out (framework/CSS/deploy target decided — decision 22; the actual UI is not built yet).
- Deployment: concrete CI/CD pipeline, FE/BE optimization.
- Observability — when tackled, decide on a real logging service (structured logs, persisted/shipped somewhere), distinct from Nest's default console `Logger`. Also revisit whether uncaught domain errors (e.g. invalid status transitions) should stay as plain `Error`s relying on Nest's default global exception handling (logs full detail server-side, returns a generic 500 to the client — already safe as-is) or get explicit handling for more specific/curated client-facing messages.
- Identity module implementation. `User` attributes and the full auth strategy (Argon2id password hashing, access/refresh tokens with rotation + reuse detection, CSRF double-submit token) are now decided — see `DECISIONS.md` #25–28 — but no code exists yet (`User` domain entity, Prisma schema, `UserRepository`, `AuthService`/`AuthController`). `ApplicationsController` currently uses a hardcoded `PLACEHOLDER_USER_ID` constant in place of an authenticated user's id — replace with the real session/JWT-derived user id once this lands.
- HTTP e2e tests for `applications` — the controller is wired (create/findAll/findOne/changeStatus all delegate to the now-fully-implemented `ApplicationsService`) but has no dedicated tests of its own yet, deliberately deferred per the test pyramid (tier 3, and the controller itself has no real logic beyond DTO-to-service mapping).
- Rate limiting.

### Immediate functionality to develop
The immediate priority is the implementation of the applications module with TDD for the state machine:
1. write unit tests for `Application` transitions / state machine behavior;
2. validate transition rules and terminal states;
3. implement domain logic without coupling it to the persistence layer;
4. connect Prisma repositories and REST endpoints for the `applications` module;
5. only then move on to authentication and more complete identity work.

### Concrete next step recommended
- Start with the `Application` domain and state machine.
- Do not start the frontend or auth before the status logic is covered by tests.
- Once the rules are stable, move on to Prisma schema creation and repository implementation.

### Project status (executive summary)
The project is in the domain and backend foundation phase, with architecture defined and the codebase scaffolded. The next relevant technical milestone is the TDD cycle for application status transitions, which is the backbone of the core product behavior.

---

## 5. Operational checklist for AI agents

Before changing code, confirm:
- [ ] The change aligns with `DECISIONS.md` and the C4 model.
- [ ] The business rule belongs in the domain and is not scattered.
- [ ] A test covers the change before implementation.
- [ ] No new module or infrastructure has been created without need.
- [ ] The repository + domain + service pattern has been preserved.
- [ ] If the architecture changed, `DECISIONS.md` and `C4-MODEL.md` were updated.

This file is intentionally strict: prefer correctness, domain clarity, and incremental evolution over premature abstraction.

---

## 6. Known gaps (as of 2026-08-18)
- No CI gate yet: nothing automatically runs lint/typecheck/tests before a commit lands.
  Until a pre-commit hook or CI workflow exists, manually run `yarn lint`, `npx tsc --noEmit`,
  and `yarn test` before considering work commit-ready.
- `tsconfig.json` has `isolatedModules: true`, so `yarn test` (ts-jest) never runs the
  TypeScript type checker — a typo in a `.spec.ts` file's typed literals can silently pass
  as if it were valid. Run `npx tsc --noEmit` separately to catch this class of bug.
