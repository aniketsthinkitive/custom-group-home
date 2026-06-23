// Care plan data for the resident profile → Care Plan tab.
//
// ADLs and Goals are fetched via residentsList (GET /api/residents/?resident_uuid=&type=ADL|GOAL);
// the hook reads the top-level `results` array and filters by `type`. Reports are fetched via
// residentsCarePlanReportsList. Both are keyed to resident-001..resident-010.

type Rec = Record<string, unknown>;

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

function buildCarePlanItems(): Rec[] {
  const items: Rec[] = [];
  RESIDENT_IDS.forEach((rid, ri) => {
    ADL_TITLES.forEach((title, i) => {
      items.push({
        id: ri * 100 + i + 1,
        uuid: `cpi-adl-${rid}-${i + 1}`,
        resident_uuid: rid,
        resident: rid,
        type: 'ADL',
        title,
        description: `${title} — provide assistance as needed and document completion each shift.`,
        assigned_shifts: i % 2 === 0 ? ['MORNING', 'EVENING'] : ['MORNING', 'EVENING', 'NIGHT'],
        daily_status: {},
        deleted_at: null,
        is_archived: false,
        created_at: '2025-04-01T09:00:00Z',
        updated_at: '2025-05-01T09:00:00Z',
      });
    });
    GOAL_TITLES.forEach((title, i) => {
      const archived = i === 2; // one archived goal per resident (for the "show archived" toggle)
      items.push({
        id: ri * 100 + 50 + i + 1,
        uuid: `cpi-goal-${rid}-${i + 1}`,
        resident_uuid: rid,
        resident: rid,
        type: 'GOAL',
        title,
        description: `${title} — track progress and review monthly.`,
        assigned_shifts: ['MORNING'],
        daily_status: {},
        deleted_at: archived ? '2025-05-20T09:00:00Z' : null,
        is_archived: archived,
        monthly_progress: { worked: 12 + i, total: 20, percentage: Math.round(((12 + i) / 20) * 100) },
        created_at: '2025-04-01T09:00:00Z',
        updated_at: '2025-05-01T09:00:00Z',
      });
    });
  });
  return items;
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
