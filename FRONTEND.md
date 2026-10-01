# Features
- Dashboard page where user can see an overview of his application
    - How many application the user made
    - How many are in waiting
    - How many offers
    - How many rejections
- Maybe also in the dashboard page, a list with the applications order by lasted
- Button to add a new application (open in a modal)
- If click in an application, opens a new page with details of this application
- In application details, user can update the status, a pop up should open and user can select the status and provide a description with more information about it
- If interview selected, user could choose between techinal and non techinical
- SignIn / SingUp
- Search/autocomplete on the Applications List page (company name / position)
    - Debounced input (delay the API call until the user stops typing)
    - Controlled input (React state drives the input's value, not the DOM)
    - Race-condition handling: if responses come back out of order (a slower earlier request resolving after a faster later one), make sure the UI shows the result matching the *latest* keystroke, not whichever response happens to arrive last
    - Loading state while a search request is in flight
    - Implement deliberately as a learning exercise (came up in an interview before) — understand *why* each piece is needed, not just use a library black-box


## Second phase
- Admin page
- Admins can see the list of users and how many applications the user has
- Admins can see all the companies and edit the company

## Tech stack decisions
- Routing + data fetching: TanStack Router + TanStack Query (shared ecosystem; the router's type-safe search params map directly onto the backend's `page`/`search`/`status` query params on `GET /applications`; Query handles caching + mutation-driven cache invalidation for create/change-status/update-profile)
- Forms: React Hook Form + Zod (matches shadcn/ui's own `Form` component, which is built assuming this pairing)
- Applications list layout: table (dense, fits the rule-based status state machine as a badge + action rather than a draggable card)
- Theme: shadcn/ui components (copied in as needed, not a template) + tweakcn for theming — https://tweakcn.com/
  - Shortlist of presets to check first, leaning toward a muted/professional feel rather than bright/playful (verified these slugs exist in tweakcn's own preset catalog, but pick visually via the site's own theme picker before committing — a static fetch can't confirm what actually renders):
    - Modern Minimal — https://tweakcn.com/r/themes/modern-minimal.json
    - Graphite — https://tweakcn.com/r/themes/graphite.json
    - Clean Slate — https://tweakcn.com/r/themes/clean-slate.json
    - Cosmic Night — https://tweakcn.com/r/themes/cosmic-night.json
    - Perpetuity — https://tweakcn.com/r/themes/perpetuity.json
  - These `.json` links are tweakcn's registry format — the same URL the shadcn CLI installs a theme from directly (e.g. `npx shadcn add <url>`), useful again once a theme is picked
- CI/CD: `frontend/` has its own GitHub Actions pipeline (lint/typecheck/test/build) and `semantic-release` for versioning/changelog, mirroring `api/`. First release landed as `frontend-v1.0.0` rather than the originally-planned `0.1.0` — the manual seed-tag step got missed before the first release ran, so semantic-release fell back to its own default (same thing that produced `api-v1.0.0`). Accepted as a harmless cosmetic outcome rather than rewriting shared `main` history to "fix" it; versions continue normally from here.

## Testing conventions

- **Don't special-case `/auth/csrf-token` in a `fetch` mock unless the test is actually asserting something about CSRF behavior itself** (see `lib/api-client.spec.ts`'s "CSRF handling" tests, which are the correct, deliberate use of this) or the mock's logic depends on distinguishing calls by position/count (e.g. a test tracking how many times a detail endpoint was polled). `apiFetch`'s internal `getCsrfToken()` never checks `response.ok` and just reads `.json().csrfToken` leniently — it never throws no matter what the mock returns for that URL — so in every other spec, a single blanket mock response is enough regardless of call order. The branch was previously copy-pasted into most page/component specs as reflexive boilerplate; audited and removed from the files where it wasn't pulling weight (2026-10-01).
- When a component makes more than one kind of request to the same base path (e.g. a background `GET` refetch *and* a `PATCH` submit, both to `/auth/me`), filter a mock's call list by HTTP method too, not just the URL — `fetchMock.mock.calls.find(([url]) => url.endsWith(...))` can match the wrong call.

## Future work
- Richer API error handling: map specific backend error codes/messages to friendlier, structured UI messages instead of surfacing the raw backend `message` string directly. Deliberately deferred until real pages exist and we can see actual error cases worth special-casing (e.g. "email already exists" on register, "invalid credentials" on login, validation errors on the create-application form) rather than guessing at a taxonomy upfront.
- Real browser-based e2e tests (Playwright or similar) driving the actual built app against a real backend — the frontend analog to the backend's `test:e2e` tier (which hits a real Express server + Postgres). Would automate the manual "click through it in the browser" verification we've been doing by hand for auth flows (login redirect, register auto-login, CSRF double-submit across real cookies), and catch real browser/CORS/layout behavior that component tests (jsdom + mocked fetch) can't. Deliberately deferred until there's a real end-to-end user journey worth protecting (e.g. once Dashboard/Applications List/Application Detail exist and a full "register → create an application → change its status → see it on the dashboard" flow is possible) — needs real infrastructure (a running backend + Postgres + real browser binaries), so premature while the app is still just Login/Register/a placeholder Dashboard.
- Google Analytics tag — deliberately deferred until the frontend is otherwise fully finished (not near-term like the CI pipeline above), so analytics isn't tracking a half-built app.