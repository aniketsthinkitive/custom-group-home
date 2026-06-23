// Shared types for the mock layer (kept separate to avoid import cycles between
// router.ts and the handler modules).

export interface HandlerCtx {
  /** Uppercased HTTP method, e.g. "GET". */
  method: string;
  /** Normalized path without the `/api` prefix or query string, e.g. "/leads/lead-001/". */
  path: string;
  /** Path split into non-empty segments, e.g. ["leads", "lead-001"]. */
  segments: string[];
  /** Parsed query params. */
  query: Record<string, string>;
  /** Parsed JSON request body (undefined for GET / non-JSON / FormData). */
  body: Record<string, unknown> | undefined;
}

export interface HandlerResult {
  status: number;
  data: unknown;
}
