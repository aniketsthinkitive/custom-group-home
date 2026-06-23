// Client-side auth handlers for the prototype.
//
// The real backend set tokens via Set-Cookie; the adapter bypasses the network, so these
// handlers set the cookies themselves (js-cookie) using JWT-shaped mock tokens with a
// far-future expiry, and record the active demo account in localStorage. The existing
// authSlice / utils/auth flow then works unchanged: getAuthToken() reads the cookie,
// isAccessTokenExpired() parses the JWT, and accountsAuthRetrieve() returns the user.

import Cookies from 'js-cookie';
import { STORAGE_KEYS } from './config';
import { makeMockJwt } from './jwt';
import { findDemoAccount, findDemoUserByEmail } from './seed/accounts';
import type { HandlerResult } from './types';

const COOKIE_OPTS = { expires: 7, sameSite: 'Lax' as const, secure: false };

function startSession(email: string): void {
  const access = makeMockJwt({ sub: email, email });
  const refresh = makeMockJwt({ sub: email, email, typ: 'refresh' });
  Cookies.set('access_token', access, COOKIE_OPTS);
  Cookies.set('refresh_token', refresh, COOKIE_OPTS);
  try {
    localStorage.setItem(STORAGE_KEYS.session, email);
  } catch {
    // ignore storage failures (private mode)
  }
}

function clearSession(): void {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    // ignore
  }
}

function currentEmail(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.session);
  } catch {
    return null;
  }
}

export function handleLogin(body: Record<string, unknown> | undefined): HandlerResult {
  const email = String(body?.email ?? '');
  const password = String(body?.password ?? '');
  const account = findDemoAccount(email, password);
  if (!account) {
    return {
      status: 401,
      data: { status: 'error', code: 401, message: 'Invalid credentials', detail: 'Invalid credentials' },
    };
  }
  startSession(account.email);
  // Return a MINIMAL user (no avatar_url / group_home) on login. LoginForm stores this via
  // setUser without loading permissions; the app only loads permissions through
  // checkAuthStatus → accountsAuthRetrieve, and that call is skipped when the stored user
  // looks "full". Keeping the login user minimal makes checkAuthStatus fetch auth/me, which
  // returns the full user WITH permissions → nav tabs unlock. (auth/me handler below.)
  const u = account.user;
  const minimalUser = {
    uuid: u.uuid,
    username: u.username,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    phone: u.phone,
    active: u.active,
    role: u.role,
    role_type: u.role_type,
  };
  return {
    status: 200,
    data: {
      status: 'success',
      code: 200,
      message: 'Login successful',
      data: {
        user: minimalUser,
        access: Cookies.get('access_token'),
        refresh: Cookies.get('refresh_token'),
      },
    },
  };
}

export function handleAuthRetrieve(): HandlerResult {
  const email = currentEmail();
  const user = email ? findDemoUserByEmail(email) : undefined;
  if (!user) {
    return { status: 401, data: { status: 'error', code: 401, message: 'Not authenticated' } };
  }
  return { status: 200, data: { status: 'success', code: 200, message: 'OK', data: user } };
}

export function handleRefresh(): HandlerResult {
  const email = currentEmail();
  if (!email) {
    return { status: 401, data: { status: 'error', code: 401, message: 'Session expired' } };
  }
  Cookies.set('access_token', makeMockJwt({ sub: email, email }), COOKIE_OPTS);
  return {
    status: 200,
    data: { status: 'success', code: 200, message: 'Token refreshed', data: { access: Cookies.get('access_token') } },
  };
}

export function handleLogout(): HandlerResult {
  clearSession();
  return { status: 200, data: { status: 'success', code: 200, message: 'Logged out' } };
}
