// Central switch + storage keys for the no-backend mock layer.
//
// The prototype always runs with the mock layer ON: there is no backend, so every
// SDK request is served locally from the localStorage-backed store (see db.ts) via a
// custom axios adapter (see adapter.ts). Flip MOCK_ENABLED to false only if a real
// backend is ever reintroduced.
export const MOCK_ENABLED = true;

// localStorage keys owned by the mock layer.
export const STORAGE_KEYS = {
  /** The whole mock database (object of entity collections). */
  db: 'cgh.mockdb.v1',
  /** Seed/schema version guard — bump to force a clean re-seed. */
  version: 'cgh.mockdb.version',
  /** Active demo session → which demo account is signed in. */
  session: 'cgh.session',
} as const;

// Bump this when seed shapes change so existing browsers re-seed cleanly on next load.
export const SEED_VERSION = '6';
