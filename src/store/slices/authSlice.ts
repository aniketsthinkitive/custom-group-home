import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import { loginUser, refreshToken, logout, accountsAuthRetrieve, getUserDetail } from '../../sdk/sdk.gen';
import type { User } from '../../sdk/types.gen';
import { clearAuthTokens, clearAccessTokenOnly, isAccessTokenExpired, getAuthToken, getRefreshToken } from '../../utils/auth';
import { queryClient } from '../../queryClient';
import { setPermissions, clearPermissions } from './permissionsSlice';
import type { PermissionEntry } from './permissionsSlice';

/** Extract permissions from auth/me response and dispatch to permissions slice */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAndStorePermissions(dispatch: any, userData: any): void {
  if (userData?.permissions && Array.isArray(userData.permissions)) {
    dispatch(setPermissions(userData.permissions as PermissionEntry[]));
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check auth on mount
  error: null,
};

// Async thunk for login
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await loginUser({
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      });

      // Check for error response format first (when SDK returns error object with nested response)
      // This handles cases where the SDK returns { response: { status: 401, data: { message: '...' } } }
      if (response && typeof response === 'object' && 'response' in response && !('status' in response)) {
        const errorResponse = response as { response?: { status?: number; data?: { message?: string } } };
        if (errorResponse.response?.status === 401 || errorResponse.response?.status === 400) {
          const errorMessage = errorResponse.response?.data?.message || 'Invalid credentials';
          return rejectWithValue(errorMessage);
        }
      }
      
      // Check if response is an error (SDK returns error object instead of throwing when throwOnError is false)
      // The SDK client adds an 'error' property to AxiosError when there's an error
      const responseWithError = response as AxiosError & { error?: unknown };
      if (responseWithError.error) {
        const errorData = (responseWithError.error as { message?: string; details?: string }) || 
                         (responseWithError.response?.data as { message?: string; details?: string });
        const errorMessage = errorData?.message || errorData?.details || 'Login failed. Please try again.';
        return rejectWithValue(errorMessage);
      }

      // Check response status code (when response has status directly)
      if (response.status && response.status >= 400) {
        const errorData = (response.data as { message?: string; details?: string }) || 
                         (responseWithError.response?.data as { message?: string; details?: string });
        const errorMessage = errorData?.message || errorData?.details || 'Login failed. Please try again.';
        return rejectWithValue(errorMessage);
      }
      
      // Check for error response format (when SDK returns error in response.data)
      if (response.data && typeof response.data === 'object' && 'response' in response.data) {
        const errorResponse = (response.data as { response?: { status?: number; data?: { message?: string } } });
        if (errorResponse.response?.status === 401 || errorResponse.response?.status === 400) {
          const errorMessage = errorResponse.response?.data?.message || 'Invalid credentials';
          return rejectWithValue(errorMessage);
        }
      }

      // Check if response data indicates an error (backend error format)
      if (response.data && typeof response.data === 'object' && 'status' in response.data && response.data.status === 'error') {
        const errorData = response.data as { message?: string; details?: string };
        const errorMessage = errorData.message || errorData.details || 'Login failed. Please try again.';
        return rejectWithValue(errorMessage);
      }

      // Backend sets tokens in cookies. Login response is minimal; fetch full user (avatar_url, group_home) from auth/me.
      const responseData = response.data as {
        status?: string;
        data?: { user?: User };
      };
      const loginUserData = responseData.data?.user || responseData;
      // Brief delay so cookies are sent on the next request
      await new Promise((r) => setTimeout(r, 150));
      try {
        const authMe = await accountsAuthRetrieve();
        const meData = authMe?.data as { status?: string; data?: User & { permissions?: PermissionEntry[] } } | undefined;
        if (meData?.data && meData.status === 'success') {
          extractAndStorePermissions(dispatch, meData.data);
          return meData.data as User; // full user including avatar_url
        }
      } catch {
        // use login response user if auth/me fails
      }
      return loginUserData as User;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please try again.'
      );
    }
  }
);

// Async thunk for token refresh
/**
 * Discriminated result of a single refresh attempt, so concurrent callers can share
 * ONE outcome instead of each issuing its own /refresh/ call and interpreting it separately.
 */
type RefreshOutcome =
  | { ok: true; payload: unknown }
  | { ok: false; error: { authError?: boolean; networkError?: boolean; message: string } };

/**
 * Single-flight guard. While a /refresh/ call is in flight, every caller awaits the SAME
 * promise. The backend rotates AND blacklists refresh tokens on each refresh
 * (SIMPLE_JWT.ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION), so two concurrent refreshes
 * would present the same refresh token twice — the second gets a 401 and its rejected handler
 * logs the user out. On a page reload, checkAuthStatus and the axios interceptors each trigger
 * a refresh independently; collapsing them into one call removes that race.
 */
let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Classify a refresh failure. Only a server-confirmed 401/403 is an auth error (session
 * really invalid); anything else (timeout, 5xx, proxy hiccup, unknown shape) is transient -
 * logging out on those is what wiped in-progress forms when the dev server was slow.
 */
const refreshFailure = (status: number | undefined, message: string): RefreshOutcome => ({
  ok: false,
  error: status === 401 || status === 403
    ? { authError: true, message }
    : { networkError: true, message },
});

const performRefresh = async (): Promise<RefreshOutcome> => {
  // NOTE: deliberately no hasRefreshToken() fast-fail here. In production the cookies are
  // HttpOnly (not JS-readable), so js-cookie reports them missing even when the browser
  // holds a valid refresh cookie. Always attempt the call - the server is the arbiter and
  // answers 401 quickly when the cookie is truly absent.
  try {
    const response = await refreshToken({});

    // Check if response itself is an error object (when SDK returns error instead of throwing)
    // This handles cases where the SDK returns { response: { status: 401, data: { message: '...' } } }
    if (response && typeof response === 'object' && 'response' in response && !('status' in response)) {
      const errorResponse = response as { response?: { status?: number; data?: { message?: string } } };
      if ((errorResponse.response?.status ?? 0) >= 400) {
        const errorMessage = errorResponse.response?.data?.message || 'Session expired. Please login again.';
        return refreshFailure(errorResponse.response?.status, errorMessage);
      }
    }

    // Check if response is an error (SDK returns error object instead of throwing when throwOnError is false)
    const responseWithError = response as AxiosError & { error?: unknown; response?: { status?: number; data?: { message?: string } } };
    if (responseWithError.error || (responseWithError.response && responseWithError.response.status >= 400)) {
      const errorData = responseWithError.response?.data || (responseWithError.error as { message?: string });
      const errorMessage = errorData?.message || 'Session expired. Please login again.';
      return refreshFailure(responseWithError.response?.status, errorMessage);
    }

    // Check response status code (when response has status directly)
    if (response.status && response.status >= 400) {
      const errorData = (response.data as { message?: string }) || {};
      const errorMessage = errorData.message || 'Session expired. Please login again.';
      return refreshFailure(response.status, errorMessage);
    }

    // Backend sets new tokens in cookies (non-HTTP-only for localhost)
    // Tokens are automatically available in cookies after refresh
    // Preserve user data from localStorage if it exists; otherwise fetch from auth/me so navbar has user
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        return { ok: true, payload: JSON.parse(userData) };
      } catch {
        // If parsing fails, fetch user below
      }
    }
    try {
      const authResponse = await accountsAuthRetrieve();
      const data = authResponse?.data as { status?: string; data?: User } | undefined;
      if (data?.data && data.status === 'success') {
        const user = data.data as User;
        localStorage.setItem('userData', JSON.stringify(user));
        return { ok: true, payload: user };
      }
    } catch {
      // auth/me failed; return response.data so fulfilled still sets isAuthenticated
    }
    return { ok: true, payload: response.data };
  } catch (error) {
    const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string; code?: string };
    const message = err.response?.data?.message || err.message || 'Session expired. Please login again.';
    // No response / aborted / timed out -> transient; otherwise classify by status (401/403 = auth)
    if (!err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      return { ok: false, error: { networkError: true, message } };
    }
    return refreshFailure(err.response.status, message);
  }
};

/** Returns the in-flight refresh promise if one exists, otherwise starts a new single-flight refresh. */
const singleFlightRefresh = (): Promise<RefreshOutcome> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    const outcome = await singleFlightRefresh();
    if (outcome.ok) {
      return outcome.payload;
    }
    return rejectWithValue(outcome.error);
  }
);

/**
 * Clear cookies and localStorage only (no API call, no Redux).
 * Single source of truth for "cleared" storage; used by clearSessionAsync, logoutAsync, and checkAuthStatus.
 * Also clears TanStack Query cache so stale/401 data is not shown after re-login.
 */
const clearSessionStorage = (): void => {
  clearAuthTokens();
  localStorage.removeItem('userData');
  localStorage.removeItem('permissions');
  queryClient.clear();
};

/**
 * Clear access token and app state but keep refresh_token cookie.
 * Use when refresh failed so the next load can retry with the same refresh token
 * (avoids deleting refresh token when only access token was being updated).
 * Also clears TanStack Query cache.
 */
const clearSessionStorageKeepRefreshToken = (): void => {
  clearAccessTokenOnly();
  localStorage.removeItem('userData');
  localStorage.removeItem('permissions');
  queryClient.clear();
};

/**
 * Clear session without calling backend logout API.
 * Used when refresh token is missing or for full logout from interceptor.
 */
export const clearSessionAsync = createAsyncThunk(
  'auth/clearSession',
  async (_, { dispatch }) => {
    clearSessionStorage();
    dispatch(authSlice.actions.clearSession());
    dispatch(clearPermissions());
  }
);

/**
 * Clear session but keep refresh_token cookie. Use when refresh failed (auth error)
 * so we don't delete the refresh token; next checkAuth can retry refresh.
 */
export const clearSessionExceptRefreshTokenAsync = createAsyncThunk(
  'auth/clearSessionExceptRefreshToken',
  async (_, { dispatch }) => {
    clearSessionStorageKeepRefreshToken();
    dispatch(authSlice.actions.clearSession());
    dispatch(clearPermissions());
  }
);

// Async thunk for logout - only for user-initiated logout (navbars, useAuth).
// Calls backend logout API then clears session.
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await logout();
    } catch {
      // Ignore errors (e.g. network); always clear local state below
    } finally {
      clearSessionStorage();
      dispatch(authSlice.actions.clearSession());
      dispatch(clearPermissions());
    }
  }
);

/**
 * Refresh the current user from the API (auth/me or user by UUID).
 * Use after updating profile/avatar so the auth slice and navbar show the new data.
 */
export const refreshAuthUser = createAsyncThunk(
  'auth/refreshUser',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const response = await accountsAuthRetrieve();
      const data = response?.data as { status?: string; data?: (User & { permissions?: PermissionEntry[] }) } | undefined;
      if (data?.data && data.status === 'success') {
        extractAndStorePermissions(dispatch, data.data);
        return data.data as User;
      }
      // Fallback: fetch by current user uuid if we have it
      const state = getState() as { auth?: { user: User | null } };
      const currentUser = state.auth?.user;
      if (currentUser?.uuid) {
        const userResponse = await getUserDetail({ path: { uuid: currentUser.uuid } });
        const userData = userResponse?.data as { status?: string; data?: User } | undefined;
        if (userData?.data) {
          return userData.data as User;
        }
      }
      return rejectWithValue('Could not refresh user');
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (err.response?.status === 401) {
        return rejectWithValue(err.response?.data?.message ?? 'Unauthorized');
      }
      const state = getState() as { auth?: { user: User | null } };
      const currentUser = state.auth?.user;
      if (currentUser?.uuid) {
        try {
          const userResponse = await getUserDetail({ path: { uuid: currentUser.uuid } });
          const userData = userResponse?.data as { status?: string; data?: User } | undefined;
          if (userData?.data) {
            return userData.data as User;
          }
        } catch {
          // ignore
        }
      }
      return rejectWithValue(err.response?.data?.message ?? err.message ?? 'Failed to refresh user');
    }
  }
);

// Shared promise so concurrent checkAuthStatus calls wait for the in-flight check
// instead of returning unauthenticated and causing redirect before refresh completes.
let inFlightCheckPromise: Promise<{ user: User | null; authenticated: boolean }> | null = null;

/**
 * Retry reading cookies with a small delay
 * This handles cases where cookies might not be immediately available after page refresh
 */
const retryCookieRead = async <T>(
  fn: () => T | undefined,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T | undefined> => {
  for (let i = 0; i < maxRetries; i++) {
    const result = fn();
    if (result !== undefined) {
      return result;
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return undefined;
};

type CheckAuthResult = { user: User | null; authenticated: boolean };

/** Inner auth check logic; shared so concurrent callers can await the same run. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dispatch from thunk API; need .unwrap() for refreshTokenAsync
async function runCheckAuthLogic(dispatch: any): Promise<CheckAuthResult> {
  try {
      // PRIMARY CHECK: Validate that both access_token and refresh_token exist in cookies
      // Retry reading cookies in case they're not immediately available
      const accessToken = await retryCookieRead(() => getAuthToken());
      const refreshTokenValue = await retryCookieRead(() => getRefreshToken());

      // When tokens appear missing from JS (e.g. production HttpOnly cookies), do credential-based check
      // instead of clearing userData - browser will send cookies with the request
      if (!accessToken || !refreshTokenValue) {
        try {
          const authResponse = await accountsAuthRetrieve();
          const data = authResponse?.data as { status?: string; data?: (User & { permissions?: PermissionEntry[] }) } | undefined;
          if (data?.data && data.status === 'success') {
            const user = data.data as User;
            extractAndStorePermissions(dispatch, data.data);
            localStorage.setItem('userData', JSON.stringify(user));
            return { user, authenticated: true };
          }
        } catch {
          // 401 or error - will try refresh below
        }
        // Auth/me failed (threw or returned non-success; SDK may resolve not throw on 401).
        // Refresh via the thunk so it shares the single-flight guard with the interceptors
        // (a raw refreshToken({}) here would race a concurrent refresh and, with token
        // rotation + blacklist, present an already-rotated token and get a 401).
        try {
          await dispatch(refreshTokenAsync()).unwrap();
          const authResponse2 = await accountsAuthRetrieve();
          const data2 = authResponse2?.data as { status?: string; data?: (User & { permissions?: PermissionEntry[] }) } | undefined;
          if (data2?.data && data2.status === 'success') {
            const user = data2.data as User;
            extractAndStorePermissions(dispatch, data2.data);
            localStorage.setItem('userData', JSON.stringify(user));
            return { user, authenticated: true };
          }
        } catch {
          // Refresh failed - fall through to clear
        }
        clearSessionStorage();
        return { user: null, authenticated: false };
      }

      // SECONDARY CHECK: Verify userData exists in localStorage
      const userData = localStorage.getItem('userData');
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          const needsRefresh = isAccessTokenExpired(60000); // 1 minute buffer

          if (needsRefresh) {
            // Token is expired or close to expiration - refresh it
            try {
              await dispatch(refreshTokenAsync()).unwrap();
              // Refresh succeeded - fetch full user (avatar_url) if stored user is minimal
              const hasFullUser =
                typeof (parsedUser as User & { avatar_url?: unknown }).avatar_url !== 'undefined' ||
                typeof (parsedUser as User & { group_home?: unknown }).group_home !== 'undefined';
              if (!hasFullUser) {
                try {
                  const authResponse = await accountsAuthRetrieve();
                  const data = authResponse?.data as { status?: string; data?: (User & { permissions?: PermissionEntry[] }) } | undefined;
                  if (data?.data && data.status === 'success') {
                    const fullUser = data.data as User;
                    extractAndStorePermissions(dispatch, data.data);
                    localStorage.setItem('userData', JSON.stringify(fullUser));
                    return { user: fullUser, authenticated: true };
                  }
                } catch {
                  // keep parsedUser
                }
              }
              return { user: parsedUser, authenticated: true };
            } catch (refreshError) {
              // A competing refresh (another tab, or one already resolved by the interceptors)
              // may have just installed a fresh access token; if so, treat as success
              // instead of logging the user out.
              if (getAuthToken() && !isAccessTokenExpired(0)) {
                return { user: parsedUser, authenticated: true };
              }
              // Refresh failed - tokens are invalid or expired
              // Only clear if it's an authentication error, not a network/transient error.
              // When using .unwrap(), rejected thunks throw with the payload as the error.
              // Prefer the explicit flags set by performRefresh; fall back to message text
              // only for legacy string payloads.
              const flags = (typeof refreshError === 'object' && refreshError != null)
                ? (refreshError as { authError?: boolean; networkError?: boolean })
                : {};
              const errorMessage = typeof refreshError === 'string'
                ? refreshError
                : (refreshError as { message?: string; payload?: string })?.payload ||
                  (refreshError as { message?: string })?.message || '';
              const isNetworkError = flags.networkError === true ||
                                   (flags.authError !== true && (
                                     errorMessage.includes('Network') ||
                                     errorMessage.includes('timeout') ||
                                     errorMessage.includes('ECONNABORTED') ||
                                     errorMessage.includes('ERR_NETWORK')));
              const isAuthError = flags.authError === true ||
                                (!isNetworkError && (
                                  errorMessage.includes('expired') ||
                                  errorMessage.includes('invalid') ||
                                  errorMessage.includes('Invalid') ||
                                  errorMessage.includes('not found') ||
                                  errorMessage.includes('Session expired') ||
                                  errorMessage.includes('refresh token') ||
                                  errorMessage.toLowerCase().includes('inactive')));
              
              if (isAuthError && !isNetworkError) {
                clearSessionStorageKeepRefreshToken();
                return { user: null, authenticated: false };
              }
              // For network errors, keep current state
              if (isNetworkError) {
                const userData = localStorage.getItem('userData');
                if (userData) {
                  try {
                    return { user: JSON.parse(userData), authenticated: true };
                  } catch {
                    return { user: null, authenticated: false };
                  }
                }
              }
              // Default: treat as auth error if we can't determine; keep refresh token for retry
              clearSessionStorageKeepRefreshToken();
              return { user: null, authenticated: false };
            }
          } else {
            // Token is still valid. If stored user is minimal (no avatar_url), fetch full user from auth/me.
            const hasFullUser =
              typeof (parsedUser as User & { avatar_url?: unknown }).avatar_url !== 'undefined' ||
              typeof (parsedUser as User & { group_home?: unknown }).group_home !== 'undefined';
            if (!hasFullUser) {
              try {
                const authResponse = await accountsAuthRetrieve();
                const data = authResponse?.data as { status?: string; data?: (User & { permissions?: PermissionEntry[] }) } | undefined;
                if (data?.data && data.status === 'success') {
                  const fullUser = data.data as User;
                  extractAndStorePermissions(dispatch, data.data);
                  localStorage.setItem('userData', JSON.stringify(fullUser));
                  return { user: fullUser, authenticated: true };
                }
              } catch {
                // keep parsedUser
              }
            }
            return { user: parsedUser, authenticated: true };
          }
        } catch {
          // Invalid JSON in localStorage - clear it
          clearSessionStorage();
          return { user: null, authenticated: false };
        }
      }

      // Tokens exist but no userData - check if we need to refresh
      const needsRefresh = isAccessTokenExpired(60000);
      
      if (needsRefresh) {
        // Token is expired - try to refresh to get new tokens
        // This handles edge case where cookies exist but localStorage was cleared
        try {
          await dispatch(refreshTokenAsync()).unwrap();
          // Refresh succeeded - refreshTokenAsync fetches auth/me and stores userData when
          // localStorage was empty, so read it back instead of forcing a re-login (which
          // bounced the user through /login to the default admin page).
          const restored = localStorage.getItem('userData');
          if (restored) {
            try {
              return { user: JSON.parse(restored), authenticated: true };
            } catch {
              // corrupted userData - fall through to unauthenticated
            }
          }
          return { user: null, authenticated: false };
        } catch {
          // Refresh failed - clear access token and state but keep refresh token for retry
          clearSessionStorageKeepRefreshToken();
          return { user: null, authenticated: false };
        }
      } else {
        // Token is valid but no userData (e.g. localStorage was cleared by clearSessionExceptRefreshToken)
        // Fetch user from auth/me and repopulate so we don't log out on full page reload
        try {
          const authResponse = await accountsAuthRetrieve();
          const data = authResponse?.data as { status?: string; data?: (User & { permissions?: PermissionEntry[] }) } | undefined;
          if (data?.data && data.status === 'success') {
            const user = data.data as User;
            extractAndStorePermissions(dispatch, data.data);
            localStorage.setItem('userData', JSON.stringify(user));
            return { user, authenticated: true };
          }
        } catch {
          // auth/me failed (e.g. token invalid) - clear and require login
        }
        clearSessionStorage();
        return { user: null, authenticated: false };
      }
  } catch {
    return { user: null, authenticated: false };
  }
}

// Check auth status on app load (and when re-entering protected route).
// Concurrent callers await the same in-flight check so we don't redirect to login
// before refresh completes when access token is expired but refresh token is valid.
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { dispatch }) => {
    if (inFlightCheckPromise) {
      return inFlightCheckPromise;
    }
    inFlightCheckPromise = runCheckAuthLogic(dispatch).finally(() => {
      inFlightCheckPromise = null;
    });
    return inFlightCheckPromise;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('userData', JSON.stringify(action.payload));
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    /** Pure state reset for unauthenticated session. Used with clearSessionStorage() by clearSessionAsync and logoutAsync. */
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload as User;
        state.isAuthenticated = true;
        state.error = null;
        
        // Store user data in localStorage
        // Note: access_token is already stored in loginAsync thunk
        localStorage.setItem('userData', JSON.stringify(action.payload));
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Refresh Token
    builder
      .addCase(refreshTokenAsync.pending, (state) => {
        // Keep current state while refreshing - don't set loading to avoid UI flicker
        void state;
      })
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        // Refresh succeeded - tokens are valid
        state.isAuthenticated = true;
        state.error = null;
        // Preserve user data if it was returned from the thunk (from localStorage)
        if (action.payload && typeof action.payload === 'object' && 'id' in action.payload) {
          state.user = action.payload as unknown as User;
          localStorage.setItem('userData', JSON.stringify(action.payload));
        } else {
          // Try to get user from localStorage if not in payload
          const userData = localStorage.getItem('userData');
          if (userData) {
            try {
              state.user = JSON.parse(userData);
            } catch {
              // If parsing fails, keep current state
            }
          }
        }
      })
      .addCase(refreshTokenAsync.rejected, (state, action) => {
        // Refresh failed - only clear auth state if it's a real authentication error
        // Network errors should not cause logout
        const payload = action.payload as { authError?: boolean; networkError?: boolean; message?: string } | string;
        const message = typeof payload === 'object' && payload?.message != null ? payload.message : (payload as string);
        // Object payloads carry explicit flags from performRefresh - trust them (a transient
        // failure's fallback message can contain "expired" and must NOT clear auth state).
        // Message heuristics only apply to legacy string payloads.
        const isAuthError = typeof payload === 'object' && payload != null
          ? payload.authError === true
          : (typeof message === 'string' && (message.includes('expired') || message.includes('invalid') || message.includes('not found') || message.toLowerCase().includes('inactive')));

        // Don't clear if a competing refresh (e.g. another tab) already installed a valid
        // access token - the failure was a lost race, not an expired session.
        if (isAuthError && !(getAuthToken() && !isAccessTokenExpired(0))) {
          state.isAuthenticated = false;
          state.user = null;
          localStorage.removeItem('userData');
          localStorage.removeItem('permissions');
        }
      });

    // Logout
    builder
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // Refresh auth user (e.g. after profile/avatar update)
    builder
      .addCase(refreshAuthUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          localStorage.setItem('userData', JSON.stringify(action.payload));
        }
      })
      .addCase(refreshAuthUser.rejected, () => {
        // Keep current user on refresh failure (e.g. network)
      });

    // Check Auth Status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        const payload = action.payload as { user: User | null; authenticated: boolean } | null;
        
        if (payload && payload.authenticated) {
          state.isAuthenticated = true;
          if (payload.user) {
            state.user = payload.user;
          }
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
        state.isLoading = false;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.isLoading = false;
      });
  },
});

export const { clearError, setUser, clearUser, clearSession } = authSlice.actions;
export default authSlice.reducer;

/** Selector for components that only need loading and error (e.g. LoginForm) to reduce rerenders */
export const selectAuthLoadingError = (state: { auth: AuthState }) => ({
  isLoading: state.auth.isLoading,
  error: state.auth.error,
});
