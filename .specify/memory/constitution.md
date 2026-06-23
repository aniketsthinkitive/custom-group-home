<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 2.0.0
Bump rationale: MAJOR — backward-incompatible redefinition of a NON-NEGOTIABLE
  principle. Principle II reversed from "Ephemeral In-Memory State (data lost on
  refresh, no localStorage)" to "Client-Side Persistence via Local Storage (data
  survives refresh, scoped per browser/device)", per user confirmation during
  spec 001-static-prototype.

Modified principles:
  II. Ephemeral In-Memory State (NON-NEGOTIABLE)
        → II. Client-Side Persistence via Local Storage (NON-NEGOTIABLE)

Principles unchanged in intent (minor wording aligned to new persistence model):
  I.   Frontend-Only, No Backend (NON-NEGOTIABLE)
  III. Preserve the Existing UI/UX
  IV.  Mock Data Layer Replaces APIs  (now persisted to local storage)
  V.   Simplicity & Surgical Change (YAGNI)  (browser-native storage now allowed)

Sections updated:
  - Technical Constraints (persistence rules replace "no persistence")
  - Development Workflow & Quality Gates (Ephemerality gate → Persistence gate)

Templates / dependent artifacts reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check reads this file
       dynamically; no hardcoded principles; no edit required.
  ✅ .specify/templates/spec-template.md — no constitution references; no edit required.
  ✅ .specify/templates/tasks-template.md — no constitution references; no edit required.
  ✅ .specify/templates/checklist-template.md — generic; no edit required.
  ✅ specs/001-static-prototype/spec.md — already aligned (FR-009 persistence).

Follow-up TODOs: none.
-->

# Brett-Group Home Management Constitution

This project is a **static, frontend-only** application. The UI is already built. The
mission of this constitution is to govern its conversion into a self-contained demo/static
prototype that runs entirely in the browser with **no backend and no database**, while
preserving the existing interface and behavior. Data the user creates is kept on the device
using the browser's local storage.

## Core Principles

### I. Frontend-Only, No Backend (NON-NEGOTIABLE)

The application MUST run with zero server-side dependencies. There is no backend, no
database, and no live API.

- No real network requests for application data. Outbound HTTP calls (e.g. via `axios`,
  `fetch`, TanStack Query fetchers, or generated OpenAPI clients) for app data MUST be
  removed or replaced with local, in-browser implementations.
- No reliance on environment-provided API base URLs, auth tokens, or server endpoints for
  data. The app MUST function fully when opened as a static build with no server reachable.
- Auth/session flows MUST be reduced to client-only stubs validated on the device (e.g.
  fixed demo credentials); the app MUST NOT depend on a real auth server to render or operate.

Rationale: The user has an already-built UI and explicitly wants a static prototype with no
backend. Any residual server dependency breaks the "open it and it just works" guarantee.

### II. Client-Side Persistence via Local Storage (NON-NEGOTIABLE)

All user-created and user-modified data is stored on the device in the browser's local
storage and persists across page refreshes and browser restarts.

- Actions such as "add a user", create/edit/delete records, etc. MUST update the local data
  store and be reflected immediately in the UI.
- Data MUST be saved to browser local storage so that a full page refresh or browser restart
  on the same browser/device reloads the saved data (it MUST NOT be lost on refresh, and MUST
  NOT be fetched from any server).
- Storage is inherently scoped per browser and per device. Opening the app in a different
  browser or on another machine MUST start from that environment's own independent state
  (its previously saved data, or fresh seed data if none). No data is shared across browsers
  or devices, and no server-side sync exists.
- On first load with empty storage, the app MUST initialize from a built-in seed dataset, and
  MUST provide a way to reset back to that seeded state.

Rationale: The user confirmed data must survive refresh and be saved in local storage, with
each browser/device independent. This supersedes the prior ephemeral model (v1.0.0) and makes
the prototype coherent to demo without a backend.

### III. Preserve the Existing UI/UX

The already-built UI is the source of truth. This effort removes the backend layer and adds
client-side persistence and branding changes WITHOUT redesigning the interface.

- Layouts, components, routes/tabs, styling, and user flows MUST remain visually and
  behaviorally equivalent to the current build.
- Every existing tab/route MUST continue to render and navigate without errors once the
  backend is removed.
- Changes are limited to the data layer (services, queries, store wiring), authentication
  stubs, and user-facing branding. UI components change only as much as is strictly required.

Rationale: The UI is finished and approved; the task is to make it static, not to redesign it.

### IV. Mock Data Layer Replaces APIs

Every former API interaction MUST be backed by a local data layer so the UI stays fully
functional, with reads and writes flowing through browser local storage.

- Read operations return data from the local store (seeded on first use); write operations
  (create/update/delete) mutate the local store, persist to local storage, and return
  success-shaped responses.
- The local data layer MUST preserve the data shapes the UI already expects (same
  fields/types as the prior API/OpenAPI contracts) so components require minimal change.
- Loading/empty/success states in the UI MUST continue to behave sensibly when served
  locally (the local layer may resolve synchronously or via resolved Promises).

Rationale: Replacing — rather than deleting — the data access boundary keeps the UI intact
while eliminating the backend, and is where persistence (Principle II) is applied.

### V. Simplicity & Surgical Change (YAGNI)

Prefer removing complexity over adding it.

- Do NOT add new infrastructure (no server, no production mock-server runtime, no new state
  frameworks) unless strictly required. Browser-native local storage is the sanctioned
  persistence mechanism; heavier persistence stacks (e.g. IndexedDB wrappers, external DBs)
  MUST NOT be introduced unless a concrete requirement cannot be met with local storage.
- Prefer deleting/neutralizing backend code (network clients, interceptors, env config) over
  layering new abstractions on top of it.
- Each change MUST be the minimal edit that makes a screen or action work statically.

Rationale: The goal is a lean static prototype; unnecessary scaffolding contradicts the
intent and adds maintenance burden.

## Technical Constraints

- **Stack (unchanged):** React 19, TypeScript, Vite, MUI, Redux Toolkit, React Router. These
  remain the foundation.
- **Network/data libraries:** `axios`, `@tanstack/react-query`, and `@hey-api/openapi-ts`
  generated clients MUST NOT issue real requests for app data. They may be removed, or
  retained only as thin wrappers over the local data layer.
- **Persistence:** Application data MUST be persisted in the browser's local storage, keyed so
  it is recognizable and resettable. A versioned key/seed scheme SHOULD be used so seed-data
  changes can re-initialize cleanly. No server-side or cross-device persistence exists.
- **Build/run model:** The app MUST build to static assets (`npm run build`) and run via
  `npm run dev` / `npm run preview` with no backend process.
- **No secrets/endpoints required:** The app MUST start and operate without `.env`-provided
  API URLs or credentials. Demo login credentials are defined client-side.
- **Allowed client-only utilities:** Pure client features that do not require a server (e.g.
  PDF/image export via `jspdf`/`html2canvas`, date handling via `dayjs`) may remain.

## Development Workflow & Quality Gates

Before any change set is considered complete, it MUST pass these gates:

1. **Builds:** `npm run build` succeeds with no type errors.
2. **Lints:** `npm run lint` passes (no new violations).
3. **Runs static:** `npm run dev` (or `preview`) serves the app with no backend running.
4. **Navigation gate:** Every tab/route renders and navigates without console errors or
   network failures for app data.
5. **Action gate:** Representative CRUD actions (e.g. add a user) update the UI immediately
   and succeed locally.
6. **Persistence gate:** After creating/editing data, a full page refresh (and browser
   restart) on the same browser/device reloads the saved data from local storage; opening a
   different browser/device shows its own independent state; a reset returns to the seed.

A change that fails any gate MUST be fixed before merge.

## Governance

This constitution supersedes ad-hoc practices for this project. All plans, specs, tasks, and
code changes MUST comply with the principles above; reviewers MUST verify compliance,
especially Principles I and II (no backend; local-storage persistence scoped per
browser/device).

- **Amendments** require updating this file, bumping the version per the policy below, and
  recording the change in the Sync Impact Report at the top.
- **Versioning policy (semantic):** MAJOR = backward-incompatible principle removals or
  redefinitions; MINOR = new principle/section or materially expanded guidance; PATCH =
  clarifications and wording fixes.
- **Compliance review:** Any deviation (e.g. introducing a real endpoint, or persistence that
  contradicts the local-storage model) MUST be justified in writing in the relevant plan's
  Complexity/Tracking section and is presumed rejected unless it is the only way to meet an
  explicit requirement.

**Version**: 2.0.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
