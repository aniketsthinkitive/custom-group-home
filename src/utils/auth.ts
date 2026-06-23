import Cookies from 'js-cookie';

/**
 * Get the authentication token from cookies
 * For localhost development, we use non-HTTP-only cookies so JavaScript can read them
 */
export const getAuthToken = (): string | undefined => {
  return Cookies.get('access_token') || 
         Cookies.get('token') || 
         Cookies.get('accessToken');
};

/**
 * Get the refresh token from cookies
 */
export const getRefreshToken = (): string | undefined => {
  return Cookies.get('refresh_token') || Cookies.get('refreshToken');
};

/**
 * Check if both access_token and refresh_token cookies exist
 * This is the primary validation for authentication
 */
export const hasAuthTokens = (): boolean => {
  const accessToken = getAuthToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken && refreshToken);
};

/**
 * Check if access token exists in cookies
 */
export const hasAccessToken = (): boolean => {
  return !!getAuthToken();
};

/**
 * Check if refresh token exists in cookies
 */
export const hasRefreshToken = (): boolean => {
  return !!getRefreshToken();
};

/**
 * Check if JWT token is expired or close to expiration
 * @param token - JWT token string
 * @param bufferMs - Buffer time in milliseconds before expiration (default: 60000 = 1 minute)
 * @returns true if token is expired or will expire within buffer time
 */
export const isTokenExpired = (token: string | undefined, bufferMs: number = 60000): boolean => {
  if (!token) return true;
  
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid token format
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration claim
    if (!payload.exp) {
      return true; // No expiration claim, treat as expired
    }
    
    // Convert expiration time to milliseconds (JWT exp is in seconds)
    const exp = payload.exp * 1000;
    const now = Date.now();
    
    // Return true if expired or expires within buffer time
    return exp <= now + bufferMs;
  } catch (error) {
    // If we can't parse the token, treat it as expired
    console.error('Error parsing token expiration:', error);
    return true;
  }
};

/**
 * Check if access token is expired or needs refresh
 * @param bufferMs - Buffer time in milliseconds before expiration (default: 60000 = 1 minute)
 * @returns true if access token is expired or will expire soon
 */
export const isAccessTokenExpired = (bufferMs: number = 60000): boolean => {
  const token = getAuthToken();
  return isTokenExpired(token, bufferMs);
};

/**
 * Set access token in cookie
 * For localhost: non-HTTP-only cookie so JavaScript can read it
 */
export const setAccessToken = (token: string): void => {
  Cookies.set('access_token', token, {
    expires: 15 / (24 * 60), // 15 minutes in days
    sameSite: 'Lax', // Works with Vite proxy on localhost
    secure: false, // false for localhost (http)
  });
};

/**
 * Set refresh token in cookie
 * For localhost: non-HTTP-only cookie so JavaScript can read it
 */
export const setRefreshToken = (token: string): void => {
  Cookies.set('refresh_token', token, {
    expires: 7, // 7 days
    sameSite: 'Lax', // Works with Vite proxy on localhost
    secure: false, // false for localhost (http)
  });
};

/**
 * Clear all authentication cookies
 */
export const clearAuthTokens = (): void => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  Cookies.remove('token');
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
};

/**
 * Clear only access token cookies (leave refresh token).
 * Use when refresh endpoint returned 401 so we don't wipe a valid refresh token
 * (e.g. if backend didn't receive the cookie); next checkAuth can retry refresh.
 */
export const clearAccessTokenOnly = (): void => {
  Cookies.remove('access_token');
  Cookies.remove('token');
  Cookies.remove('accessToken');
};

/**
 * Check if user is authenticated
 * Primary check: Both access_token and refresh_token must exist in cookies
 * Secondary check: localStorage userData (for backward compatibility)
 */
export const isAuthenticated = (): boolean => {
  // Primary check: Both tokens must exist in cookies
  if (hasAuthTokens()) {
    return true;
  }
  
  // Secondary check: localStorage userData (fallback, but tokens should be primary)
  const userData = localStorage.getItem('userData');
  if (userData) {
    // If userData exists but tokens don't, tokens may have expired
    // Still return true to let the refresh mechanism handle it
    return true;
  }
  
  return false;
};

/**
 * Get user data from localStorage
 */
interface UserData {
  role?: string | { type?: string };
  role_type?: string;
  [key: string]: unknown;
}

export const getUserData = (): UserData | null => {
  try {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const parsedData = JSON.parse(userDataStr) as 
        | UserData 
        | { data?: { user?: UserData }; user?: UserData }
        | Record<string, unknown>;
      
      // Extract user from data.user if the structure is {data: {user: {...}}}
      if (parsedData && typeof parsedData === 'object' && 'data' in parsedData) {
        const dataObj = parsedData as { data?: { user?: UserData } };
        if (dataObj.data?.user) {
          return dataObj.data.user;
        }
      }
      
      // Extract user from user property if the structure is {user: {...}}
      if (parsedData && typeof parsedData === 'object' && 'user' in parsedData) {
        const userObj = parsedData as { user?: UserData };
        if (userObj.user) {
          return userObj.user;
        }
      }
      
      // Otherwise, treat the whole object as UserData
      return parsedData as UserData;
    }
  } catch (error) {
    console.error('Error parsing userData from localStorage:', error);
  }
  return null;
};

/**
 */
/**
 * Get user role type from localStorage
 * Handles multiple formats:
 * - role as string: "AGENT", "GUARDIAN", "ADMIN", "STAFF"
 * - role as object: { type: "AGENT" }
 * - role_type as string
 */
export const getUserRoleType = (): string | null => {
  const user = getUserData();
  if (!user) {
    return null;
  }
  
  // Handle role as string (e.g., "AGENT", "GUARDIAN")
  if (typeof user.role === 'string') {
    return user.role;
  }
  
  // Handle role as object with type property (e.g., { type: "AGENT" })
  if (user.role && typeof user.role === 'object' && 'type' in user.role) {
    return user.role.type || null;
  }
  
  // Handle role_type as fallback
  if (user.role_type) {
    return user.role_type;
  }
  
  return null;
}

/** Role types that access the admin panel (type is not unique — multiple role names share the same type) */
const ADMIN_PANEL_ROLES = new Set(['ADMIN', 'STAFF']);

/**
 * Check if user has an admin-panel role
 */
export const isAdminOrStaff = (): boolean => {
  const roleType = getUserRoleType();
  return roleType !== null && ADMIN_PANEL_ROLES.has(roleType);
};

/**
 * Check if user has guardian or agent role
 */
export const isGuardianOrAgent = (): boolean => {
  const roleType = getUserRoleType();
  return roleType === 'GUARDIAN' || roleType === 'AGENT';
};

/**
 * Get the default redirect path based on user role
 */
export const getDefaultRedirectPath = (): string => {
  if (isAdminOrStaff()) {
    return '/admin'; // AdminDefaultRedirect will pick the first accessible page
  } else if (isGuardianOrAgent()) {
    return '/portal/careplan';
  }
  // Default fallback
  return '/admin';
};
