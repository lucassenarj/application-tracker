# Application Tracker Chrome Extension

Chrome extension for [Application Tracker](../README.md), a personal portfolio project. Captures a LinkedIn job posting into Application Tracker in one click, via a Personal Access Token rather than the web session's auth. This README covers how to run, test, and work on this app specifically — for architecture decisions, see the root `README.md`'s "Chrome Extension" section and `DECISIONS.md` #39.

## Tech stack
- **React 19 + [Vite](https://vite.dev) + TypeScript**, bundled via **[@crxjs/vite-plugin](https://crxjs.dev)** for Manifest V3 support.
- **No background service worker** — the popup talks directly to the content script (`chrome.tabs.sendMessage`) and to the API, no intermediary.
- **Vitest + Testing Library** — unit and component tests.
- **oxlint** — linting.
- No shared design-system package with `frontend/` — just the color token *values* copied into `src/styles/tokens.css`, with hand-built plain form elements.

## Structure
- `src/content/` — the content script: extracts title/company/description/skills from the LinkedIn job page (JSON-LD first, DOM fallback otherwise), and responds to the popup's request for that data.
- `src/popup/` — the popup UI: shows the extracted data as an editable form before submitting.
- `src/options/` — the options page: where the Personal Access Token is pasted/stored (`chrome.storage.local`).
- `src/lib/` — cross-context logic: token storage, the API client call, and the message bridge to the content script.

## Local setup
1. Install dependencies: `yarn install`
2. Copy the env file and fill in real values: `cp .env.example .env.local`
3. Build the extension: `yarn dev` (watches and rebuilds) or `yarn build` (one-off)
4. Load it into Chrome: go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select the `dist/` folder.

## Getting a Personal Access Token
Generate one from the web app's "API Tokens" page (`frontend/`, under Settings), then paste it into the extension's options page (right-click the extension icon → Options, or use the "Open Settings" link in the popup).

## Testing
- `yarn test` — run once
- `yarn test:watch` — watch mode

## Build & type checking
- `yarn build` — type-checks and builds
- `yarn typecheck`
- `yarn lint`
