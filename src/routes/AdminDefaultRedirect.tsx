import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { useAppSelector } from '../store/hooks';
import { selectPermissionsLoaded } from '../store/slices/permissionsSlice';

/**
 * Ordered list of admin pages with their required permission modules.
 * The user is redirected to the first page they have access to.
 */
const ADMIN_PAGES: { path: string; modules: string[] }[] = [
  { path: '/admin/leads', modules: ['leads'] },
  { path: '/admin/residents', modules: ['onboarding', 'documents', 'consent_forms', 'adls', 'goals', 'monthly_summary'] },
  { path: '/admin/daily-logs', modules: ['daily_tracking'] },
  { path: '/admin/incidents', modules: ['incidents'] },
  { path: '/admin/appointment', modules: ['appointments'] },
  { path: '/admin/settings', modules: ['users', 'group_homes', 'audit_logs'] },
];

/**
 * Redirects to the first admin page the user has permission to access.
 * Falls back to /admin/profile if they have no module permissions.
 */
const AdminDefaultRedirect: React.FC = () => {
  const { canAccess } = usePermission();
  const permissionsLoaded = useAppSelector(selectPermissionsLoaded);

  if (!permissionsLoaded) {
    return null; // wait for permissions
  }

  const firstAccessible = ADMIN_PAGES.find((page) =>
    page.modules.some((mod) => canAccess(mod))
  );

  return <Navigate to={firstAccessible?.path ?? '/admin/profile'} replace />;
};

export default AdminDefaultRedirect;
