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

Users should be able to use the application without logging in, however, the data will only persist after registration

If the user is logged in, they can see a profile page

## Technologies
### Overview
- Project for study purposes, so it may contain overengineering.
- The goal is to learn how to work using AI as an assistant
- Learn architecture and design pattern principles

### Frontend
**TO DO:**
- Search for best strategy for the FE
- Use or not framework
- Which framework to use and why
- How to handle CSS
- How to handle optimization
- How to handle deployment

### Backend
One deployable service, not microservices - nginx (see Infrastructure) is the only gateway needed here, so a Go-style gateway-plus-services split would just add deployment/communication overhead without a matching benefit at this scale.

- **Language/framework: NestJS (TypeScript).** Chosen over Go so the app can actually be used soon (existing TS knowledge beats learning a new language while building it). NestJS's module/DI system maps naturally onto DDD bounded contexts (an `applications` module, an `identity` module) inside the single service, and its decorators (guards, interceptors, pipes) double as design-pattern practice.
- **API style: REST.** Simpler to build, test, and document than GraphQL; consistent with picking the simplest option at each fork of this project (nginx over a custom gateway, one service over microservices).
- **Storage: PostgreSQL, via Prisma.**
    - **Why Prisma over TypeORM:** TypeORM's entities are TS classes decorated directly with persistence annotations (`@Entity`, `@Column`), which makes it easy - and is the "normal" TypeORM way - to reuse that same class as the domain object. That conflates persistence with domain and only stays clean if you deliberately keep a separate domain class and map by hand every time. Prisma has no entity class at all: it generates plain, type-safe data types from a schema file, so there's nothing to be tempted to reuse as `Application`. That forces the repository-mapping boundary to happen structurally instead of by self-discipline, which fits the point of this project (practicing DDD deliberately) better. Prisma's migration workflow (`prisma migrate dev`) and end-to-end type safety are also smoother than TypeORM's, which matters given the goal of actually shipping this app soon. The trade-off: NestJS's first-party integration is with TypeORM (`@nestjs/typeorm`, `@InjectRepository`); Prisma needs a small hand-written `PrismaService` wrapper instead - a well-documented, one-time cost, not an ongoing one.
    - **Repository pattern, on top of Prisma:** one repository per aggregate root (`ApplicationRepository`, `UserRepository`). This is the layer that translates between Prisma's generated types and the domain aggregates, so Prisma never leaks into domain or service code. It also means application services can depend on a repository interface, so domain-layer unit tests can fake it - no real Postgres needed to test business logic (see Test pyramid below).
    - **Service pattern:** NestJS is Controller → Service → Repository by design, so this layer isn't optional. The important part is what does *not* go in the service: the `ApplicationsService` should stay a thin orchestrator (call the domain's state-machine logic, call the repository, maybe emit an event), while the actual transition rules live inside the domain layer itself (the `Application` aggregate / the State pattern object below). Letting the service hold the business rules instead would produce an anemic domain model - the exact anti-pattern this project is meant to practice avoiding.
- **Domain model:**
    - `Application` aggregate root — title, description, company, contact person (value object: name, email, position), current status.
    - `StatusChange` — an append-only child entity/log (status, date, notes, optional interview details like participants), rather than overwriting fields on `Application`. This is what "update status with more info" and the dashboard stats naturally derive from.
    - `User` aggregate lives in the identity module.
- **State machine:** encapsulated in the domain layer (State pattern / guarded transition value object) that validates allowed transitions (e.g. blocks `INTERVIEW → APPLIED`) - a direct application of the "implement design patterns" goal, rather than ad hoc checks in a controller/service.
- **Domain events (optional/stretch, not required for v1):** NestJS's built-in `EventEmitter`, e.g. an `ApplicationStatusChanged` event decoupling dashboard-stat recalculation from the write path (Observer pattern).
- **Listing/filtering:** query params + DB indexes on `status`/`company`, paginated.
- **Auth:** JWT in an httpOnly cookie scoped to `.domain.com`, so it's sent automatically to `api.domain.com`. CORS configured for credentials plus the explicit frontend origin. Chosen over a bearer-token-in-header approach for XSS resistance.
- **Anonymous usage:** fully client-side (IndexedDB/localStorage), no backend calls at all until the user registers. On registration, the frontend bulk-uploads the local applications to the API once, then switches to API-backed mode. Chosen over a backend "guest session" concept to avoid orphaned-guest-data cleanup and account-linking complexity.
- **Test pyramid:** unit tests on the domain layer (state machine, aggregates - no DB), integration tests on repositories (real Postgres), e2e tests on the HTTP layer.

### Infrastructure
- **nginx as reverse proxy**, acting as the single entry point: `domain.com` routes to the frontend, `api.domain.com` routes to the API service.

**TO DO:**
- Use docker container or any other orchestrator (?)
- Local infrastructure should use custom domains

### Deploy
- Constraint: prefer a cheap or free hosting option.

**TO DO:**
- Where specifically to deploy (target platform)
- How to deploy
- How to optimize FE
- How to optimize BE

### Observability
**TO DO:**
- Search for observability strategies
- Why to use
- What to use
- How to use
