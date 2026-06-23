// Care plan data for the resident profile → Care Plan tab (ADL / Goals daily tracking,
// Monthly Summary, and Reports).
//
// - ADLs & Goals are fetched via residentsList (GET /api/residents/?resident_uuid=&type=ADL|GOAL);
//   the tracking tab reads each item's `daily_status` keyed by shift (MORNING/EVENING/NIGHT) →
//   { status: WORKED | DID_NOT_WORK | COULD_NOT_WORK, note }.
// - The Monthly Summary reads Goals' `monthly_progress`, a map of "YYYY-MM-DD" → per-shift status.
//   It is generated at runtime for the CURRENT and PREVIOUS month (using the browser clock) so
//   the default month view always has data.
// - Reports are fetched via residentsCarePlanReportsList. All keyed to resident-001..resident-010.

type Rec = Record<string, unknown>;
type ShiftStatus = 'WORKED' | 'DID_NOT_WORK' | 'COULD_NOT_WORK';
type DailyStatus = Record<string, { status: ShiftStatus; note: string }>;

const RESIDENT_IDS = Array.from({ length: 10 }, (_, i) => `resident-${String(i + 1).padStart(3, '0')}`);

const ADL_TITLES = [
  'Brush teeth',
  'Take morning medication',
  'Shower / bathe',
  'Eat breakfast',
  'Light exercise / walk',
];

const GOAL_TITLES = [
  'Improve social interaction with peers',
  'Increase independence in meal preparation',
  'Attend weekly community outing',
];

// Per-shift completion status for a single day, varied but mostly "worked".
function dailyStatus(offset: number): DailyStatus {
  const pick = (n: number): ShiftStatus =>
    n % 9 === 0 ? 'COULD_NOT_WORK' : n % 4 === 0 ? 'DID_NOT_WORK' : 'WORKED';
  return {
    MORNING: { status: pick(offset), note: offset % 4 === 0 ? 'Resident declined' : 'Completed as scheduled' },
    EVENING: { status: pick(offset + 1), note: '' },
    NIGHT: { status: pick(offset + 2), note: '' },
  };
}

// Date keys for the current month (up to today) + all of the previous month.
function recentDateKeys(): string[] {
  const now = new Date();
  const keys: string[] = [];
  const push = (y: number, mZero: number, day: number) => {
    keys.push(`${y}-${String(mZero + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };
  // previous month (full)
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevDays = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= prevDays; d++) push(prev.getFullYear(), prev.getMonth(), d);
  // current month up to today
  for (let d = 1; d <= now.getDate(); d++) push(now.getFullYear(), now.getMonth(), d);
  return keys;
}

function monthlyProgress(offset: number): Record<string, Record<string, ShiftStatus>> {
  const out: Record<string, Record<string, ShiftStatus>> = {};
  recentDateKeys().forEach((dateStr, i) => {
    const n = i + offset;
    const pick = (k: number): ShiftStatus =>
      k % 11 === 0 ? 'COULD_NOT_WORK' : k % 5 === 0 ? 'DID_NOT_WORK' : 'WORKED';
    out[dateStr] = { MORNING: pick(n), EVENING: pick(n + 1), NIGHT: pick(n + 2) };
  });
  return out;
}

// Build the full care plan (5 ADLs + 3 goals, with daily tracking + monthly progress) for ONE
// resident. Exported so the router can auto-generate a care plan for any resident that doesn't
// have seeded items yet (e.g. a newly onboarded patient, whose id is the lead uuid).
export function buildCarePlanItemsForResident(rid: string, offset = 0): Rec[] {
  const items: Rec[] = [];
  ADL_TITLES.forEach((title, i) => {
    items.push({
      id: offset * 100 + i + 1,
      uuid: `cpi-adl-${rid}-${i + 1}`,
      resident_uuid: rid,
      resident: rid,
      type: 'ADL',
      title,
      description: `${title} — provide assistance as needed and document completion each shift.`,
      assigned_shifts: i % 2 === 0 ? ['MORNING', 'EVENING'] : ['MORNING', 'EVENING', 'NIGHT'],
      daily_status: dailyStatus(offset + i),
      deleted_at: null,
      is_archived: false,
      created_at: '2025-04-01T09:00:00Z',
      updated_at: '2025-05-01T09:00:00Z',
    });
  });
  GOAL_TITLES.forEach((title, i) => {
    const archived = i === 2; // one archived goal per resident (for the "show archived" toggle)
    items.push({
      id: offset * 100 + 50 + i + 1,
      uuid: `cpi-goal-${rid}-${i + 1}`,
      resident_uuid: rid,
      resident: rid,
      type: 'GOAL',
      title,
      description: `${title} — track progress and review monthly.`,
      assigned_shifts: ['MORNING', 'EVENING', 'NIGHT'],
      daily_status: dailyStatus(offset + i + 1),
      monthly_progress: monthlyProgress(offset * 3 + i),
      deleted_at: archived ? '2025-05-20T09:00:00Z' : null,
      is_archived: archived,
      created_at: '2025-04-01T09:00:00Z',
      updated_at: '2025-05-01T09:00:00Z',
    });
  });
  return items;
}

function buildCarePlanItems(): Rec[] {
  return RESIDENT_IDS.flatMap((rid, ri) => buildCarePlanItemsForResident(rid, ri));
}

function buildCarePlanReports(): Rec[] {
  const reports: Rec[] = [];
  const months = [
    { m: 4, name: 'April' },
    { m: 5, name: 'May' },
  ];
  RESIDENT_IDS.forEach((rid) => {
    months.forEach(({ m, name }, idx) => {
      reports.push({
        uuid: `cpr-${rid}-${idx + 1}`,
        id: `${rid}-${idx + 1}`,
        resident_uuid: rid,
        resident: rid,
        title: `Monthly Care Plan Report — ${name} 2025`,
        report_type: 'MONTHLY',
        month: m,
        year: 2025,
        status: 'GENERATED',
        generated_by: 'Avery Admin',
        generated_by_name: 'Avery Admin',
        file_url: '',
        url: '',
        created_at: `2025-0${m + 1}-01T10:00:00Z`,
        updated_at: `2025-0${m + 1}-01T10:00:00Z`,
      });
    });
  });
  return reports;
}

export const carePlanItemsSeed: Rec[] = buildCarePlanItems();
export const carePlanReportsSeed: Rec[] = buildCarePlanReports();
