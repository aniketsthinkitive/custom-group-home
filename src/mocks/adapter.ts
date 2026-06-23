// Custom axios adapter: replaces the network transport. Every request is parsed into a
// HandlerCtx, routed locally (router.ts), and resolved with a synthetic AxiosResponse — or
// rejected with an AxiosError-shaped object for >=400 so the SDK's error handling (which sets
// `.error` from `response.data`) and the auth slice behave exactly as with a real server.

import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { routeRequest } from './router';
import type { HandlerCtx } from './types';

function stripApiPrefix(path: string): string {
  const idx = path.indexOf('/api/');
  if (idx >= 0) return path.slice(idx + 4); // keep the leading slash of the resource
  if (path === '/api' || path.startsWith('/api/')) return path.slice(4) || '/';
  return path;
}

function parsePathAndQuery(url: string): { path: string; query: Record<string, string> } {
  let work = url;
  const protoIdx = work.indexOf('://');
  if (protoIdx >= 0) {
    const slash = work.indexOf('/', protoIdx + 3);
    work = slash >= 0 ? work.slice(slash) : '/';
  }
  const [rawPath, rawQuery = ''] = work.split('?');
  const path = stripApiPrefix(rawPath);
  const query: Record<string, string> = {};
  if (rawQuery) {
    new URLSearchParams(rawQuery).forEach((v, k) => {
      query[k] = v;
    });
  }
  return { path, query };
}

function parseBody(data: unknown): Record<string, unknown> | undefined {
  if (data == null) return undefined;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const obj: Record<string, unknown> = {};
    data.forEach((v, k) => {
      obj[k] = v instanceof File ? v.name : v;
    });
    return obj;
  }
  if (typeof data === 'object') return data as Record<string, unknown>;
  return undefined;
}

function mergeQuery(fromUrl: Record<string, string>, params: unknown): Record<string, string> {
  const out = { ...fromUrl };
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
      if (v != null) out[k] = String(v);
    }
  }
  return out;
}

function rejection(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: `Request failed with status code ${status}`,
    config,
    response: { data, status, statusText: '', headers: {}, config },
  };
}

export const mockAdapter: AxiosAdapter = (config) => {
  const method = (config.method ?? 'get').toUpperCase();
  const url = config.url ?? '';
  const { path, query: urlQuery } = parsePathAndQuery(url);
  const ctx: HandlerCtx = {
    method,
    path,
    segments: path.split('/').filter(Boolean),
    query: mergeQuery(urlQuery, config.params),
    body: parseBody(config.data),
  };

  const result = routeRequest(ctx);

  if (result.status >= 400) {
    return Promise.reject(rejection(config, result.status, result.data));
  }

  const response = {
    data: result.data,
    status: result.status,
    statusText: 'OK',
    headers: {},
    config,
  } as AxiosResponse;
  return Promise.resolve(response);
};
