import React from 'react';
import { Navigate } from 'react-router-dom';
import { getDefaultRedirectPath } from '../utils/auth';

/**
 * Component that redirects authenticated users to their default route based on role
 * - ADMIN/STAFF -> /admin/dashboard
 * - GUARDIAN/AGENT -> /portal/careplan
 */
const RoleBasedRedirect: React.FC = () => {
  const redirectPath = getDefaultRedirectPath();
  return <Navigate to={redirectPath} replace />;
};

export default RoleBasedRedirect;
