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

    Rel(anonUser, tracker, "Uses, client-side only")
    Rel(regUser, tracker, "Uses, data persisted via API")
```

No external systems appear here on purpose — the job posting link (`Application.externalUrl`) is a stored string, not an integration (decision 15).

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

    Rel(user, frontend, "Uses", "HTTPS, via Vercel")
    Rel(user, api, "Calls directly for API traffic", "HTTPS, via Render")
    Rel(frontend, api, "Calls", "REST/JSON")
    Rel(api, db, "Reads/writes", "Prisma")
```

No reverse proxy container: an earlier design used nginx as a single entry point (`domain.com` / `api.domain.com`), but decision 22 replaced self-hosting with two managed platforms — Vercel and Render — that each terminate TLS/routing for their own service. One deployable service, not microservices (decision 1): `Backend API` is a single container even though it internally splits into two bounded contexts (see Component level below).

---

## Level 3 — Component (Backend API)

Zooming into the `Backend API` container (decisions 5, 6, 7, 9).

```mermaid
C4Component
    title Component Diagram — Backend API (NestJS)

    Container_Boundary(api, "Backend API") {
        Component(appsController, "ApplicationsController", "NestJS Controller", "HTTP endpoints: applications, status changes, companies")
        Component(appsService, "ApplicationsService", "NestJS Service", "Thin orchestrator — no business rules here (decision 6)")
        Component(appDomain, "Application domain", "Aggregate + State pattern", "Application aggregate, guarded status transitions (decision 9)")
        Component(appRepo, "ApplicationRepository", "Repository", "Maps Prisma types to the Application aggregate")
        Component(companyRepo, "CompanyRepository", "Repository", "Find-or-create by normalized name (decision 17)")
        Component(identityController, "IdentityController", "NestJS Controller", "Register / login endpoints")
        Component(identityService, "IdentityService", "NestJS Service", "Auth orchestration, issues JWT cookie (decision 10)")
        Component(userRepo, "UserRepository", "Repository", "Maps Prisma types to the User aggregate")
        Component(prisma, "PrismaService", "Shared infra", "Hand-written wrapper around Prisma Client")
    }

    ContainerDb(db, "Database", "PostgreSQL")

    Rel(appsController, appsService, "Calls")
    Rel(appsService, appDomain, "Invokes")
    Rel(appsService, appRepo, "Calls")
    Rel(appsService, companyRepo, "Calls")
    Rel(appRepo, prisma, "Uses")
    Rel(companyRepo, prisma, "Uses")
    Rel(identityController, identityService, "Calls")
    Rel(identityService, userRepo, "Calls")
    Rel(userRepo, prisma, "Uses")
    Rel(prisma, db, "Reads / writes")
```

The `ApplicationsController`/`Service`/`Repository`/domain group and the `Identity*` group are the two bounded-context modules (`ApplicationsModule`, `IdentityModule`, decision 7) living inside the one container — `PrismaService` is the only thing both sides share.

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
