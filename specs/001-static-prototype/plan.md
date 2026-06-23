# Implementation Plan: Static Prototype (No Backend)

**Branch**: `001-static-prototype` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-static-prototype/spec.md`

## Summary

Convert the existing **Brett/CAFC Group Home Management** React app into a **self-contained, no-backend prototype**. The UI, routes, Redux store, TanStack Query hooks, and the generated hey-api SDK all stay in place. The single change to the data path is a **custom axios adapter** injected into the generated client at app startup: it intercepts every request, routes it by method + URL to an in-browser handler, and reads/writes a **localStorage-backed mock store** that is seeded on first load and persists across refresh (scoped per browser/device). Two fixed demo accounts (Administrator, Guardian) authenticate entirely client-side and drive the existing role-based routing. Finally, all user-facing brand strings ("Brett", "CAFC", "5280 Human Care Center") are replaced with **"Custom Group Home"**.

**Technical approach (one line):** intercept at the lowest shared chokepoint (the SDK's axios instance) so nothing above it — hooks, components, store, cookies — has to change.

## Technical Context

**Language/Version**: TypeScript ~5.9, React 19, built with Vite 7

**Primary Dependencies**: React 19, MUI 7, Redux Toolkit 2, React Router 7, TanStack Query 5, axios 1.x, `@hey-api/openapi-ts` generated SDK (`src/sdk/`), js-cookie, react-hook-form + yup, dayjs

**Storage**: Browser **localStorage** (client-side mock database + auth artifacts). No server, no DB. Scoped per browser/device; no cross-device sync.

**Testing**: Vitest + Testing Library (already present); plus manual `quickstart.md` validation against the Quality Gates.

**Target Platform**: Modern evergreen browsers; deployable as a static bundle (`npm run build` → `dist/`, served by any static host / the existing `nginx.conf`).

**Project Type**: Single-page web application, **frontend only** (no backend tier).

**Performance Goals**: All data operations resolve locally and feel instant (perceived < 50ms); no loading state ever blocks on a network call.

**Constraints**: No backend/API/database at runtime; offline-capable; existing UI/UX, layouts, routes, and flows preserved (surgical change only); created/edited data persists across page refresh on the same browser/device.

**Scale/Scope**: 2 portals (Admin, Guardian), ~10 feature modules, ~25 routes, ~99 SDK operations (only the subset exercised by the UI must be fully modeled; the rest get safe fallbacks), 2 demo accounts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` **v2.0.0**:

| Principle | Plan compliance | Status |
|-----------|-----------------|--------|
| **I. Frontend-Only, No Backend** (NON-NEGOTIABLE) | Mock axios adapter returns all data locally; no request reaches the network. Auth (login/refresh/retrieve) is handled by the adapter. `VITE_API_BASE_URL` becomes unused. | ✅ PASS |
| **II. Client-Side Persistence via Local Storage** (NON-NEGOTIABLE) | All entities live in a versioned localStorage store, seeded on first load, persisted on every write, reset-able to seed. Survives refresh; independent per browser/device. | ✅ PASS |
| **III. Preserve the Existing UI/UX** | No changes to feature components, routes, layouts, or styling. Adapter injected at the SDK boundary; hooks/components untouched. Branding edits are string swaps only. | ✅ PASS |
| **IV. Mock Data Layer Replaces APIs** | Adapter handlers mirror existing endpoint shapes (`types.gen.ts`), so TanStack Query hooks and components work unchanged. | ✅ PASS |
| **V. Simplicity & Surgical Change (YAGNI)** | Net-new code is one adapter + handler/seed modules. **No new dependencies.** localStorage is browser-native (sanctioned). Generated SDK and feature code are not rewritten. | ✅ PASS |

**Result: PASS — no violations. Complexity Tracking not required.**

## Project Structure

### Documentation (this feature)

```text
specs/001-static-prototype/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — decisions (adapter injection, seeding, auth, branding)
├── data-model.md        # Phase 1 — entities, localStorage schema, seed strategy
├── quickstart.md        # Phase 1 — how to run & validate against the Quality Gates
├── contracts/
│   └── mock-endpoints.md # Phase 1 — the mocked endpoint contract (routes → behavior/shape)
└── checklists/
    └── requirements.md   # Spec quality checklist (from /speckit-specify)
```

### Source Code (repository root)

The new mock layer is additive and isolated; existing directories are largely untouched.

```text
src/
├── mocks/                         # NEW — the entire no-backend layer lives here
│   ├── adapter.ts                 # custom axios adapter: match method+URL → handler
│   ├── db.ts                      # localStorage-backed store (load/save/reset, versioned key)
│   ├── router.ts                  # route table mapping endpoint patterns → handlers
│   ├── auth.ts                    # demo accounts, login/refresh/retrieve/logout handlers
│   ├── handlers/                  # per-domain CRUD + pagination handlers
│   │   ├── leads.ts  residents.ts  incidents.ts  appointments.ts
│   │   ├── dailyLogs.ts  groupHomes.ts  users.ts  permissions.ts ...
│   └── seed/                      # seed datasets per entity (realistic, fictional)
│       ├── index.ts  leads.ts  residents.ts  incidents.ts ...
│
├── config/
│   └── branding.ts                # NEW — single source for "Custom Group Home" name/strings
│
├── sdk/                           # UNCHANGED (generated). Adapter attached via client.setConfig()
├── main.tsx                       # EDIT (small) — inject mock adapter before render
├── store/ store/slices/           # UNCHANGED — already persists userData/permissions to localStorage
├── routes/                        # UNCHANGED — role-based routing reused as-is
├── features/**                    # UNCHANGED — components keep calling the same hooks
└── components/nav-bar/            # EDIT (branding text only)
index.html                        # EDIT — <title> → "Custom Group Home"
```

**Structure Decision**: Single frontend project (the existing app). All no-backend behavior is concentrated under `src/mocks/` so it is easy to review, toggle, and (if ever needed) remove. The SDK boundary (`src/sdk/client.gen.ts`, exported `client`) is the only seam touched at runtime, via `client.setConfig({ adapter })` in `src/main.tsx` — confirmed safe because hey-api spreads its config into every axios call, so `adapter` propagates to all operations.

## Complexity Tracking

> No constitutional violations. Section intentionally empty.
