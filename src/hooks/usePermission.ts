import { useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectPermissionMap } from '../store/slices/permissionsSlice';
import type { PermissionEntry } from '../store/slices/permissionsSlice';

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
 */
export function usePermission() {
  const permMap = useAppSelector(selectPermissionMap);

  /** Check if user has a specific permission. Returns the entry or null. */
  const getPermission = useCallback(
    (key: string): PermissionEntry | null => {
      return permMap[key] ?? null;
    },
    [permMap],
  );

  /** Boolean check: does user have this permission? */
  const hasPermission = useCallback(
    (key: string): boolean => {
      return key in permMap;
    },
    [permMap],
  );

  /** Get scope for a permission: 'ALL' | 'ASSIGNED_HOME' | null */
  const getScope = useCallback(
    (key: string): 'ALL' | 'ASSIGNED_HOME' | null => {
      return permMap[key]?.scope ?? null;
    },
    [permMap],
  );

  /** Check if user has ANY permission for a given module. */
  const canAccess = useCallback(
    (module: string): boolean => {
      return Object.keys(permMap).some((k) => k.startsWith(`${module}.`));
    },
    [permMap],
  );

  /** Check multiple permissions — returns true if user has ALL of them. */
  const hasAll = useCallback(
    (keys: string[]): boolean => {
      return keys.every((k) => k in permMap);
    },
    [permMap],
  );

  /** Check multiple permissions — returns true if user has ANY of them. */
  const hasAny = useCallback(
    (keys: string[]): boolean => {
      return keys.some((k) => k in permMap);
    },
    [permMap],
  );

  return { hasPermission, getPermission, getScope, canAccess, hasAll, hasAny };
}
