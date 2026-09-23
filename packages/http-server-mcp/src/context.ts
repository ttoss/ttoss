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

/**
 * Returns the headers `getApiHeaders` produced for the current MCP request —
 * the same headers `apiCall` injects. Use it inside a tool handler that runs
 * its own HTTP client instead of `apiCall`, so caller credentials still reach
 * the upstream API.
 *
 * Returns `{}` outside a request, or when `getApiHeaders` is not configured.
 */
export const getApiHeaders = (): Record<string, string> => {
  return { ...(requestContextStore.getStore()?.apiHeaders ?? {}) };
};
