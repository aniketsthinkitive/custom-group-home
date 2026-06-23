import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { isAuthenticated as checkAuth } from '../utils/auth';
import { getDefaultRedirectPath } from '../utils/auth';

/**
 * Handles the root path "/": wait for the initial auth check (including token refresh)
 * to complete before redirecting. This prevents the "flash of login then redirect to
 * main" when the user has valid refresh token but expired access token.
 * - While loading: show full-screen loading (no redirect).
 * - If authenticated: redirect to role-based main (e.g. /admin/leads or /portal/dashboard).
 * - If not authenticated: redirect to /login.
 */
const InitialAuthRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated || checkAuth()) {
    return <Navigate to={getDefaultRedirectPath()} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default InitialAuthRedirect;
