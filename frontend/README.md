# Application Tracker Frontend

Frontend for [Application Tracker](../README.md), a personal portfolio project. This README covers how to run, test, and work on this app specifically — for architecture decisions, see the root `README.md` and `DECISIONS.md`.

## Tech stack
- **React 19 + [Vite](https://vite.dev) + TypeScript.**
- **[TanStack Router](https://tanstack.com/router)** — file-based routing with automatic per-route code splitting, plus **[TanStack Query](https://tanstack.com/query)** for server state.
- **[React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)** — schema-validated forms that validate live (`onBlur`/`onChange`) and block submission while any error exists, rather than only surfacing errors after a submit attempt.
- **Tailwind CSS v4 + [base-ui](https://base-ui.com)** — component primitives generated via `shadcn`.
- **[@sentry/react](https://sentry.io)** — crash/error tracking: URL query-param scrubbing before events are sent, a top-level error boundary plus granular per-widget boundaries on the Dashboard.
- **Google Analytics (GA4)** — consent-gated, no-ops entirely until a Measurement ID is configured.
- **Vitest + Testing Library** — component and route-level tests.

## Structure
- `components/` — shared UI components.
- `pages/` — page-level components.
- `routes/` — TanStack Router route definitions (file-based, auto code-split).
- `lib/` — domain logic: API client, auth schemas/mutations, analytics, Sentry setup.
- `hooks/` — shared React hooks.
- `test-utils/` — shared test helpers (`renderWithRouter`, `buildRouteTree`, `submitWhenEnabled`).

## Local setup
This app is normally run as part of the root Docker Compose stack — see the root `README.md`'s "Running the stack" section. To run it on its own instead:

1. Install dependencies: `yarn install`
2. Copy the env file and fill in real values: `cp .env.example .env.local`
3. Start the dev server: `yarn dev`

## Testing
- `yarn test` — run once
- `yarn test:watch` — watch mode

## Build & type checking
- `yarn build` — regenerates routes, type-checks, and builds
- `yarn typecheck`
- `yarn lint`
