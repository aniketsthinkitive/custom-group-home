// localStorage-backed mock database.
//
// The whole DB is one JSON object under STORAGE_KEYS.db, guarded by a version key so seed
// changes re-initialize cleanly. An in-memory cache makes reads instant; every write calls
// save() to persist immediately so changes survive a page refresh (Constitution Principle II).
// All localStorage access is wrapped in try/catch so the app still runs for the session when
// storage is unavailable (private mode / quota), per FR-012.

import { STORAGE_KEYS, SEED_VERSION } from './config';
import { getSeedData, type MockDB, type MockRecord } from './seed';

let cache: MockDB | null = null;

// Collections every healthy DB must have. If a stored DB is missing any (e.g. it was written
// by an older/partial bundle that had the new version number but stale seed data), we discard
// it and re-seed from the CURRENT getSeedData() — self-healing the "version matches but data
// is incomplete" trap.
const REQUIRED_COLLECTIONS = [
  'groupHomes', 'users', 'leads', 'residents', 'incidents', 'appointments',
  'dailyLogs', 'documents', 'providers', 'auditLogs', 'carePlanItems', 'carePlanReports', 'roles',
];

function readRaw(): MockDB | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.db);
    const version = localStorage.getItem(STORAGE_KEYS.version);
    if (!raw || version !== SEED_VERSION) return null;
    const parsed = JSON.parse(raw) as MockDB;
    for (const key of REQUIRED_COLLECTIONS) {
      if (!Array.isArray(parsed[key]) || parsed[key].length === 0) return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeRaw(value: MockDB): void {
  try {
    localStorage.setItem(STORAGE_KEYS.db, JSON.stringify(value));
    localStorage.setItem(STORAGE_KEYS.version, SEED_VERSION);
  } catch {
    // Storage unavailable or quota exceeded — keep running with the in-memory cache only.
  }
}

function load(): MockDB {
  if (cache) return cache;
  const existing = readRaw();
  if (existing) {
    cache = existing;
  } else {
    cache = getSeedData();
    writeRaw(cache);
  }
  return cache;
}

export const db = {
  /** The whole database (loads + seeds on first access). */
  all(): MockDB {
    return load();
  },
  /** A collection by name; creates an empty one if it does not exist yet. */
  collection(name: string): MockRecord[] {
    const data = load();
    if (!Array.isArray(data[name])) {
      data[name] = [];
    }
    return data[name];
  },
  /** Whether a collection name is known/present. */
  has(name: string): boolean {
    return Array.isArray(load()[name]);
  },
  /** Persist the current in-memory state to localStorage. */
  save(): void {
    if (cache) writeRaw(cache);
  },
  /** Clear and re-seed from the bundled seed data; returns the fresh DB. */
  reset(): MockDB {
    cache = getSeedData();
    writeRaw(cache);
    return cache;
  },
};
