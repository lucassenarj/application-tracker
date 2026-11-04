# Application Tracker — C4 Model & Domain Diagrams

Visual companion to `DECISIONS.md` — every box and arrow below traces back to a numbered decision there. This file doesn't introduce anything new; if a diagram and `DECISIONS.md` ever disagree, `DECISIONS.md` is the source of truth and this file is stale and needs updating.

C4 covers system architecture in three zoom levels (Context → Container → Component); it doesn't cover domain entities, so those get their own two diagrams at the end (entity relations, and the state machine).

---

## Level 1 — System Context

Who uses the system, and what the system is, at the highest zoom level.

```mermaid
C4Context
    title System Context — Application Tracker

    Person(anonUser, "Anonymous user", "Tries the tracker without an account")
    Person(regUser, "Registered user", "Persists applications across devices")

    System(tracker, "Application Tracker", "Lets a job seeker log applications and track status through the hiring process")

    System_Ext(axiom, "Axiom", "Request logging (decision 35)")
    System_Ext(resend, "Resend", "Transactional email (decision 32)")
    System_Ext(cronJob, "cron-job.org", "Keep-alive pings (decision 36)")
    System_Ext(ghActions, "GitHub Actions", "Scheduled daily DB backup (decision 37)")
    System_Ext(b2, "Backblaze B2", "Backup storage (decision 37)")

    Rel(anonUser, tracker, "Uses, client-side only")
    Rel(regUser, tracker, "Uses, data persisted via API")
    Rel(tracker, axiom, "Logs every request to")
    Rel(tracker, resend, "Sends password-reset / verification emails via")
    Rel(cronJob, tracker, "Pings GET /health every 10 min, weekdays")
    Rel(ghActions, tracker, "Dumps the database directly, daily")
    Rel(ghActions, b2, "Uploads the validated dump to")
```

Job posting links (`Application.externalUrl`) are a stored string, not an integration (decision 15) — the five external systems above are all ops/infra concerns (decisions 32, 35–37), not product integrations. `GitHub Actions` connects straight to the `Database` container, bypassing the API entirely (see Container level) — it's shown against the whole system here for simplicity.

---

## Level 2 — Container

The deployable units and how they talk to each other (decisions 1, 2, 4, 13, 22).

```mermaid
C4Container
    title Container Diagram — Application Tracker

    Person(user, "User", "Anonymous or registered")

    System_Boundary(tracker, "Application Tracker") {
        Container(frontend, "Frontend", "React + Vite, TypeScript, Tailwind", "Renders the UI; stores data locally (IndexedDB) until registration. Deployed to Vercel.")
        Container(api, "Backend API", "NestJS, TypeScript", "REST API; owns the Applications and Identity bounded contexts. Deployed to Render.")
        ContainerDb(db, "Database", "PostgreSQL", "Application, Company, StatusChange, User data. Hosted on Render.")
    }

    System_Ext(axiom, "Axiom", "Request logging (decision 35)")
    System_Ext(cronJob, "cron-job.org", "Keep-alive pings (decision 36)")
    System_Ext(ghActions, "GitHub Actions", "Scheduled daily DB backup (decision 37)")
    System_Ext(b2, "Backblaze B2", "Backup storage (decision 37)")

    Rel(user, frontend, "Uses", "HTTPS, via Vercel")
    Rel(user, api, "Calls directly for API traffic", "HTTPS, via Render")
    Rel(frontend, api, "Calls", "REST/JSON")
    Rel(api, db, "Reads/writes", "Prisma")
    Rel(api, axiom, "Logs every request to (decision 35)")
    Rel(cronJob, api, "GET /health, keeps the Render instance warm")
    Rel(ghActions, db, "pg_dump -Fc directly, bypassing the API")
    Rel(ghActions, b2, "Uploads the validated dump")
```

No reverse proxy container: an earlier design used nginx as a single entry point (`domain.com` / `api.domain.com`), but decision 22 replaced self-hosting with two managed platforms — Vercel and Render — that each terminate TLS/routing for their own service. One deployable service, not microservices (decision 1): `Backend API` is a single container even though it internally splits into two bounded contexts (see Component level below). The daily backup job (decision 37) connects straight to `Database`, deliberately bypassing `Backend API` — a scheduled job dumping the whole database has no reason to go through the REST layer.

---

## Level 3 — Component (Backend API)

Zooming into the `Backend API` container (decisions 5, 6, 7, 9).

```mermaid
C4Component
    title Component Diagram — Backend API (NestJS)

    Container_Boundary(api, "Backend API") {
        Component(appsController, "ApplicationsController", "NestJS Controller", "HTTP endpoints: applications, status changes")
        Component(appsService, "ApplicationsService", "NestJS Service", "Thin orchestrator — no business rules here (decision 6)")
        Component(appDomain, "Application domain", "Aggregate + State pattern", "Application aggregate, guarded status transitions (decision 9)")
        Component(appRepo, "ApplicationRepository", "Repository", "Maps Prisma types to the Application aggregate")
        Component(companiesController, "CompaniesController", "NestJS Controller", "HTTP endpoints: companies")
        Component(companiesService, "CompaniesService", "NestJS Service", "create/findOrCreate/update/search (decision 17)")
        Component(companyRepo, "CompanyRepository", "Repository", "Find-or-create by normalized name (decision 17)")
        Component(tagsController, "TagsController", "NestJS Controller", "HTTP endpoints: tags")
        Component(tagsService, "TagsService", "NestJS Service", "create/findOrCreate/update/search (decision 31)")
        Component(tagRepo, "TagRepository", "Repository", "Find-or-create by normalized name (decision 31)")
        Component(identityController, "IdentityController", "NestJS Controller", "Register / login / password-reset / email-verification endpoints (decisions 32–33)")
        Component(identityService, "IdentityService", "NestJS Service", "Auth orchestration: JWT cookies (decision 10), password reset, email verification (decision 33)")
        Component(userRepo, "UserRepository", "Repository", "Maps Prisma types to the User aggregate")
        Component(appController, "AppController", "NestJS Controller", "GET /health — dedicated keep-alive endpoint (decision 36)")
        Component(loggingInterceptor, "LoggingInterceptor", "NestJS Interceptor, global APP_INTERCEPTOR", "Logs every request via the response's native 'finish' event, excludes /health (decision 35)")
        Component(throttlerGuard, "ThrottlerGuard", "NestJS Guard, global APP_GUARD", "Per-IP rate limiting, tiered by route (decision 34)")
        Component(prisma, "PrismaService", "Shared infra", "Hand-written wrapper around Prisma Client")
    }

    ContainerDb(db, "Database", "PostgreSQL")
    System_Ext(axiom, "Axiom", "Request logging (decision 35)")

    Rel(appsController, appsService, "Calls")
    Rel(appsService, appDomain, "Invokes")
    Rel(appsService, appRepo, "Calls")
    Rel(appsService, companiesService, "Calls (decision 30 — never the repository directly)")
    Rel(appsService, tagsService, "Calls (decision 30 — never the repository directly)")
    Rel(companiesController, companiesService, "Calls")
    Rel(companiesService, companyRepo, "Calls")
    Rel(tagsController, tagsService, "Calls")
    Rel(tagsService, tagRepo, "Calls")
    Rel(appRepo, prisma, "Uses")
    Rel(companyRepo, prisma, "Uses")
    Rel(tagRepo, prisma, "Uses")
    Rel(identityController, identityService, "Calls")
    Rel(identityService, userRepo, "Calls")
    Rel(userRepo, prisma, "Uses")
    Rel(prisma, db, "Reads / writes")
    Rel(loggingInterceptor, axiom, "Logs every request to (decision 35)")
    Rel(throttlerGuard, appsController, "Guards (and every other controller — global APP_GUARD)")
    Rel(loggingInterceptor, appsController, "Wraps (and every other controller — global APP_INTERCEPTOR)")
```

The `ApplicationsController`/`Service`/`Repository`/domain group, `Companies*`, `Tags*`, and `Identity*` are four bounded-context modules (`ApplicationsModule`, `CompaniesModule`, `TagsModule`, `IdentityModule`, decisions 7 and 30) living inside the one container — `PrismaService` is the only thing all of them share. `ApplicationsModule` imports `CompaniesModule` and `TagsModule` to reach their exported services; it never imports their repositories. `LoggingInterceptor` and `ThrottlerGuard` are cross-cutting, registered globally (`APP_INTERCEPTOR`/`APP_GUARD`) rather than per-module — the diagram only draws their relation to one controller to avoid redrawing the same arrow at every box. `AppController`'s `/health` route is deliberately outside both the Applications and Identity bounded contexts and excluded from `LoggingInterceptor` (decision 36).

---

## Domain model — entities & relations

The part C4 doesn't cover. Full field-level detail lives in `DECISIONS.md` #15–17; this is the shape, not the fields.

```mermaid
classDiagram
    class Application {
        <<Aggregate Root>>
        UUID id
        string title
        string description
        string externalUrl
        float salary
        Status currentStatus
        DateTime createdAt
    }

    class Company {
        <<Entity, shared/global>>
        UUID id
        string name
        string website
    }

    class Tag {
        <<Entity, shared/global>>
        UUID id
        string name
    }

    class StatusChange {
        <<Entity, append-only>>
        UUID id
        Status status
        Date eventDate
        string notes
        InterviewCategory interviewCategory
        DateTime createdAt
    }

    class Contact {
        <<Value Object>>
        string name
        string email
    }

    class User {
        <<Aggregate Root — Identity context>>
        UUID id
    }

    Application "many" --> "1" Company : company
    Application "many" --> "many" Tag : tags
    Application "1" --> "many" StatusChange : history
    StatusChange "1" --> "0..1" Contact : contact
    Application "many" ..> "1" User : userId reference only
```

The dashed `Application ..> User` arrow is deliberate: it's a reference (a bare `userId`), not ownership — that's the Applications/Identity bounded-context boundary from decision 7. Every solid arrow is a real in-context relationship; `Contact` has no table of its own (it's columns on `StatusChange`, decision 16).

---

## State machine — status transitions

Direct visualization of decision 18's transition table.

```mermaid
stateDiagram-v2
    [*] --> APPLIED

    APPLIED --> WAITING_FEEDBACK
    APPLIED --> ASSIGNMENT
    APPLIED --> INTERVIEW_SCHEDULED
    APPLIED --> OFFER
    APPLIED --> REJECTED

    WAITING_FEEDBACK --> WAITING_FEEDBACK
    WAITING_FEEDBACK --> ASSIGNMENT
    WAITING_FEEDBACK --> INTERVIEW_SCHEDULED
    WAITING_FEEDBACK --> OFFER
    WAITING_FEEDBACK --> REJECTED

    ASSIGNMENT --> ASSIGNMENT
    ASSIGNMENT --> WAITING_FEEDBACK
    ASSIGNMENT --> INTERVIEW_SCHEDULED
    ASSIGNMENT --> OFFER
    ASSIGNMENT --> REJECTED

    INTERVIEW_SCHEDULED --> INTERVIEW_SCHEDULED
    INTERVIEW_SCHEDULED --> WAITING_FEEDBACK
    INTERVIEW_SCHEDULED --> ASSIGNMENT
    INTERVIEW_SCHEDULED --> OFFER
    INTERVIEW_SCHEDULED --> REJECTED

    OFFER --> OFFER
    OFFER --> WAITING_FEEDBACK
    OFFER --> ASSIGNMENT
    OFFER --> INTERVIEW_SCHEDULED
    OFFER --> OFFER_ACCEPTED
    OFFER --> OFFER_DECLINED
    OFFER --> REJECTED

    OFFER_ACCEPTED --> [*]
    OFFER_DECLINED --> [*]
    REJECTED --> [*]
```

It looks like a dense mesh in the middle on purpose — `WAITING_FEEDBACK`, `ASSIGNMENT`, `INTERVIEW_SCHEDULED`, and `OFFER` (including self-loops) all connect freely to each other, because real hiring processes don't move in a strict order. The only hard rules are: `APPLIED` is never re-entered, and once you hit `REJECTED`/`OFFER_ACCEPTED`/`OFFER_DECLINED` there's nowhere left to go.

---

*Regenerate or edit these alongside `DECISIONS.md` — if a decision changes, its diagram is wrong until updated.*
