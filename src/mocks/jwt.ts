// Builds a fake-but-well-formed JWT so the existing token logic in `src/utils/auth.ts`
// (isTokenExpired → atob(parts[1]) → payload.exp) parses it and sees a far-future expiry.
// This keeps the proactive-refresh path from firing in a loop. The token is NOT signed and
// carries no security meaning — this is a prototype with no real auth.

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Far-future expiry: 2100-01-01 in seconds (JWT `exp` is in seconds). */
const FAR_FUTURE_EXP = 4102444800;

export function makeMockJwt(payload: Record<string, unknown> = {}): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(
    JSON.stringify({ iat: 1700000000, exp: FAR_FUTURE_EXP, ...payload }),
  );
  return `${header}.${body}.mock-signature`;
}
