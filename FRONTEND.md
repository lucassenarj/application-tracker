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

## Future work
- Richer API error handling: map specific backend error codes/messages to friendlier, structured UI messages instead of surfacing the raw backend `message` string directly. Deliberately deferred until real pages exist and we can see actual error cases worth special-casing (e.g. "email already exists" on register, "invalid credentials" on login, validation errors on the create-application form) rather than guessing at a taxonomy upfront.
- CI/CD pipeline for `frontend/`, mirroring the `api/` setup: GitHub Actions job(s) for lint/typecheck/test/build, and `semantic-release` for automated versioning/changelog/GitHub Releases, scoped to `frontend/` (own `.releaserc.json`, tag format `frontend-v${version}`, same `semantic-release-monorepo` plugin so commits touching only `api/` don't affect this version). Start the version at **0.1.0**, not 1.0.0, since the frontend isn't stable enough yet to claim a 1.0 contract — since semantic-release always infers the next version from the latest matching tag (defaulting to 1.0.0 if none exists, which is what happened for `api-v1.0.0`), this requires **manually creating an initial `frontend-v0.1.0` git tag once**, before the first automated release run, so semantic-release treats it as the baseline instead of computing its own default.
- Google Analytics tag — deliberately deferred until the frontend is otherwise fully finished (not near-term like the CI pipeline above), so analytics isn't tracking a half-built app.