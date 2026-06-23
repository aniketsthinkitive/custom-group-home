import { useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectPermissionMap } from '../store/slices/permissionsSlice';
import type { PermissionEntry } from '../store/slices/permissionsSlice';
import { getUserRoleType } from '../utils/auth';

/**
 * Hook for checking permissions in components.
 *
 * Usage:
 *   const { hasPermission, getScope, canAccess } = usePermission();
 *
 *   // Check single permission
 *   if (hasPermission('documents.view')) { ... }
 *
 *   // Check scope (ALL vs ASSIGNED_HOME)
 *   const scope = getScope('incidents.edit');
 *
 *   // Check any permission in a module
 *   if (canAccess('leads')) { ... }
 *
 * PROTOTYPE NOTE: Admin/Staff have UNCONDITIONAL full access — every check returns true and
 * every scope is 'ALL'. They never see "you don't have permission", regardless of which
 * permission key a component checks or whether the cached permission set is stale.
 */
export function usePermission() {
  const permMap = useAppSelector(selectPermissionMap);

  const roleType = getUserRoleType();
  const fullAccess = roleType === 'ADMIN' || roleType === 'STAFF';

  /** Check if user has a specific permission. Returns the entry or null. */
  const getPermission = useCallback(
    (key: string): PermissionEntry | null => {
      if (permMap[key]) return permMap[key];
      if (fullAccess) {
        const [module, k = ''] = key.split('.');
        return { module, key: k, name: key, scope: 'ALL' };
      }
      return null;
    },
    [permMap, fullAccess],
  );

  /** Boolean check: does user have this permission? */
  const hasPermission = useCallback(
    (key: string): boolean => fullAccess || key in permMap,
    [permMap, fullAccess],
  );

  /** Get scope for a permission: 'ALL' | 'ASSIGNED_HOME' | null */
  const getScope = useCallback(
    (key: string): 'ALL' | 'ASSIGNED_HOME' | null =>
      fullAccess ? 'ALL' : (permMap[key]?.scope ?? null),
    [permMap, fullAccess],
  );

  /** Check if user has ANY permission for a given module. */
  const canAccess = useCallback(
    (module: string): boolean =>
      fullAccess || Object.keys(permMap).some((k) => k.startsWith(`${module}.`)),
    [permMap, fullAccess],
  );

  /** Check multiple permissions — returns true if user has ALL of them. */
  const hasAll = useCallback(
    (keys: string[]): boolean => fullAccess || keys.every((k) => k in permMap),
    [permMap, fullAccess],
  );

  /** Check multiple permissions — returns true if user has ANY of them. */
  const hasAny = useCallback(
    (keys: string[]): boolean => fullAccess || keys.some((k) => k in permMap),
    [permMap, fullAccess],
  );

  return { hasPermission, getPermission, getScope, canAccess, hasAll, hasAny };
}
