import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { isAuthenticated as checkAuth } from '../utils/auth';
import CommonNavbar from '../components/nav-bar/CommonNavbar';
import { useAppDispatch } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Re-validates auth when navigating to a protected route (e.g. browser Back from /login).
 * Without this, Redux auth state is only set once on app load, so Back would redirect
 * to login again without trying refresh or re-reading cookies.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAuth();

  // When pathname changes (e.g. user clicks Back to a protected route), re-run auth check
  // so we don't rely on stale state. Do NOT dispatch while isLoading: a check is already
  // in progress (e.g. refresh); a second dispatch would have raced and could redirect before refresh completes.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !checkAuth()) {
      dispatch(checkAuthStatus());
    }
  }, [location.pathname, dispatch, isAuthenticated, isLoading]); // checkAuth() intentionally omitted (reads cookies on each call)

  // Show app shell (navbar + main area) while checking auth so LCP is not delayed by a blank screen
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CommonNavbar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mt: '64px',
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Redirect only after loading is done and both Redux and cookie check say unauthenticated.
  // Pass the current location so login (or a silent re-auth on /login) can return the user
  // here instead of the default admin page.
  if (!isAuthenticated && !checkAuth()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;