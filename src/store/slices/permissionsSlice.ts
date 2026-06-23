import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionEntry {
  module: string;
  key: string;
  name: string;
  scope: 'ALL' | 'ASSIGNED_HOME';
}

interface PermissionsState {
  /** Flat map: "module.key" → PermissionEntry for O(1) lookup */
  map: Record<string, PermissionEntry>;
  /** Raw list from API (for settings table display) */
  list: PermissionEntry[];
  /** True once permissions have been loaded from auth/me */
  isLoaded: boolean;
}

const initialState: PermissionsState = {
  map: {},
  list: [],
  isLoaded: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the permission map from the flat list returned by auth/me */
function buildMap(permissions: PermissionEntry[]): Record<string, PermissionEntry> {
  const map: Record<string, PermissionEntry> = {};
  for (const p of permissions) {
    map[`${p.module}.${p.key}`] = p;
  }
  return map;
}

/** Persist to localStorage so permissions survive page refresh */
function persistPermissions(permissions: PermissionEntry[]): void {
  try {
    localStorage.setItem('permissions', JSON.stringify(permissions));
  } catch {
    // quota exceeded or private mode — ignore
  }
}

/** Restore from localStorage */
function restorePermissions(): PermissionEntry[] | null {
  try {
    const raw = localStorage.getItem('permissions');
    if (raw) {
      return JSON.parse(raw) as PermissionEntry[];
    }
  } catch {
    // corrupted — ignore
  }
  return null;
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    /** Set permissions from auth/me response. Called after login / checkAuthStatus. */
    setPermissions(state, action: PayloadAction<PermissionEntry[]>) {
      const permissions = action.payload;
      state.list = permissions;
      state.map = buildMap(permissions);
      state.isLoaded = true;
      persistPermissions(permissions);
    },

    /** Restore from localStorage on app init (before auth/me completes). */
    restoreFromStorage(state) {
      const permissions = restorePermissions();
      if (permissions) {
        state.list = permissions;
        state.map = buildMap(permissions);
        state.isLoaded = true;
      }
    },

    /** Clear on logout */
    clearPermissions(state) {
      state.map = {};
      state.list = [];
      state.isLoaded = false;
      localStorage.removeItem('permissions');
    },
  },
});

export const { setPermissions, restoreFromStorage, clearPermissions } =
  permissionsSlice.actions;

export default permissionsSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectPermissionMap = (state: { permissions: PermissionsState }) =>
  state.permissions.map;

export const selectPermissionList = (state: { permissions: PermissionsState }) =>
  state.permissions.list;

export const selectPermissionsLoaded = (state: { permissions: PermissionsState }) =>
  state.permissions.isLoaded;
