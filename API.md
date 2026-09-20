# API Reference

Base URL (local): `https://local.api.application-tracker.lucassenarj.dev`
Base URL (production): `https://api.application-tracker.lucassenarj.dev`

## Auth (`/auth`)

No auth guard required except `/auth/me`, which needs a valid `accessToken` cookie. Some routes are CSRF-protected (see below).

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password }` | Returns the created user (no `passwordHash`) |
| POST | `/auth/login` | `{ email, password }` | Returns the user; sets `accessToken`/`refreshToken` httpOnly cookies |
| POST | `/auth/refresh` | — (reads `refreshToken` cookie) | **CSRF-protected**; rotates both cookies |
| POST | `/auth/logout` | — (reads `refreshToken` cookie) | **CSRF-protected**; clears all cookies |
| GET | `/auth/csrf-token` | — | Returns `{ csrfToken }`; sets the signed CSRF cookie |
| GET | `/auth/me` | — | Requires `accessToken` cookie; returns the authenticated user's profile |
| PATCH | `/auth/me` | `{ name?, avatar? }` | Requires `accessToken` cookie; **CSRF-protected** |

## Applications (`/applications`)

All routes require a valid `accessToken` cookie (set by `/auth/login` or `/auth/refresh`).

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/applications` | `{ title, companyName, description?, externalUrl?, salary? }` | **CSRF-protected** |
| GET | `/applications/stats` | — | Returns `{ total, inProgress, offers, rejections }` counts for the authenticated user, bucketed from the raw `ApplicationStatus` values. Backs the dashboard's summary cards |
| GET | `/applications` | — | Only the authenticated user's applications. Query params: `page` (default 1), `pageSize` (default 10), `search` (full-text, matches title or company name, prefix-matching), `status` (exact match) |
| GET | `/applications/:id` | — | 404 if the application belongs to a different user (not 403 — avoids confirming existence) |
| PATCH | `/applications/:id/status` | `{ status, eventDate, notes?, contactName?, contactEmail?, interviewCategory? }` | **CSRF-protected** |

## Companies (`/companies`)

All routes require a valid `accessToken` cookie.

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/companies/search` | — | Query param `q` (required). Full-text, prefix-matching; capped at 10 results. Meant for the create-application autocomplete, so a new application can reuse an existing company instead of creating a near-duplicate |

## Testing flow (e.g. via Postman)

1. `POST /auth/register` (or skip if already registered)
2. `POST /auth/login` — grabs `accessToken`/`refreshToken` cookies
3. `GET /auth/csrf-token` — grabs the CSRF cookie and returns the plain token in the response body
4. For any `POST`/`PATCH` call above marked CSRF-protected, set header `x-csrf-token: <value from step 3>`
