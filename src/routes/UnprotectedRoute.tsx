import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { isAuthenticated as checkAuth, getDefaultRedirectPath } from '../utils/auth';

interface UnprotectedRouteProps {
  children: React.ReactNode;
}

const UnprotectedRoute: React.FC<UnprotectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Special handling for set-password route
  // Check both exact match and includes to handle different URL structures
  const isSetPasswordRoute = location.pathname === '/set-password' || location.pathname.includes('/set-password');
  const isLoginRoute = location.pathname === '/login';

  // On login route: wait for auth check so we don't flash login form then redirect to app
  if (isLoginRoute && isLoading) {
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
  
  if (isSetPasswordRoute) {
    const urlToken = searchParams.get('token');
    const urlUserId = searchParams.get('userId');

    // Debug logging (remove in production if needed)
    // console.log('[UnprotectedRoute] Set-password route detected:', {
    //   pathname: location.pathname,
    //   search: location.search,
    //   urlToken: urlToken ? 'present' : 'missing',
    //   urlUserId: urlUserId ? 'present' : 'missing',
    //   isAuthenticated,
    //   isLoading,
    // });

    // If we have a token or userId in URL, allow access (even if user has stale auth cookies)
    // This is important for set-password flow where user might have old session cookies
    // We allow access REGARDLESS of authentication status when token/userId is present
    if (urlToken || urlUserId) {
      // Allow access to set password page regardless of authentication status
      // This ensures users can set their password even if they have stale cookies
      // console.log('[UnprotectedRoute] Allowing access to set-password page with token/userId');
      return <>{children}</>;
    }
    // No token or userId in URL - redirect to login
    // console.log('[UnprotectedRoute] No token/userId found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // For other unprotected routes (login, forgot password, reset password)
  // Wait for auth to finish loading before checking authentication status
  // This prevents race conditions where auth state changes after initial render
  if (!isLoading && (isAuthenticated || checkAuth())) {
    // User is already logged in. If ProtectedRoute bounced them here (auth blip / session
    // refresh), return them to the page they were on instead of the default admin page.
    const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    if (from?.pathname && from.pathname !== '/login') {
      return <Navigate to={`${from.pathname}${from.search || ''}`} replace />;
    }
    return <Navigate to={getDefaultRedirectPath()} replace />;
  }

  //* ALLOW RESIDENT PAGES FOR ALL USERS
  if (location.pathname.startsWith("/residents")) {
    return <>{children}</>;
  }
  // User is not authenticated, show the unprotected page (login, forgot password, etc.)
  return <>{children}</>;
};

export default UnprotectedRoute;