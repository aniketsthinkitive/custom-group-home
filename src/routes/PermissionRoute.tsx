import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { useAppSelector } from '../store/hooks';
import { selectPermissionsLoaded } from '../store/slices/permissionsSlice';
import { getUserRoleType } from '../utils/auth';

interface PermissionRouteProps {
  /** At least one of these modules must have any permission for access */
  modules: string[];
  children: React.ReactNode;
}

/**
 * Route guard that checks if the user has ANY permission in at least one
 * of the specified modules.  If not, redirects to /admin/profile.
 *
 * Usage:
 *   <Route path="leads" element={
 *     <PermissionRoute modules={['leads']}>
 *       <LeadsListPage />
 *     </PermissionRoute>
 *   } />
 */
const PermissionRoute: React.FC<PermissionRouteProps> = ({ modules, children }) => {
  const { canAccess } = usePermission();
  const permissionsLoaded = useAppSelector(selectPermissionsLoaded);
  const roleType = getUserRoleType();

  // Don't redirect while permissions are still loading (avoids flash)
  if (!permissionsLoaded) {
    return null;
  }

  const hasAccess = modules.some((mod) => canAccess(mod));

  if (!hasAccess) {
    return <Navigate to="/admin/profile" replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
