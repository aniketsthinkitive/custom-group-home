# Quickstart & Validation: Static Prototype (No Backend)

How to run the prototype with no backend and verify it against the constitution's Quality Gates
and the spec's Success Criteria. This is a validation guide — implementation details live in
`plan.md`, `data-model.md`, and `contracts/`, and the step-by-step work lands in `tasks.md`.

## Prerequisites

- Node + npm (project already set up; `node_modules/` present).
- **No backend, no database, no `.env` API URL required.**

## Run

```bash
npm install        # if not already installed
npm run dev        # start Vite dev server (no backend process)
# open the printed http://localhost:5173 (or configured port)
```

For a production-style static check:

```bash
npm run build      # must succeed with no type errors  → dist/
npm run preview    # serve the static build, still no backend
```

## Demo credentials

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Administrator | `admin@customgrouphome.com` | `Admin@123` | Admin portal (`/admin`) |
| Guardian | `guardian@customgrouphome.com` | `Guardian@123` | Guardian portal (`/portal/careplan`) |

(Exact values are finalized in implementation and shown near the login screen.)

## Validation scenarios (map to Quality Gates & Success Criteria)

### 1. Builds & lints (Gates 1–2)
```bash
npm run build && npm run lint
```
**Expected**: both succeed; no type errors, no new lint violations.

### 2. Runs static, no backend (Gate 3 / SC-001)
- Start `npm run dev` with nothing else running.
- Open DevTools → Network. Reload the app.
- **Expected**: no failed/pending XHR/fetch to any API host; app loads to the login screen.

### 3. Login routes by role (US1 / SC-002)
- Sign in as Administrator → land on the Admin portal with admin navigation.
- Sign out, sign in as Guardian → land on the Guardian portal with guardian navigation.
- Enter a wrong password → clear "invalid credentials" message, stay on login.
- **Expected**: correct portal each time; no network errors.

### 4. Every tab renders with data (Gate 4 / SC-003)
- As Administrator, visit each nav item: Leads, Residents, Daily Logs, Incidents,
  Appointments, Settings. Open a detail page (e.g. a resident, a lead).
- As Guardian, visit Care Plan, Incidents, Appointments, Documents.
- **Expected**: every screen renders populated demo data; no console/network errors; no infinite spinners.

### 5. CRUD works in-memory (Gate 5 / US2 / SC-004)
- Go to Settings → Users → **Add user**; submit the form.
- **Expected**: success message; the new user appears in the list immediately.
- Edit then delete a record; **Expected**: changes reflected immediately across relevant screens.

### 6. Persistence across refresh, isolated per browser (Gate 6 / US3 / SC-005)
- After adding the user above, press **F5** (full reload), and also close/reopen the tab.
- **Expected**: the added user is still present (loaded from localStorage, not re-fetched).
- Open the same URL in a **different browser** (or a private window / another machine).
- **Expected**: it starts from its own seed state — your added user is NOT there; the two
  environments are independent.
- Inspect DevTools → Application → Local Storage: keys `cgh.mockdb.v1`, `cgh.mockdb.version`
  exist; app data is in localStorage (not fetched from a server).

### 7. Reset to seed (FR-011 / SC-007)
- Trigger the demo reset (e.g. `window.__resetDemo()` in the console, or the Settings reset
  affordance) and reload.
- **Expected**: data returns to the original seeded state; app keeps working.

### 8. Branding (US4 / SC-006)
- Check the browser tab title, the login screen, and the top navbar/logo area.
- **Expected**: shows **"Custom Group Home"**; no "Brett", "CAFC", or "5280 Human Care Center"
  text remains in any user-facing surface (search the running UI to confirm 0 occurrences).

## Done = all eight scenarios pass

Each scenario maps to a constitution Quality Gate and one or more Success Criteria in `spec.md`.
When all pass, the prototype satisfies the feature.
