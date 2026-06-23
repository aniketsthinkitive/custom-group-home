# Contract: Mock Endpoint Layer

This is the "interface" the prototype exposes internally — the contract between the generated
SDK (callers) and the **mock axios adapter** (implementer). The adapter MUST honor the same
method, URL, query params, and response shape the real backend used (per `src/sdk/types.gen.ts`)
so that callers (TanStack Query hooks, components) cannot tell the difference.

## Adapter contract

```
Input:  AxiosRequestConfig  { method, url, params/query, data, headers }
Output: Promise<AxiosResponse> resolving to { data, status, statusText, headers, config }
        or rejecting with an AxiosError carrying { response: { status, data } } for error cases
```

- The adapter is attached via `client.setConfig({ adapter })` in `src/main.tsx`.
- It MUST be fully synchronous in spirit (no real I/O), but returns Promises so async hooks work.
- It MUST never throw a network/connection error. Unmatched routes use the **fallback** below.

## Routing rules

1. Normalize the request path (strip base URL / `/api` prefix as applicable) and uppercase method.
2. Match against the route table (`src/mocks/router.ts`); first match wins.
3. Dispatch to the domain handler with `{ params (path), query, body }`.
4. If no route matches → **fallback handler**:
   - `GET` → `200` with empty collection envelope or `{}`.
   - `POST` / `PUT` / `PATCH` → `200/201` echoing the body plus generated `id/uuid` + timestamps.
   - `DELETE` → `204`/`200` success.

## Auth endpoints (handled in `src/mocks/auth.ts`)

| Method & path (pattern) | Behavior | Success response |
|-------------------------|----------|------------------|
| `POST /accounts/login/` | Validate email+password vs the 2 demo accounts | `200` `{ access, refresh }` (mock tokens) |
| `GET /accounts/auth/` | Return the active demo user for the current token | `200` user object (id, email, role, role_type, group_home, avatar_url, permissions) |
| `POST .../refresh/` | Issue a new mock access token | `200` `{ access }` |
| `POST .../logout/` | End mock session | `200/205` success |
| invalid credentials | — | `401` `{ detail: "Invalid credentials" }` (existing UI shows it) |

The Admin account's user/permissions payload grants **all modules, scope `ALL`**; the Guardian
account grants portal modules. This drives nav visibility and route guards unchanged.

## Resource endpoints (generic CRUD contract)

For each modeled domain (`leads`, `residents`, `incidents`, `appointments`, `daily-logs`/daily
tracking, `group-homes`, `users`, `roles`/`permissions`, `documents`/consent forms), the handler
implements the standard set the UI calls:

| Operation | Method & path shape | Reads/writes | Response shape |
|-----------|---------------------|--------------|----------------|
| List | `GET /<resource>/?page&size&search&<filters>` | filter+paginate `MockDB.<resource>` in memory | the existing paginated envelope (e.g. `{ count, next, previous, results }`) |
| Retrieve | `GET /<resource>/:id/` | find by id | single object |
| Create | `POST /<resource>/` | push to collection, persist | created object (with `id/uuid`, timestamps) |
| Update | `PUT`/`PATCH /<resource>/:id/` | merge fields, persist | updated object |
| Delete | `DELETE /<resource>/:id/` | remove, persist | `204`/`200` |
| Domain actions | e.g. `POST /incidents/:id/acknowledge/`, `/appointments/:id/status/`, `/leads/:id/move-out/` | mutate status/fields, persist | updated object/success |

**Invariants**:
- Every write is followed by a localStorage save (`db.save()`), so it survives refresh (FR-009).
- List filters honor the same params the tables send so search/sort/pagination feel real.
- Detail endpoints resolve cross-references seeded with stable ids (a resident's incidents are
  truly that resident's).

## Media / upload endpoints

| Pattern | Behavior |
|---------|----------|
| `POST /media/upload/`, `/media/generate-upload-url/`, signature saves | Resolve success with a local object URL or a static sample asset; store metadata only. No remote storage. |
| PDF/print generation (client-side, e.g. jsPDF/html2canvas) | Unchanged — already runs in the browser; uses mock data + "Custom Group Home" branding. |

## Non-goals (explicitly NOT contracted)

- Real authentication/authorization or token security.
- Server-side validation, rate limiting, or error taxonomies beyond what the UI displays.
- Cross-device sync or any persistence outside the current browser.
