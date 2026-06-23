// Seed datasets for the prototype. Rich, fully-populated, cross-referenced by stable ids so
// list rows, detail pages, and sub-tabs render with real values. Each domain lives in its own
// file (built to match the SDK types + what the components read). On first load — or when
// SEED_VERSION changes — db.ts initializes the store from getSeedData().

import { groupHomesSeed, rolesSeed } from './groupHomes';
import { usersSeed } from './users';
import { leadsSeed } from './leads';
import { residentsSeed } from './residents';
import { incidentsSeed } from './incidents';
import { appointmentsSeed } from './appointments';
import { dailyLogsSeed } from './dailyLogs';
import { documentsSeed } from './documents';
import { providersSeed } from './providers';
import { auditLogsSeed } from './auditLogs';

export type MockRecord = Record<string, unknown>;

export interface MockDB {
  groupHomes: MockRecord[];
  users: MockRecord[];
  leads: MockRecord[];
  residents: MockRecord[];
  incidents: MockRecord[];
  appointments: MockRecord[];
  dailyLogs: MockRecord[];
  documents: MockRecord[];
  providers: MockRecord[];
  auditLogs: MockRecord[];
  roles: MockRecord[];
  [collection: string]: MockRecord[];
}

// Clone so runtime mutations (create/update/delete) never alter the imported seed arrays —
// a reset() must always restore the pristine data.
function clone(records: MockRecord[]): MockRecord[] {
  return records.map((r) => ({ ...r }));
}

export function getSeedData(): MockDB {
  return {
    groupHomes: clone(groupHomesSeed),
    users: clone(usersSeed),
    leads: clone(leadsSeed),
    residents: clone(residentsSeed),
    incidents: clone(incidentsSeed),
    appointments: clone(appointmentsSeed),
    dailyLogs: clone(dailyLogsSeed),
    documents: clone(documentsSeed),
    providers: clone(providersSeed),
    auditLogs: clone(auditLogsSeed),
    roles: clone(rolesSeed),
  };
}
