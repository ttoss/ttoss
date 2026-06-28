import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  apiBaseUrl?: string;
  apiHeaders: Record<string, string>;
  identity?: unknown;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

/**
 * Returns the verified JWT payload for the current MCP request.
 * Only available inside a tool handler when `auth` is configured on the router.
 *
 * Accepts an optional type parameter to avoid casting at call sites:
 * `getIdentity<{ sub: string; email: string }>()` returns `T | undefined`.
 * Omitting the type parameter keeps the return type as `unknown | undefined`.
 */
export const getIdentity = <T = unknown>(): T | undefined => {
  return requestContextStore.getStore()?.identity as T | undefined;
};
