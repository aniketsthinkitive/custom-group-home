---
description: "Task list for Static Prototype (No Backend)"
---

# Tasks: Static Prototype (No Backend)

**Input**: Design documents from `specs/001-static-prototype/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mock-endpoints.md, quickstart.md

**Tests**: NOT requested (no TDD in spec). Validation is via `npm run build`, `npm run lint`, and the manual scenarios in `quickstart.md`. No automated test tasks are generated.

**Organization**: Tasks grouped by user story. The mock engine (Phase 2) is the shared blocking foundation; each story then adds its slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 (maps to spec.md user stories)
- All paths are repository-relative from `/home/ttpl-lnvl15-0262/Documents/custom group home/`

## Path Conventions

Single frontend project. New no-backend code lives under `src/mocks/`; branding constant under `src/config/`. Existing `src/sdk/`, `src/features/`, `src/store/`, `src/routes/` stay unchanged except where noted.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the mock layer and confirm the baseline builds — no new dependencies.

- [X] T001 Create the mock-layer folder structure: `src/mocks/`, `src/mocks/handlers/`, `src/mocks/seed/` (add a placeholder `src/mocks/index.ts` exporting nothing yet).
- [X] T002 Add a mock-mode constant in `src/mocks/config.ts` (e.g. `export const MOCK_ENABLED = true`) so the no-backend layer is the single switch; document that the prototype always runs with it on.
- [X] T003 [P] Capture the baseline: run `npm run build` and `npm run lint` and record current pass/fail in the PR notes (so later changes are compared against a known-good baseline).

**Checkpoint**: Empty mock scaffolding exists; build/lint baseline known.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The localStorage-backed store + axios mock adapter that EVERY user story depends on.

**⚠️ CRITICAL**: No user story can function until the adapter is wired in.

- [X] T004 Implement the localStorage store in `src/mocks/db.ts`: load `cgh.mockdb.v1` into an in-memory cache, `save()` writes back, `reset()` clears + re-seeds, version guard via `cgh.mockdb.version`; expose typed collection accessors (`db.collection('users')`, etc.) per `data-model.md`.
- [X] T005 Implement shared handler utilities in `src/mocks/handlers/_util.ts`: paginated-envelope builder (matching the SDK shape in `src/sdk/types.gen.ts`), in-memory `search`/filter/sort helpers, and `id`/`uuid`/timestamp generators.
- [X] T006 Implement the seed aggregator in `src/mocks/seed/index.ts`: `getSeedData()` returns the full `MockDB` object by combining per-domain seed modules (added in later phases); for now returns empty collections so the store initializes cleanly.
- [X] T007 Implement the route table + matcher in `src/mocks/router.ts`: normalize path (strip base/`/api`), match `METHOD + pattern` → handler, and a **fallback** (GET → empty/`{}`; POST/PUT/PATCH → echo body + generated id; DELETE → 204) per `contracts/mock-endpoints.md` so no call ever errors.
- [X] T008 Implement the custom axios adapter in `src/mocks/adapter.ts`: `(config: AxiosRequestConfig) => Promise<AxiosResponse>` that parses `method/url/params/data`, calls the router, and returns a synthetic `{ data, status, statusText, headers, config }` (or rejects with an `AxiosError`-shaped object for 401s).
- [X] T009 Wire the adapter into the SDK in `src/main.tsx`: import the exported `client` from `src/sdk/client.gen.ts` and call `client.setConfig({ adapter })` before `ReactDOM.render`. Verify (via the hey-api request passthrough) it applies to all operations; ensure no real network request is issued.
- [ ] T010 [P] Confirm transport isolation: with the adapter active, load the app and check DevTools → Network shows zero API requests to any host (the Vite proxy / `VITE_API_BASE_URL` are now unused). Note any stray `fetch`/XHR outside the SDK for follow-up.

**Checkpoint**: Any SDK call resolves locally; unhandled routes return safe fallbacks; no network traffic. Stories can now be built.

---

## Phase 3: User Story 1 - Sign in with a demo account and reach the right portal (Priority: P1) 🎯 MVP

**Goal**: Two demo accounts (Admin, Guardian) authenticate fully client-side and land on the correct portal with correct nav, no backend.

**Independent Test**: With nothing else running, sign in as Admin → `/admin` with admin nav; sign out, sign in as Guardian → `/portal/careplan` with guardian nav; wrong password → clear error, stay on login.

- [X] T011 [P] [US1] Define the two demo accounts + their user payloads and permission sets in `src/mocks/seed/accounts.ts`: Admin (`role_type: ADMIN`, all modules scope `ALL`) and Guardian (`role_type: GUARDIAN`, portal modules), with display name, `group_home`, `avatar_url` — shapes matching `accountsAuthRetrieve` in `src/sdk/types.gen.ts`.
- [X] T012 [US1] Implement auth handlers in `src/mocks/auth.ts`: `POST /accounts/login/` (validate email+password → return mock `{ access, refresh }`, set `cgh.session`), `GET /accounts/auth/` (return active demo user), `POST .../refresh/` (return new mock access token), `POST .../logout/` (clear `cgh.session`); invalid creds → 401 `{ detail }`.
- [X] T013 [US1] Register the auth routes in `src/mocks/router.ts` (login, auth-retrieve, refresh, logout) ahead of the generic resource routes.
- [X] T014 [US1] Make mock access tokens long-lived (far-future expiry) so the existing proactive-refresh logic in `src/sdk/client.gen.ts` / `src/utils/auth.ts` does not loop; verify `isAccessTokenExpired` reads the mock token without error.
- [X] T015 [US1] Serve permissions for the logged-in role so `permissionsSlice` unlocks the right nav/routes: ensure the roles/permissions endpoint(s) the app calls after login (`listRoles`/permissions) return the account's permission list from `src/mocks/seed/accounts.ts`.
- [ ] T016 [US1] Manually verify the existing role redirect (`getDefaultRedirectPath`) and guards (`RoleBasedRoute`, `ProtectedRoute`, `PermissionRoute`) route each demo account to the correct portal with the correct visible nav items.
- [X] T017 [P] [US1] Surface the demo credentials near the login UI (small helper text/hint on the login screen) so reviewers know what to enter.

**Checkpoint**: Login works for both roles, lands on the correct portal, wrong creds rejected. (Resource screens may show empty/fallback data until US2.)

---

## Phase 4: User Story 2 - Use portal functionality with no backend (Priority: P1)

**Goal**: Every tab renders realistic seeded data and every CRUD action (esp. "add user") works locally with no errors.

**Independent Test**: As Admin, visit Leads, Residents, Daily Logs, Incidents, Appointments, Settings and open detail pages — all populated, no errors; add/edit/delete a user and a record and see lists update. As Guardian, visit Care Plan, Incidents, Appointments, Documents — all populated.

**Seed modules** (realistic, fictional, cross-referenced by stable ids — reuse existing `src/constant/mockdata/*` where shape-compatible):

- [X] T018 [P] [US2] Seed group homes in `src/mocks/seed/groupHomes.ts` (~6 homes; adapt `src/constant/mockdata/groupHomes.ts`).
- [X] T019 [P] [US2] Seed users in `src/mocks/seed/users.ts` (~10 staff + guardians, varied roles/status).
- [X] T020 [P] [US2] Seed leads in `src/mocks/seed/leads.ts` (~12; adapt `src/constant/mockdata/referrals.json` where compatible).
- [X] T021 [P] [US2] Seed residents in `src/mocks/seed/residents.ts` (~10, linked to group homes).
- [X] T022 [P] [US2] Seed incidents in `src/mocks/seed/incidents.ts` (~15, linked to residents/homes).
- [X] T023 [P] [US2] Seed appointments in `src/mocks/seed/appointments.ts` (~15, linked to residents, varied dates/status).
- [X] T024 [P] [US2] Seed daily logs in `src/mocks/seed/dailyLogs.ts` (~20, linked to residents).
- [X] T025 [P] [US2] Seed documents/consent forms in `src/mocks/seed/documents.ts` (a few per resident, metadata only).
- [X] T026 [US2] Register all seed modules in `src/mocks/seed/index.ts` `getSeedData()` and bump `cgh.mockdb.version` to force a clean re-seed.

**Resource handlers** (standard list/retrieve/create/update/delete + domain actions per `contracts/mock-endpoints.md`):

- [X] T027 [P] [US2] Users handler in `src/mocks/handlers/users.ts` — list (paginated/searchable), retrieve, **create (add user)**, update, delete; this powers Settings → Users / FR-007.
- [X] T028 [P] [US2] Group homes handler in `src/mocks/handlers/groupHomes.ts` — CRUD + assignments create/destroy.
- [X] T029 [P] [US2] Leads handler in `src/mocks/handlers/leads.ts` — list/retrieve/create/update + status actions (move-out, reject, re-admit, refresh-status).
- [X] T030 [P] [US2] Residents handler in `src/mocks/handlers/residents.ts` — list/retrieve/create/update/archive + nested care plan / daily-logs reads.
- [X] T031 [P] [US2] Incidents handler in `src/mocks/handlers/incidents.ts` — CRUD + acknowledge/PM-signoff actions.
- [X] T032 [P] [US2] Appointments handler in `src/mocks/handlers/appointments.ts` — CRUD + status update + by-resident/date filters.
- [X] T033 [P] [US2] Daily logs handler in `src/mocks/handlers/dailyLogs.ts` — list + create.
- [X] T034 [P] [US2] Documents + media handler in `src/mocks/handlers/media.ts` — list/retrieve docs; stub upload/generate-upload-url/signature to resolve with a local object URL or sample asset (no remote storage).
- [X] T035 [US2] Register all resource routes in `src/mocks/router.ts` (path patterns → handlers) with the fallback last; confirm query params (`page`, `size`, `search`, `status`, `referral_source`, group-home/date filters) are honored so tables paginate/search/filter correctly.
- [X] T036 [US2] Walk every Admin and Guardian nav item + a detail page each; fix any handler whose response shape diverges from what the component expects (compare against `src/sdk/types.gen.ts`). Confirm 0 console/network errors and no infinite spinners.

**Checkpoint**: All tabs render seeded data; add/edit/delete work in-memory across modules.

---

## Phase 5: User Story 3 - Data persists across refresh, isolated per browser/device (Priority: P2)

**Goal**: Created/edited data survives full refresh and browser restart on the same browser/device; a different browser/device is independent; reset returns to seed.

**Independent Test**: Add a user → F5 (and close/reopen tab) → user still there; open in another browser → not there (own seed); trigger reset → back to seed.

- [X] T037 [US3] Audit every write path in `src/mocks/handlers/*` and `src/mocks/auth.ts` to ensure each create/update/delete calls `db.save()` so changes are persisted to `cgh.mockdb.v1` immediately (FR-009).
- [X] T038 [US3] Verify per-browser/device isolation conceptually and by test: confirm all app data is read from localStorage (no server), and document that localStorage scoping gives independent state per browser/device (spec US3 scenario 4).
- [X] T039 [US3] Implement reset-to-seed in `src/mocks/db.ts` (`reset()`) and expose it: attach `window.__resetDemo()` in `src/main.tsx` (dev/demo convenience) and/or a small "Reset demo data" affordance in Settings (FR-011).
- [X] T040 [US3] Handle storage-unavailable/quota gracefully in `src/mocks/db.ts`: wrap localStorage access in try/catch so the app still runs in private mode for the session without crashing (FR-012).
- [ ] T041 [US3] Run `quickstart.md` scenario 6 (persistence) and scenario 7 (reset); confirm both pass.

**Checkpoint**: Persistence, isolation, and reset all behave per spec.

---

## Phase 6: User Story 4 - Re-brand to "Custom Group Home" (Priority: P2)

**Goal**: No user-facing "Brett" / "CAFC" / "5280 Human Care Center" text remains; "Custom Group Home" shown in tab title, login, navbars, and brand spots.

**Independent Test**: Tab title, login screen, and both navbars show "Custom Group Home"; searching the running UI finds 0 occurrences of the old brands.

**Note**: US4 is independent of the mock layer and can run in parallel with Phases 2–5.

- [X] T042 [P] [US4] Create `src/config/branding.ts` exporting `APP_NAME = "Custom Group Home"` (+ short form / document-title helpers) as the single brand source.
- [X] T043 [P] [US4] Update `index.html`: `<title>` → "Custom Group Home" (and keep/point the favicon as-is).
- [X] T044 [P] [US4] Update admin navbar `src/components/nav-bar/CommonNavbar.tsx` (brand text ~line 293, logo `alt` ~line 270) to use `APP_NAME`.
- [X] T045 [P] [US4] Update portal navbar `src/components/nav-bar/PortalNavbar.tsx` (brand text ~line 235, logo `alt` ~line 212) to use `APP_NAME`.
- [X] T046 [P] [US4] Update auth screens to "Custom Group Home": `src/features/auth/components/LoginForm.tsx` (~line 151 "Welcome to CAFC Group"), `src/features/auth/pages/ForgotPassword.tsx` (~155), `VerifyOtpPage.tsx` (~268), `Reset-Password.tsx` (~159), and the login alt text in `LoginPage.tsx` (~79, "5280 Human Care Center").
- [X] T047 [P] [US4] Update PDF/print/form brand strings that say "CAFC" in user-facing output: `src/features/leads/components/forms/house-rules/generateHouseRulesPrintHTML.ts` (~55 `<title>CAFC House Rules`) and visible form display names in `LeadFormsTable.tsx` (~102) and `Concent&FormsTable.tsx` (~265). (Leave internal form CODE constants like `CAFC_HOUSE_RULES` unchanged unless verified to be display-only, to avoid breaking the mock form mappings.)
- [X] T048 [US4] Update `package.json` `name` from `brett-frontend` (hygiene, non-user-facing); grep the whole repo for `brett|cafc|5280` (case-insensitive, excluding `node_modules`/`dist`) to confirm no user-facing occurrence remains.

**Checkpoint**: Branding fully swapped; 0 user-facing legacy brand strings.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, cleanup, and full validation.

- [X] T049 [P] Add a short `src/mocks/README.md` explaining the adapter/db/handlers/seed design and how to add a new mocked endpoint (points back to `contracts/mock-endpoints.md`).
- [ ] T050 [P] Clean up now-dead backend config: note/remove the dev proxy + `VITE_API_BASE_URL` reliance in `vite.config.ts` / `.env.example` (the adapter makes them unused) — keep the app building.
- [X] T051 Run `npm run build` and `npm run lint`; fix any type/lint errors introduced by the mock layer or branding (Quality Gates 1–2).
- [ ] T052 Execute ALL of `quickstart.md` (scenarios 1–8) and confirm each passes — this is the feature's acceptance check against the constitution Quality Gates and spec Success Criteria.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — **BLOCKS US1, US2, US3**.
- **US1 (Phase 3)**: depends on Phase 2.
- **US2 (Phase 4)**: depends on Phase 2; best after US1 (so you can log in to view screens), but technically independent.
- **US3 (Phase 5)**: depends on Phase 2; meaningfully verifiable once at least one CRUD (US2) exists.
- **US4 (Phase 6)**: independent — can run anytime in parallel with Phases 2–5.
- **Polish (Phase 7)**: after all desired stories.

### User Story Dependencies

- **US1 (P1)**: foundation only. MVP.
- **US2 (P1)**: foundation only; pairs with US1 for a full demo.
- **US3 (P2)**: foundation; persistence is implemented in `db.ts` (Phase 2) and enforced across handlers here.
- **US4 (P2)**: fully independent (string/branding edits).

### Within Each Story

- Seed before/with handlers; handlers before route registration; route registration before the manual screen walk.

### Parallel Opportunities

- T003 (Setup) and T010 (transport check) marked [P].
- US2 seed tasks T018–T025 all [P] (different files); handlers T027–T034 all [P] (different files). Route registration (T026, T035) are single-file integration points — not parallel.
- US4 tasks T042–T047 all [P] (different files).
- **US4 can proceed in parallel with the entire mock-layer effort.**

---

## Parallel Example: User Story 2 seed + handlers

```bash
# Seed modules (all different files → parallel):
Task: "Seed group homes in src/mocks/seed/groupHomes.ts"
Task: "Seed users in src/mocks/seed/users.ts"
Task: "Seed leads in src/mocks/seed/leads.ts"
Task: "Seed residents in src/mocks/seed/residents.ts"
# ...incidents, appointments, dailyLogs, documents

# Resource handlers (all different files → parallel):
Task: "Users handler in src/mocks/handlers/users.ts"
Task: "Leads handler in src/mocks/handlers/leads.ts"
Task: "Incidents handler in src/mocks/handlers/incidents.ts"
# ...then register routes (single file, sequential) in src/mocks/router.ts
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 Setup → Phase 2 Foundation (the mock engine).
2. Phase 3 US1 (login + portals) → **STOP, validate login routing**.
3. Phase 4 US2 (seed + handlers) → **STOP, validate every tab + add user**.
4. This is the demo-able MVP: log in as either role and use the product with no backend.

### Incremental Delivery

1. Foundation ready (no screen errors via fallback).
2. + US1 → can sign in and reach portals (demo-able).
3. + US2 → full functionality with realistic data (primary demo).
4. + US3 → data survives refresh; reset available.
5. + US4 → fully re-branded. (Can be merged independently at any point.)

### Parallel Team Strategy

- One developer builds the mock engine (Phase 2) + US1/US2/US3.
- A second developer does US4 branding in parallel from the start (no dependency on the mock layer).

---

## Notes

- [P] = different files, no incomplete dependencies. Route registration files (`router.ts`, `seed/index.ts`) are shared → never marked [P].
- No automated tests requested; validate via build, lint, and `quickstart.md`.
- Keep all changes surgical (Constitution III/V): touch `src/mocks/`, `src/config/branding.ts`, `src/main.tsx`, branding strings, and `index.html` — not feature components or the generated SDK.
- Commit after each task or logical group; stop at checkpoints to validate.
