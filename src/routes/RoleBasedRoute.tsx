import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRoleType, isAdminOrStaff, isGuardianOrAgent } from '../utils/auth';

/**
 * Role types (not unique — multiple role names share the same type).
 * Use role.type for broad access checks (admin panel vs portal).
 * Use role.name for granular permission checks.
 */
export type RoleType =
  | 'ADMIN'
  | 'STAFF'
  | 'LEAD'
  | 'GUARDIAN'
  | 'AGENT'
  | 'RESIDENT';

/** Role types that access the admin panel */
export const ADMIN_PANEL_ROLES: RoleType[] = ['ADMIN', 'STAFF'];

/** Role types that access the portal */
export const PORTAL_ROLES: RoleType[] = ['GUARDIAN', 'AGENT'];

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: RoleType[];
  redirectTo?: string;
}

/**
 * Component that protects routes based on user role
 * Only allows access if user's role is in the allowedRoles array
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo 
}) => {
  const roleType = getUserRoleType();
  
  // Check if user's role is in allowed roles
  const hasAccess = roleType && allowedRoles.includes(roleType as any);
  
  if (!hasAccess) {
    // Redirect to appropriate dashboard based on role
    if (isAdminOrStaff()) {
      return <Navigate to={redirectTo || '/admin'} replace />;
    } else if (isGuardianOrAgent()) {
      return <Navigate to={redirectTo || '/portal/careplan'} replace />;
    }
    // Default redirect to login if no role
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default RoleBasedRoute;
