// Routes a normalized request to a handler and returns a HandlerResult.
//
// Order: auth/account endpoints → generic resource CRUD (list/retrieve/create/update/delete,
// nested sub-lists, and item actions) → safe fallback. The fallback guarantees no request ever
// errors: unknown GET → empty list/{}; write → echo body with a generated id; delete → 204.
// See contracts/mock-endpoints.md.

import { db } from './db';
import { listEnvelope, itemEnvelope, okEnvelope, readPageParams } from './envelope';
import { handleLogin, handleAuthRetrieve, handleRefresh, handleLogout } from './auth';
import { getRolesWithPermissions } from './seed/accounts';
import type { HandlerCtx, HandlerResult } from './types';
import type { MockRecord } from './seed';

const idOf = (r: MockRecord): string => String(r.uuid ?? r.id ?? '');

// kebab path segment → seed collection name (camelCase).
const COLLECTION_MAP: Record<string, string> = {
  leads: 'leads',
  residents: 'residents',
  incidents: 'incidents',
  appointments: 'appointments',
  appointment: 'appointments',
  'group-homes': 'groupHomes',
  grouphomes: 'groupHomes',
  'group-home': 'groupHomes',
  'daily-logs': 'dailyLogs',
  'daily-tracking': 'dailyLogs',
  users: 'users',
  documents: 'documents',
  media: 'documents',
  roles: 'roles',
};

const FILTERABLE = ['status', 'referral_source', 'group_home', 'resident', 'severity', 'type', 'shift', 'role_type'];

function collectionFor(segment: string): string | null {
  return COLLECTION_MAP[segment] ?? null;
}

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function applyFilters(items: MockRecord[], query: Record<string, string>): MockRecord[] {
  let result = items;
  for (const key of FILTERABLE) {
    const val = query[key];
    if (val != null && val !== '') {
      result = result.filter((it) => String(it[key] ?? '').toLowerCase() === val.toLowerCase());
    }
  }
  return result;
}

function listResult(collection: string, ctx: HandlerCtx): HandlerResult {
  const items = applyFilters(db.collection(collection), ctx.query);
  return { status: 200, data: listEnvelope(items, readPageParams(ctx.query)) };
}

function createResult(collection: string, prefix: string, ctx: HandlerCtx): HandlerResult {
  const coll = db.collection(collection);
  const record: MockRecord = {
    uuid: genId(prefix),
    ...(ctx.body ?? {}),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  coll.unshift(record);
  db.save();
  return { status: 201, data: itemEnvelope(record) };
}

function updateResult(collection: string, id: string, ctx: HandlerCtx): HandlerResult {
  const coll = db.collection(collection);
  const item = coll.find((r) => idOf(r) === id);
  if (!item) {
    return { status: 200, data: itemEnvelope({ uuid: id, ...(ctx.body ?? {}) }) };
  }
  Object.assign(item, ctx.body ?? {}, { updated_at: nowIso() });
  db.save();
  return { status: 200, data: itemEnvelope(item) };
}

function deleteResult(collection: string, id: string): HandlerResult {
  const coll = db.collection(collection);
  const idx = coll.findIndex((r) => idOf(r) === id);
  if (idx >= 0) {
    coll.splice(idx, 1);
    db.save();
  }
  return { status: 200, data: okEnvelope('Deleted') };
}

function retrieveResult(collection: string, id: string): HandlerResult {
  let item = db.collection(collection).find((r) => idOf(r) === id);
  // Residents are admitted leads: the resident profile fetches its data via
  // getLeadDetail(lead_uuid). If the id isn't a real lead, fall back to the residents
  // collection so the profile header (which reads resident.user.first_name) populates.
  if (!item && collection === 'leads') {
    item = db.collection('residents').find(
      (r) => idOf(r) === id || r.lead_uuid === id || r.resident_uuid === id,
    );
  }
  return { status: 200, data: itemEnvelope(item ?? {}) };
}

// Nested: /<resource>/<id>/<sub>/...  → sub-list, sub-create, or an action on the parent item.
function nestedResult(collection: string, segs: string[], ctx: HandlerCtx): HandlerResult {
  const parentId = segs[1];
  const sub = segs[2];
  const subCollection = collectionFor(sub);

  if (ctx.method === 'GET') {
    if (subCollection) {
      const items = db.collection(subCollection).filter((r) =>
        Object.values(r).some((v) => String(v) === parentId),
      );
      return { status: 200, data: listEnvelope(items, readPageParams(ctx.query)) };
    }
    return { status: 200, data: listEnvelope([], readPageParams(ctx.query)) };
  }

  if (ctx.method === 'DELETE') {
    return { status: 200, data: okEnvelope('Deleted') };
  }

  // POST/PUT/PATCH
  if (subCollection) {
    return createResult(subCollection, sub, ctx);
  }
  // Treat as an action (acknowledge, sign-off, status, move-out, ...) on the parent item.
  const parent = db.collection(collection).find((r) => idOf(r) === parentId);
  if (parent) {
    Object.assign(parent, ctx.body ?? {}, { [`${sub}_at`]: nowIso(), updated_at: nowIso() });
    db.save();
    return { status: 200, data: itemEnvelope(parent) };
  }
  return { status: 200, data: okEnvelope('OK') };
}

function resourceResult(collection: string, segs: string[], ctx: HandlerCtx): HandlerResult {
  // Some list endpoints append a trailing /list/ (e.g. consent-forms/list/, media/list/).
  if (segs.length === 2 && segs[1] === 'list' && ctx.method === 'GET') {
    return listResult(collection, ctx);
  }
  if (segs.length === 1) {
    if (ctx.method === 'GET') return listResult(collection, ctx);
    if (ctx.method === 'POST') return createResult(collection, segs[0], ctx);
    return { status: 200, data: okEnvelope('OK') };
  }
  if (segs.length === 2) {
    const id = segs[1];
    if (ctx.method === 'GET') return retrieveResult(collection, id);
    if (ctx.method === 'PUT' || ctx.method === 'PATCH') return updateResult(collection, id, ctx);
    if (ctx.method === 'DELETE') return deleteResult(collection, id);
    if (ctx.method === 'POST') return updateResult(collection, id, ctx);
    return { status: 200, data: okEnvelope('OK') };
  }
  return nestedResult(collection, segs, ctx);
}

function fallback(ctx: HandlerCtx): HandlerResult {
  if (ctx.method === 'GET') {
    return { status: 200, data: listEnvelope([], readPageParams(ctx.query)) };
  }
  if (ctx.method === 'DELETE') {
    return { status: 200, data: okEnvelope('Deleted') };
  }
  const record: MockRecord = { uuid: genId('item'), ...(ctx.body ?? {}), created_at: nowIso() };
  return { status: 200, data: itemEnvelope(record) };
}

// Ordered prefix → collection rules, derived from the real SDK URLs. The id/nested segments
// are whatever follows the matched prefix. MOST-SPECIFIC prefixes MUST come first.
const ROUTE_RULES: { prefix: string[]; collection: string }[] = [
  { prefix: ['accounts', 'users'], collection: 'users' },
  { prefix: ['accounts', 'roles'], collection: 'roles' },
  { prefix: ['leads', 'residents'], collection: 'residents' },        // residents LIST lives here
  { prefix: ['residents', 'daily-logs'], collection: 'dailyLogs' },
  { prefix: ['residents', 'care-plan-reports'], collection: 'carePlanReports' },
  { prefix: ['residents', 'resident-scheduled-forms'], collection: 'scheduledForms' },
  { prefix: ['residents'], collection: 'residents' },                 // resident detail by uuid
  { prefix: ['leads'], collection: 'leads' },
  { prefix: ['incidents'], collection: 'incidents' },
  { prefix: ['appointments'], collection: 'appointments' },
  { prefix: ['group-homes'], collection: 'groupHomes' },
  { prefix: ['document', 'consent-forms'], collection: 'documents' },
  { prefix: ['document'], collection: 'documents' },
  { prefix: ['media'], collection: 'documents' },
  { prefix: ['providers'], collection: 'providers' },
  { prefix: ['audit-logs'], collection: 'auditLogs' },
];

function matchesPrefix(segments: string[], prefix: string[]): boolean {
  if (segments.length < prefix.length) return false;
  return prefix.every((p, i) => segments[i] === p);
}

export function routeRequest(ctx: HandlerCtx): HandlerResult {
  const { path, method, segments } = ctx;

  // --- Auth / accounts ---
  if (path.includes('/login')) {
    return method === 'POST' ? handleLogin(ctx.body) : handleAuthRetrieve();
  }
  if (path.includes('/logout')) return handleLogout();
  if (path.includes('/refresh')) return handleRefresh();
  if (/\/accounts\/auth\/?$/.test(path)) return handleAuthRetrieve();

  // Roles & permissions matrix (Settings → Roles & Permissions) expects data = Role[].
  if (segments[0] === 'accounts' && segments[1] === 'roles' && segments[2] === 'permissions') {
    return {
      status: 200,
      data: { status: 'success', code: 200, message: 'OK', data: getRolesWithPermissions() },
    };
  }

  // Other non-resource /accounts/* (forgot-password, verify-otp, set-password, ...) → benign success.
  if (segments[0] === 'accounts' && segments[1] !== 'users' && segments[1] !== 'roles') {
    return { status: 200, data: okEnvelope('OK') };
  }

  // Care plan reports list: GET /api/residents/care-plan-reports/{residentUuid}/ returns the
  // reports FOR that resident (the uuid is the resident, not a report id).
  if (segments[0] === 'residents' && segments[1] === 'care-plan-reports'
      && segments.length === 3 && method === 'GET') {
    const residentUuid = segments[2];
    const reports = db.collection('carePlanReports').filter((r) => r.resident_uuid === residentUuid);
    return { status: 200, data: listEnvelope(reports, readPageParams(ctx.query)) };
  }

  // Care plan items (ADLs / Goals) for the resident profile → Care Plan tab.
  // Fetched via residentsList: GET /api/residents/?resident_uuid=&type=ADL|GOAL&archived=
  if (segments[0] === 'residents' && segments.length === 1 && method === 'GET'
      && (ctx.query.resident_uuid || ctx.query.type)) {
    const items = db.collection('carePlanItems').filter((it) => {
      const okResident = !ctx.query.resident_uuid || it.resident_uuid === ctx.query.resident_uuid;
      const okType = !ctx.query.type || it.type === ctx.query.type;
      const okArchived = ctx.query.archived === 'true'
        ? !!it.deleted_at
        : ctx.query.archived === 'false'
          ? !it.deleted_at
          : true;
      return okResident && okType && okArchived;
    });
    return { status: 200, data: listEnvelope(items, readPageParams(ctx.query)) };
  }

  // --- Resource routing via prefix rules ---
  for (const rule of ROUTE_RULES) {
    if (matchesPrefix(segments, rule.prefix)) {
      const idSegments = segments.slice(rule.prefix.length);
      return resourceResult(rule.collection, [rule.collection, ...idSegments], ctx);
    }
  }

  // --- Safe fallback (never error) ---
  return fallback(ctx);
}
