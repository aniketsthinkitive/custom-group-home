# Mock Layer (No-Backend Prototype)

This directory makes the app run with **no backend**. Every API request is served locally from
a **localStorage-backed store** via a custom axios adapter. Nothing above the SDK boundary
(hooks, components, Redux, cookies) was changed. See
`specs/001-static-prototype/` for the full spec/plan/contract.

## How it wires up

`src/main.tsx` calls `installMocks()` (from `./index.ts`) before render. That:

1. Attaches `mockAdapter` to the generated SDK client via `client.setConfig({ adapter })`
   — hey-api applies it to the client's axios instance, so all ~99 operations are intercepted.
2. Seeds the store on first run.
3. Exposes `window.__resetDemo()` to reset the prototype to its seeded state.

## Files

| File | Role |
|------|------|
| `config.ts` | `MOCK_ENABLED` switch, localStorage keys, `SEED_VERSION`. |
| `jwt.ts` | Builds a JWT-shaped mock token with a far-future `exp` (keeps `utils/auth` happy). |
| `envelope.ts` | Response shapers. List uses a **superset** envelope (DRF `{count,results}` **and** `{data:{results,pagination}}`). |
| `db.ts` | Load/save/reset the store; in-memory cache; graceful when storage is unavailable. |
| `seed/index.ts` | Entity seed data (`getSeedData()` → the whole `MockDB`). |
| `seed/accounts.ts` | The two demo accounts (Admin / Guardian) + their permission sets. |
| `auth.ts` | login / auth-retrieve / refresh / logout handlers (set cookies + session). |
| `router.ts` | Maps method+path → handler: auth, generic CRUD, nested, actions, fallback. |
| `adapter.ts` | The axios adapter: parse config → route → synthetic `AxiosResponse` (or reject for ≥400). |
| `index.ts` | `installMocks()` entry point. |

## Adding / fixing a mocked endpoint

Most endpoints are handled generically by `router.ts`:

- **List** `GET /<resource>/` → paginated, searchable, filterable from `db.collection(<resource>)`.
- **CRUD** `GET/POST/PUT/PATCH/DELETE /<resource>/[:id]/` → read/write the collection (persisted).
- **Nested** `/<resource>/:id/<sub>/` → sub-list/sub-create, or an action on the parent item.
- **Fallback** → any unmatched route returns a safe empty/success shape (never errors).

To customize a specific endpoint (e.g. a bespoke response shape a screen needs):

1. Map the path segment to a collection in `COLLECTION_MAP` (router.ts), or
2. Add an explicit branch in `routeRequest()` before the generic resource handling, returning
   `{ status, data }` in the exact shape the screen expects (compare `src/sdk/types.gen.ts`).
3. Add/adjust seed data in `seed/index.ts`. Bump `SEED_VERSION` in `config.ts` to force a
   clean re-seed in existing browsers.

See `specs/001-static-prototype/contracts/mock-endpoints.md` for the full contract.
