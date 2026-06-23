// The two fixed demo sign-ins for the prototype. Defined client-side; documented near the
// login screen. Each carries a User-shaped payload plus a `permissions` array (the shape the
// app's permissionsSlice expects) and a `role_type` that drives the existing role routing.

export interface DemoPermission {
  module: string;
  key: string;
  name: string;
  scope: 'ALL' | 'ASSIGNED_HOME';
}

export interface DemoUser {
  uuid: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: number | null;
  active: boolean;
  role: { uuid: string; name: string; type: string };
  role_type: string;
  group_home: string;
  group_homes: string;
  avatar_url: string;
  signature_url: string;
  isPasswordSet: boolean;
  permissions: DemoPermission[];
}

export interface DemoAccount {
  email: string;
  password: string;
  user: DemoUser;
}

const PERM_KEYS = ['view', 'create', 'edit', 'update', 'delete', 'export', 'manage'];

// Every module the admin UI gates on (nav tabs + common component checks).
const ADMIN_MODULES = [
  'leads', 'residents', 'onboarding', 'documents', 'consent_forms', 'adls', 'goals',
  'monthly_summary', 'daily_tracking', 'incidents', 'appointments', 'users', 'group_homes',
  'audit_logs', 'roles', 'settings', 'providers', 'careplan',
];

const GUARDIAN_MODULES = ['incidents', 'appointments', 'documents', 'careplan', 'onboarding', 'residents'];

function buildPermissions(modules: string[], scope: 'ALL' | 'ASSIGNED_HOME'): DemoPermission[] {
  const perms: DemoPermission[] = [];
  for (const module of modules) {
    for (const key of PERM_KEYS) {
      perms.push({ module, key, name: `${module} ${key}`, scope });
    }
  }
  return perms;
}

const adminUser: DemoUser = {
  uuid: 'demo-admin-0000-0000-000000000001',
  username: 'admin',
  first_name: 'Avery',
  last_name: 'Admin',
  email: 'admin@customgrouphome.com',
  phone: null,
  active: true,
  role: { uuid: 'role-admin', name: 'Administrator', type: 'ADMIN' },
  role_type: 'ADMIN',
  group_home: '',
  group_homes: '',
  avatar_url: '',
  signature_url: '',
  isPasswordSet: true,
  permissions: buildPermissions(ADMIN_MODULES, 'ALL'),
};

const guardianUser: DemoUser = {
  uuid: 'demo-guardian-0000-0000-000000000002',
  username: 'guardian',
  first_name: 'Gabriel',
  last_name: 'Guardian',
  email: 'guardian@customgrouphome.com',
  phone: null,
  active: true,
  role: { uuid: 'role-guardian', name: 'Guardian', type: 'GUARDIAN' },
  role_type: 'GUARDIAN',
  group_home: '',
  group_homes: '',
  avatar_url: '',
  signature_url: '',
  isPasswordSet: true,
  permissions: buildPermissions(GUARDIAN_MODULES, 'ASSIGNED_HOME'),
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: adminUser.email, password: 'Admin@123', user: adminUser },
  { email: guardianUser.email, password: 'Guardian@123', user: guardianUser },
];

export function findDemoAccount(email: string, password: string): DemoAccount | undefined {
  const e = (email ?? '').trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === e && a.password === password);
}

export function findDemoUserByEmail(email: string): DemoUser | undefined {
  const e = (email ?? '').trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === e)?.user;
}

// ---------------------------------------------------------------------------
// Roles + permissions matrix (for Settings → Roles & Permissions tab).
// The tab expects: response.data.data = Array<{ uuid, name, type, description,
// permissions: [{ module, key, name, scope }] }>, and displays roles named:
// Admin, Program Director, Program Manager, BCBA, Nurse, Program Coordinator, DSP.
// ---------------------------------------------------------------------------

export interface RoleWithPermissions {
  uuid: string;
  name: string;
  type: string;
  description: string | null;
  permissions: DemoPermission[];
}

const ROLE_MODULES = [
  'leads', 'onboarding', 'documents', 'consent_forms', 'adls', 'daily_tracking',
  'monthly_summary', 'goals', 'incidents', 'appointments', 'group_homes', 'users', 'profile',
];

// name → [modules it can access, scope]. Admin/Director get everything (ALL); others a
// realistic subset scoped to their assigned home, to make the matrix look varied.
const ROLE_DEFS: { name: string; type: string; modules: string[]; scope: 'ALL' | 'ASSIGNED_HOME' }[] = [
  { name: 'Admin', type: 'ADMIN', modules: ROLE_MODULES, scope: 'ALL' },
  { name: 'Program Director', type: 'STAFF', modules: ROLE_MODULES, scope: 'ALL' },
  { name: 'Program Manager', type: 'STAFF', modules: ['leads', 'onboarding', 'documents', 'consent_forms', 'incidents', 'appointments', 'group_homes', 'users', 'profile'], scope: 'ASSIGNED_HOME' },
  { name: 'BCBA', type: 'STAFF', modules: ['goals', 'adls', 'incidents', 'documents', 'monthly_summary', 'profile'], scope: 'ASSIGNED_HOME' },
  { name: 'Nurse', type: 'STAFF', modules: ['incidents', 'adls', 'documents', 'monthly_summary', 'profile'], scope: 'ASSIGNED_HOME' },
  { name: 'Program Coordinator', type: 'STAFF', modules: ['appointments', 'onboarding', 'documents', 'consent_forms', 'profile'], scope: 'ASSIGNED_HOME' },
  { name: 'DSP', type: 'STAFF', modules: ['daily_tracking', 'adls', 'profile'], scope: 'ASSIGNED_HOME' },
];

export function getRolesWithPermissions(): RoleWithPermissions[] {
  return ROLE_DEFS.map((def, i) => ({
    uuid: `role-perm-${i + 1}`,
    name: def.name,
    type: def.type,
    description: `${def.name} role`,
    permissions: buildPermissions(def.modules, def.scope),
  }));
}
