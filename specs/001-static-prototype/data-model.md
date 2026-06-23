# Phase 1 Data Model: Static Prototype (No Backend)

The prototype's "database" is a single JSON object persisted in browser localStorage. Entity
**field shapes are inherited from the existing API contracts** (`src/sdk/types.gen.ts`) so the
UI consumes mock data with no changes — this document captures the *store structure, seed
strategy, and entity roles*, not a re-derivation of every field.

## Storage layout

| localStorage key | Owner | Contents |
|------------------|-------|----------|
| `cgh.mockdb.v1` | `src/mocks/db.ts` | The whole mock database (object of entity collections) |
| `cgh.mockdb.version` | `src/mocks/db.ts` | Seed/schema version, for clean re-seed on change |
| `cgh.session` | `src/mocks/auth.ts` | Active demo session → which demo user the mock token maps to |
| `userData` | `authSlice` (existing) | Logged-in user object (unchanged behavior) |
| `permissions` | `permissionsSlice` (existing) | Cached permission list (unchanged behavior) |
| `access_token` / `refresh_token` | cookies via `js-cookie` (existing) | Mock tokens (unchanged flow) |

`db.ts` loads `cgh.mockdb.v1` once into memory; every create/update/delete mutates the
in-memory object and immediately writes it back. Missing key or stale version → seed from
`src/mocks/seed/*`.

## Mock database shape (top-level collections)

```text
MockDB = {
  users:        User[]            // staff + guardians (drives Settings → Users, "add user")
  roles:        Role[]            // role definitions
  permissions:  PermissionEntry[] // module/key/scope rows used by permissionsSlice
  groupHomes:   GroupHome[]
  leads:        Lead[]
  residents:    Resident[]
  incidents:    Incident[]
  appointments: Appointment[]
  dailyLogs:    DailyLog[]
  documents:    Document[]        // consent forms / uploaded docs (metadata only)
  appointmentsByResident, documentsByResident, ... // derived via filters at read time
}
```

## Key entities

### Demo Account (auth identity)
- **Role**: the two fixed sign-ins. Not stored in `MockDB.users` necessarily; defined in
  `src/mocks/auth.ts`.
- **Fields**: `email`, `password`, `role`, `role_type` (`ADMIN` | `GUARDIAN`), `display name`,
  `group_home`, `avatar_url`, `permissions`.
- **Rules**: exactly two; Admin → full permissions (all modules, scope `ALL`); Guardian →
  portal permissions. Invalid credentials → 401-shaped error (existing UI shows the message).

### User (manageable record — the "add user" flow)
- **Represents**: staff and guardian/agent accounts shown in Settings → Users.
- **Fields** (per `types.gen.ts`): `id/uuid`, `name`/first+last, `email`, `role`/`role_type`,
  `group_home`(s), `status`, `phone`, `avatar_url`, timestamps.
- **Operations**: list (paginated/searchable), retrieve, create, update, delete — all against
  `MockDB.users`, persisted to localStorage. Demonstrates FR-007.

### Group Home
- **Represents**: a residential home; referenced by users, residents, appointments, incidents.
- **Fields**: `uuid`, `name`, `address/city`, `capacity`, assignments, status.
- **Seed**: a handful of realistic homes (reuse/trim existing `src/constant/mockdata/groupHomes.ts`).

### Lead
- **Represents**: prospective resident / referral pipeline (`/admin/leads`).
- **Fields**: `uuid`, demographics, `status`, `referral_source`, guardianship info, forms.
- **State transitions**: referral → admitted (becomes resident) / rejected / moved-out — mocked
  as status changes (`moveOutLead`, `rejectReferral`, `reAdmitLead` endpoints).
- **Seed**: reuse `src/constant/mockdata/referrals.json` where shape-compatible.

### Resident
- **Represents**: admitted individuals (`/admin/residents`, portal care plans).
- **Fields**: `id/uuid`, demographics, `group_home`, care plan, ADLs, goals, documents.
- **Relationships**: belongs to a Group Home; has Incidents, Appointments, Documents, DailyLogs.

### Incident
- **Fields**: `uuid`, `resident`, `group_home`, `type`, `severity`, `status`, `description`,
  signoff/acknowledge fields, timestamps. CRUD + acknowledge/sign-off mocked.

### Appointment
- **Fields**: `uuid`, `resident`, `group_home`, `datetime`, `type`, `status`, notes. CRUD +
  status update mocked; filterable by group home and date.

### Daily Log
- **Fields**: `uuid`, `resident`, `date`, tracking entries/observations. Create + list mocked.

### Document / Consent Form (metadata)
- **Fields**: `uuid`, `resident`, `name`, `type`, `signed`, `url`. Uploads stubbed to a local
  object URL or sample; no remote storage.

### Permission Entry
- **Fields**: `module`, `key`, `name`, `scope` (`ALL` | `ASSIGNED_HOME`).
- **Rule**: returned by the mocked roles/permissions endpoint at login so `permissionsSlice`
  unlocks the correct nav items and `PermissionRoute`s per role.

## Seed strategy

- Seed data is **fictional but realistic** and large enough that no list is empty (FR-010):
  e.g. ~6 group homes, ~10 users, ~12 leads, ~10 residents, ~15 incidents, ~15 appointments,
  ~20 daily logs, a few documents per resident.
- Cross-references use stable ids so detail pages resolve (a resident's incidents/appointments
  actually belong to that resident).
- Where existing `src/constant/mockdata/*` matches the contract shapes, reuse it; otherwise add
  new seed modules under `src/mocks/seed/`.
- Bumping `cgh.mockdb.version` forces a clean re-seed on next load (handles shape changes).

## Validation rules (mirror UI expectations)

- Required fields enforced by the existing react-hook-form + yup schemas (unchanged); the mock
  layer accepts whatever the forms submit and echoes it back with a generated id + timestamps.
- Pagination/search/filter parameters are honored in-memory so table behavior is realistic.
- Deleting a referenced entity removes it from its list; dependent views degrade gracefully
  (empty states), never error.
