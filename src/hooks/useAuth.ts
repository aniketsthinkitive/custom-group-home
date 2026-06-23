import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginAsync, logoutAsync, clearError } from '../store/slices/authSlice';

/**
 * Custom hook for authentication operations
 * Provides convenient access to auth state and methods
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const result = await dispatch(loginAsync(credentials));
      return result;
    },
    [dispatch]
  );

  /**
   * Logout and redirect to login page
   */
  const logout = useCallback(async () => {
    await dispatch(logoutAsync());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  /**
   * Clear authentication error
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    // Methods
    login,
    logout,
    clearAuthError,
  };
};

