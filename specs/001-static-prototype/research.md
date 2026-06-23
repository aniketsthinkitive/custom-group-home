# Phase 0 Research: Static Prototype (No Backend)

This document records the key technical decisions for removing the backend and replacing it
with a localStorage-backed mock layer, with rationale and rejected alternatives. There are no
remaining NEEDS CLARIFICATION items (the persistence question was resolved in the spec).

## Decision 1 — Interception point: custom axios adapter at the SDK client

**Decision**: Inject a custom **axios adapter** into the generated hey-api client via
`client.setConfig({ adapter })` in `src/main.tsx`, before the app renders. The adapter
receives each `AxiosRequestConfig`, matches `method + url` to a handler, and returns a
synthetic `AxiosResponse` built from the localStorage store.

**Rationale**:
- The entire app funnels data through one axios instance in `src/sdk/client.gen.ts`. The
  hey-api `request()` spreads its config into every `_axios({ ... })` call
  (`src/sdk/client/client.gen.ts`), so an `adapter` set via `setConfig` propagates to **all
  ~99 operations** automatically.
- Hooks (`useQuery`/`useMutation`), generated `queryOptions`/`mutationOptions`, components,
  Redux, and cookie handling all stay byte-for-byte unchanged → satisfies Constitution
  Principle III (preserve UI) and V (surgical change).
- Existing request/response interceptors (auth header, refresh) still run; the adapter just
  replaces the network transport, so the auth lifecycle keeps working with mock tokens.

**Alternatives considered**:
- *Re-implement the 99 SDK functions* (`sdk.gen.ts`) with localStorage bodies — rejected:
  large surface area, fights the generator, more code to maintain (violates V).
- *Replace TanStack Query hooks per feature* — rejected: touches dozens of feature files
  (violates III), high risk of UI regressions.
- *MSW (Mock Service Worker)* — rejected: adds a dependency and a service-worker runtime in
  production builds (violates V "no new infrastructure"); the adapter is lighter and needs
  no new package. (MSW remains available as a dev-only option but is not used for the
  prototype runtime.)
- *Edit the generated `axiosInstance` to set `adapter`* — viable fallback, but editing
  generated files is less clean than `setConfig`; kept as a backup only.

## Decision 2 — Persistence model & store shape

**Decision**: A single versioned localStorage entry holds the whole mock database, e.g. key
`cgh.mockdb.v1` → JSON `{ leads: [...], residents: [...], incidents: [...], ... }`. A thin
`db.ts` module loads it once into memory, exposes typed collection accessors, and writes back
to localStorage after every mutation. A separate `cgh.mockdb.version` guards seed migrations.

**Rationale**:
- Meets Principle II: survives refresh, persists per browser/device, reset-able to seed.
- One key + in-memory cache keeps reads instant and writes simple; versioning lets seed-data
  changes re-initialize cleanly without stale shapes.
- `userData` and `permissions` already persist to localStorage today (authSlice /
  permissionsSlice) — the mock store sits alongside them, no conflict.

**Alternatives considered**:
- *One localStorage key per entity* — rejected: more bookkeeping, harder atomic reset.
- *IndexedDB* — rejected: heavier API for no benefit at this data scale (violates V).
- *In-memory only* — rejected: contradicts the confirmed "survive refresh" requirement.

**Reset & seeding**: On startup, if the store key is missing or its version is older than the
bundled seed version, `db.ts` initializes from `src/mocks/seed/*`. A `resetMockDb()` helper
(exposed e.g. on `window.__resetDemo()` and/or a small Settings affordance) clears the key and
re-seeds, satisfying FR-011.

## Decision 3 — Client-side authentication & the two demo accounts

**Decision**: The adapter handles the auth endpoints locally:
- `POST /accounts/login/` → validates email+password against two in-code demo accounts;
  on match, returns mock `access`/`refresh` tokens (opaque strings) so the existing cookie
  logic in `client.gen.ts` / `utils/auth.ts` proceeds unchanged.
- `GET /accounts/auth/` (`accountsAuthRetrieve`) → returns the demo user object matching the
  active mock token (id, email, role, role_type, group_home, avatar_url, permissions).
- `POST /refresh/` → returns a fresh mock access token (never fails for valid demo session).
- `logout` → succeeds; Redux/cookies cleared by existing code.

Demo accounts (final values set in implementation; documented near the login screen):

| Role | role_type | Email | Password | Lands on |
|------|-----------|-------|----------|----------|
| Administrator | `ADMIN` | `admin@customgrouphome.com` | `Admin@123` | `/admin` |
| Guardian | `GUARDIAN` | `guardian@customgrouphome.com` | `Guardian@123` | `/portal/careplan` |

**Rationale**:
- Reuses the existing role-based redirect (`getDefaultRedirectPath`) and route guards
  (`RoleBasedRoute`, `ProtectedRoute`, `PermissionRoute`) with zero routing changes.
- The Admin account must return a **full permission set** (all modules, scope `ALL`) so every
  admin nav item and `PermissionRoute` renders; the Guardian account returns portal-
  appropriate permissions. Permissions are served by the mocked roles/permissions endpoint and
  cached by `permissionsSlice` as today.

**Alternatives considered**:
- *Bypass auth entirely / auto-login* — rejected: the spec explicitly wants a login step with
  two credentials and correct portal routing per role (FR-003..FR-006).
- *Real password hashing* — rejected: out of scope; this is a prototype (no security claims).

## Decision 4 — Endpoint coverage strategy

**Decision**: Fully model the endpoints the UI actually calls (derivable from the generated
`queryKeys`/usage: leads, residents, incidents, appointments, daily logs, group homes, users,
roles/permissions, auth, media/upload). Provide a **safe fallback** in the router for any
unhandled operation: GET → empty list/`{}` with 200; POST/PUT/PATCH/DELETE → echo a
success-shaped object with a generated id. This guarantees "no screen errors" (FR-002, FR-008)
even for rarely used endpoints.

**Rationale**: Focuses effort on visible flows while preventing any unexpected call from
producing a backend/connection error. Aligns with V (don't model what the UI never hits).

**Open implementation note**: File/media uploads (`mediaUploadCreate`, signatures, PDFs) are
stubbed to resolve with a local object URL or a static sample, so upload UIs don't error.
Real remote storage is out of scope (per spec Assumptions).

## Decision 5 — Pagination, filtering & response shapes

**Decision**: Handlers read the same query params the tables send (`page`, `size`, `search`,
`status`, `referral_source`, group-home filters, date ranges) and return the **paginated
envelope shape the components already expect** (mirroring `types.gen.ts` — typically
`{ count, next, previous, results }` or the project's equivalent, confirmed per endpoint during
implementation). Sorting/filtering/searching are applied in-memory over the seeded arrays.

**Rationale**: Tables like `LeadsTableWithPagination` and `UsersTableWithPagination` rely on
server-shaped pages; matching the shape keeps pagination, search, and filters working without
component changes (III, IV).

## Decision 6 — Branding replacement → "Custom Group Home"

**Decision**: Introduce `src/config/branding.ts` exporting `APP_NAME = "Custom Group Home"`
(plus short forms / document titles), and replace the hardcoded brand strings found in the
audit with references to it (or direct string edits where a constant is overkill, e.g.
`index.html`). Scope includes: `index.html` `<title>`; navbar brand text in `CommonNavbar.tsx`
and `PortalNavbar.tsx`; login/auth headings (`LoginForm.tsx`, `ForgotPassword.tsx`,
`VerifyOtpPage.tsx`, `Reset-Password.tsx`); logo `alt` text; and PDF/print/form titles that
currently say "CAFC". `package.json` `name` is updated for hygiene (not user-facing).

**Rationale**: The user asked to show the project name "Custom Group Home" instead of "Brett"
everywhere. The audit found the live brand is actually "CAFC" (and a stray "5280 Human Care
Center"); treating all of these as the brand to replace fulfills "everywhere" (FR-013, FR-014).

**Logo asset**: `src/assets/images/logo.svg` is kept as the graphic. If it embeds the old brand
text, it is swapped for a "Custom Group Home" treatment; otherwise only the surrounding name
text changes. Replacing the SVG artwork itself is optional and can be a follow-up.

## Resolved unknowns summary

| Unknown | Resolution |
|---------|-----------|
| How to intercept without touching features | axios `adapter` via `client.setConfig()` in `main.tsx` |
| Where data lives & survives refresh | versioned single-key localStorage store (`db.ts`) |
| Login with two roles → correct portal | mock auth endpoints + existing role redirect/guards |
| Avoiding errors on unused endpoints | router fallback (empty/success shapes) |
| Keeping tables/pagination working | return existing paginated envelope shapes |
| What "remove Brett everywhere" means | replace Brett/CAFC/5280 user-facing strings → "Custom Group Home" |
