// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- value import required so declaration bundler emits `export { McpServer }` not `export type { McpServer }`
import { McpServer } from '@modelcontextprotocol/server';
import {
  protectedResourceMetadataDocument,
  protectedResourceMetadataPaths,
  protectedResourceMetadataUrl,
} from '@ttoss/auth-core';
import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import { Router } from '@ttoss/http-server';
import { authMiddleware } from '@ttoss/http-server-auth';
import type Koa from 'koa';

import { getIdentity, requestContextStore } from './context';
import { createMcpRequestServer } from './serveMcpRequest';

type Context = Koa.Context;

/** Amazon Cognito user pool configuration for JWT verification. */
export interface CognitoUserPoolConfig {
  /** The Cognito User Pool ID (e.g. `us-east-1_abc123`). */
  userPoolId: string;
  /**
   * Which token type to verify.
   * @default 'access'
   */
  tokenUse?: 'access' | 'id';
  /** The app client ID registered in the User Pool. */
  clientId: string;
}

/**
 * Authentication options for the MCP endpoint. Verification runs through
 * `@ttoss/http-server-auth`'s `oauth` strategy; supply either a Cognito user
 * pool or a custom `verifyToken`.
 */
export interface McpAuthOptions {
  /** Amazon Cognito user pool config; a `CognitoJwtVerifier` is built from it. */
  cognitoUserPool?: CognitoUserPoolConfig;
  /**
   * Custom token verifier for non-Cognito providers (Auth0, Keycloak, your own
   * JWTs, opaque tokens). Resolve with the verified payload, or throw to reject.
   */
  verifyToken?: (token: string) => Promise<unknown>;
  /**
   * Scopes that must all be present on the token, else `403`.
   * `verifyToken` may return either `scope: string` (space-separated) or
   * `scopes: string[]`; both are normalised internally.
   */
  requiredScopes?: string[];
  /**
   * JSON-RPC methods (read from `body.method`) that bypass verification.
   *
   * The lifecycle handshake is public because the MCP authorization spec
   * sanctions it: a client completes it before it can discover the
   * authorization server. That means one entry per protocol era —
   * `initialize` on 2025, `server/discover` on `2026-07-28`, which removed
   * `initialize` — so neither era is left unable to negotiate. Nothing else
   * is public, so a server with `auth` configured serves no tool metadata to
   * an unauthenticated caller.
   *
   * Opening `tools/list` is a deliberate choice, not a default. It serves the
   * full tool catalogue — every name, description, and input schema — to
   * anyone who can reach the endpoint, which for an OpenAPI-derived server is
   * a map of the whole underlying API. It buys an OAuth client nothing: the
   * `401` and its RFC 9728 `WWW-Authenticate` challenge are what start the
   * authorization flow, and a client that lists tools anonymously still
   * cannot call one. Set it only to serve callers that will never
   * authenticate.
   *
   * @default ['initialize', 'server/discover']
   *
   * @example
   * ```typescript
   * // Restore unauthenticated tool discovery.
   * publicMethods: ['initialize', 'tools/list'],
   *
   * // Require a token for the handshake too, so an OAuth client
   * // self-discovers from its very first request.
   * publicMethods: [],
   * ```
   */
  publicMethods?: string[];
  /**
   * URL advertised in `WWW-Authenticate: Bearer resource_metadata="…"`
   * (RFC 9728) on a `401`, so MCP clients can discover the authorization
   * server.
   *
   * Defaults to the location derived from `resourceServerUrl` + `path` — the
   * same location this router serves the document at — so the header cannot
   * drift from the routes. The default applies only when the document is
   * actually served (both `resourceServerUrl` and `authorizationServerUrl`
   * set); otherwise the header stays a bare `Bearer` rather than advertising a
   * location with no route.
   *
   * **Leave it unset when this router serves the document.** It exists for the
   * one configuration where that is deliberately not the case: an
   * authorization server in the same deployment (`oauthServer({ resource })`)
   * already answers `/.well-known/oauth-protected-resource`, so mounting this
   * router with `resourceServerUrl` + `authorizationServerUrl` too would put
   * two routers on one path. Omit both there and set this instead — without
   * it the `401` is a bare `Bearer`, which never starts a client's discovery.
   *
   * Derive the value rather than typing it: `protectedResourceMetadataUrl`
   * from `@ttoss/auth-core` applies the same RFC 9728 §3.1 rule the serving
   * side does. A hand-written value that names a location nothing serves
   * fails discovery silently.
   *
   * @example
   * ```typescript
   * // Only when oauthServer (not this router) serves the document.
   * resourceMetadataUrl: protectedResourceMetadataUrl({
   *   resource: 'https://mcp.example.com/mcp',
   * }),
   * ```
   */
  resourceMetadataUrl?: string;
  /**
   * URL of this MCP server, surfaced in the OAuth Protected Resource Metadata
   * response. Both this and `authorizationServerUrl` must be set to serve
   * `/.well-known/oauth-protected-resource`.
   */
  resourceServerUrl?: string;
  /** URL of the OAuth Authorization Server that issues tokens for this resource. */
  authorizationServerUrl?: string;
  /**
   * Expected audience — the resource indicator (RFC 8707) this MCP server
   * identifies as. When set, the verified token's `aud` claim must include at
   * least one of these values, or the request is rejected with `401`. Without
   * this check, a token minted for a *different* resource but signed by the
   * same authorization server would still be accepted here — the classic
   * confused-deputy risk RFC 8707 exists to close.
   *
   * Applies uniformly regardless of whether verification is done via
   * `cognitoUserPool`, a custom `verifyToken`, or `@ttoss/auth-core/oidc`'s
   * `createOidcVerifier` (which intentionally leaves audience validation to
   * the caller for this reason).
   *
   * @example 'https://mcp.example.com'
   */
  resourceIndicator?: string | string[];
}

/**
 * MCP lifecycle handshakes reachable before a client authenticates.
 *
 * One entry per protocol era, because the exemption the MCP authorization spec
 * sanctions is about *the handshake* — a client has to complete it before it
 * can discover the authorization server — not about a method name:
 *
 * - `initialize` is the 2025-era handshake.
 * - `server/discover` is its `2026-07-28` replacement. That revision removed
 *   `initialize` entirely, so naming only `initialize` left the modern era
 *   with no public method at all — the asymmetry ttoss/ttoss#1222 fixed.
 *
 * A future revision that renames the handshake again needs a matching entry
 * here; nothing detects that automatically.
 *
 * `tools/list` is deliberately absent — see {@link McpAuthOptions.publicMethods}.
 */
const DEFAULT_PUBLIC_METHODS = ['initialize', 'server/discover'];

/**
 * Asserts that a verified token's `aud` claim includes at least one of the
 * expected resource indicator values. `aud` may be a single string or an
 * array of strings per the JWT spec (RFC 7519); both forms are checked.
 */
const assertResourceIndicator = (
  payload: unknown,
  resourceIndicator: string | string[]
): void => {
  const expected = Array.isArray(resourceIndicator)
    ? resourceIndicator
    : [resourceIndicator];

  const aud = (payload as { aud?: unknown } | undefined)?.aud;
  const actualAudiences =
    typeof aud === 'string' ? [aud] : Array.isArray(aud) ? aud : [];

  const matches = actualAudiences.some((audience) => {
    return typeof audience === 'string' && expected.includes(audience);
  });

  if (!matches) {
    throw new Error(
      `Token audience does not include the expected resource indicator ` +
        `(expected one of: ${expected.join(', ')}).`
    );
  }
};

/** Builds the token verifier from the MCP auth options. */
const buildVerifyToken = (
  auth: McpAuthOptions
): ((token: string) => Promise<unknown>) => {
  const verify = (() => {
    if (auth.cognitoUserPool) {
      const verifier = CognitoJwtVerifier.create({
        tokenUse: 'access',
        ...auth.cognitoUserPool,
      });
      return (token: string) => {
        return verifier.verify(token);
      };
    }
    if (auth.verifyToken) {
      return auth.verifyToken;
    }
    throw new Error(
      'McpAuthOptions requires either cognitoUserPool or verifyToken'
    );
  })();

  if (!auth.resourceIndicator) {
    return verify;
  }

  return async (token: string) => {
    const payload = await verify(token);
    assertResourceIndicator(payload, auth.resourceIndicator!);
    return payload;
  };
};

/**
 * Options for a single `apiCall` request.
 */
export interface ApiCallOptions {
  /**
   * JSON-serialisable request body. Automatically serialised and sent with
   * `Content-Type: application/json`.
   */
  body?: unknown;

  /**
   * Additional or override headers for this specific request.
   * These are merged on top of any headers injected from the MCP request
   * context via `getApiHeaders`, allowing per-call overrides.
   */
  headers?: Record<string, string>;
}

/**
 * Generic HTTP helper for use inside MCP tool handlers.
 *
 * Accepts any full URL (third-party APIs, public APIs, etc.) or a path
 * relative to the `apiBaseUrl` configured in `createMcpRouter`.
 *
 * Headers configured via `getApiHeaders` in `createMcpRouter` are injected
 * automatically into every request, allowing transparent forwarding of auth
 * tokens, API keys, or any other header — without coupling this helper to a
 * specific authentication scheme. Per-call `options.headers` take precedence
 * over context-injected headers.
 *
 * @param method - HTTP method (e.g. `'GET'`, `'POST'`, `'PUT'`, `'DELETE'`)
 * @param url - Full URL **or** a path starting with `/` (appended to `apiBaseUrl`)
 * @param options - Optional body and per-call header overrides
 * @returns Parsed JSON response body
 *
 * @example Bearer token forwarding (configured once in `createMcpRouter`)
 * ```typescript
 * import { apiCall, createMcpRouter, McpServer } from '@ttoss/http-server-mcp';
 *
 * // Tool handler – no manual auth wiring needed
 * mcpServer.registerTool('list-portfolios', { description: '...', inputSchema: {} }, async () => {
 *   const data = await apiCall('GET', '/portfolios');
 *   return { content: [{ type: 'text', text: JSON.stringify(data) }] };
 * });
 *
 * const mcpRouter = createMcpRouter(mcpServer, {
 *   apiBaseUrl: `http://localhost:${process.env.PORT}/api/v1`,
 *   // Forward the caller's Bearer token to every apiCall
 *   getApiHeaders: (ctx) => ({ Authorization: ctx.headers.authorization ?? '' }),
 * });
 * ```
 *
 * @example x-api-key forwarding
 * ```typescript
 * const mcpRouter = createMcpRouter(mcpServer, {
 *   apiBaseUrl: 'https://internal-service/api',
 *   getApiHeaders: (ctx) => ({
 *     'x-api-key': ctx.headers['x-api-key'] as string,
 *   }),
 * });
 * ```
 *
 * @example Third-party or public API (full URL, no context required)
 * ```typescript
 * const weather = await apiCall('GET', 'https://api.weather.com/current?city=Berlin');
 * const created = await apiCall('POST', 'https://api.example.com/items', {
 *   body: { name: 'widget' },
 *   headers: { Authorization: 'Bearer fixed-service-token' },
 * });
 * ```
 */
export const apiCall = async (
  method: string,
  url: string,
  options?: ApiCallOptions
  // eslint-disable-next-line complexity
): Promise<unknown> => {
  const context = requestContextStore.getStore();

  // Resolve the URL: if it starts with '/', prepend the apiBaseUrl from context.
  // Trim a trailing slash from apiBaseUrl so that joining with a leading-slash
  // path never produces a double slash (e.g. "https://host/api//items").
  let resolvedUrl = url;
  if (url.startsWith('/')) {
    if (!context?.apiBaseUrl) {
      throw new Error(
        `apiCall received a relative path ("${url}") but no apiBaseUrl is configured. ` +
          'Either pass a full URL or set apiBaseUrl in createMcpRouter options.'
      );
    }
    resolvedUrl = `${context.apiBaseUrl.replace(/\/$/, '')}${url}`;
  }

  const hasBody = options?.body !== undefined;

  // Merge context-injected headers with per-call overrides.
  const headers: Record<string, string> = {
    ...(context !== undefined ? context.apiHeaders : {}),
    ...(options?.headers ?? {}),
  };

  // Only add Content-Type when sending a body and the caller hasn't set one.
  const hasExplicitContentType = Object.keys(headers).some((headerName) => {
    return headerName.toLowerCase() === 'content-type';
  });
  if (hasBody && !hasExplicitContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(resolvedUrl, {
    method,
    headers,
    body: hasBody ? JSON.stringify(options!.body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => {
      return { error: response.statusText };
    });

    throw new Error(
      (err as { error?: string }).error || `HTTP ${response.status}`
    );
  }

  // 204/205 responses have no body.
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

export { getIdentity } from './context';

/**
 * Asserts that the current request's token contains all required scopes.
 * Throws if any scope is missing — the MCP SDK catches this and returns a
 * tool error to the client. Use inside tool handlers for per-tool authorization.
 *
 * Accepts either `scope: string` (space-separated, standard JWT claim) or
 * `scopes: string[]` from `verifyToken`. If neither is present and `required`
 * is non-empty, throws with a descriptive message instead of a silent 403.
 *
 * @example
 * ```typescript
 * server.tool('delete-user', schema, async (args) => {
 *   checkScopes(['admin', 'write:users']);
 *   // proceed only if caller has both scopes
 * });
 * ```
 */
export const checkScopes = (required: string[]): void => {
  const identity = getIdentity() as
    { scope?: string; scopes?: string[] } | undefined;
  let scopeString: string | null = null;
  if (typeof identity?.scope === 'string') {
    scopeString = identity.scope;
  } else if (
    Array.isArray(identity?.scopes) &&
    identity.scopes.every((s) => {
      return typeof s === 'string';
    })
  ) {
    scopeString = (identity.scopes as string[]).join(' ');
  }
  if (scopeString === null && required.length > 0) {
    throw new Error(
      `verifyToken returned no scope/scopes but requiredScopes is set (${required.join(', ')}). ` +
        'Return either scope: string or scopes: string[] from verifyToken.'
    );
  }
  const tokenScopes = scopeString ? scopeString.split(' ') : [];
  const missing = required.filter((s) => {
    return !tokenScopes.includes(s);
  });
  if (missing.length > 0) {
    throw new Error(`Insufficient scopes. Required: ${required.join(', ')}`);
  }
};

/**
 * Options for configuring the MCP router
 */
export interface McpRouterOptions {
  /**
   * The HTTP path where the MCP server will be mounted
   * @default '/mcp'
   */
  path?: string;

  /**
   * Additional HTTP paths where the MCP server is also mounted.
   *
   * Useful when MCP clients differ in where they connect after OAuth: some
   * follow the protected-resource `resource` metadata value as the endpoint,
   * others always connect to the bare origin (`/`). Setting `aliases: ['/']`
   * serves both without requiring app-level path rewrites.
   *
   * @example ['/'] // also handle MCP requests at the bare root
   */
  aliases?: string[];

  /**
   * Optional session ID generator for stateful MCP servers.
   * When provided, a single shared transport is created and sessions are tracked.
   * When undefined (default), the server operates in stateless mode where each
   * HTTP request uses its own transport instance.
   *
   * Applies to 2025-era traffic. The `2026-07-28` protocol revision has no
   * session concept in its core, so requests speaking that revision are always
   * served statelessly regardless of this option.
   */
  sessionIdGenerator?: () => string;

  /**
   * Base URL prepended to relative paths passed to `apiCall` (paths starting
   * with `/`). Tool handlers can then call `apiCall('GET', '/resource')` without
   * specifying a host.
   *
   * @example 'http://localhost:3000/api/v1'
   */
  apiBaseUrl?: string;

  /**
   * Called once per incoming MCP HTTP request. Return a plain object whose
   * key-value pairs will be merged into the headers of every `apiCall` made
   * within that request's tool handlers.
   *
   * Use this to forward any header from the MCP request — Bearer tokens, API
   * keys, tenant IDs, trace headers, etc. — without coupling tool handlers to
   * a specific authentication scheme.
   *
   * @example Forward a Bearer token
   * ```typescript
   * getApiHeaders: (ctx) => ({ Authorization: ctx.headers.authorization ?? '' })
   * ```
   *
   * @example Forward an x-api-key header
   * ```typescript
   * getApiHeaders: (ctx) => ({ 'x-api-key': ctx.headers['x-api-key'] as string })
   * ```
   *
   * @example Inject a static service-to-service key
   * ```typescript
   * getApiHeaders: () => ({ 'x-internal-key': process.env.INTERNAL_API_KEY! })
   * ```
   */
  getApiHeaders?: (ctx: Context) => Record<string, string>;

  /**
   * OAuth / JWT authentication configuration for the MCP endpoint.
   *
   * When set, incoming MCP requests must include a valid Bearer token in the
   * `Authorization` header — except for `publicMethods` (by default the
   * lifecycle handshake of each protocol era: `initialize` and
   * `server/discover`), which bypass verification so a client can complete
   * the handshake before authenticating. Invalid or missing tokens
   * receive a `401` response with `WWW-Authenticate: Bearer` (or
   * `Bearer resource_metadata="..."` when `resourceMetadataUrl` is set, per
   * RFC 9728). Tokens that fail a `requiredScopes` check receive `403`.
   *
   * The verified token payload is accessible inside tool handlers via
   * {@link getIdentity}. Fine-grained per-tool scope checks can be done with
   * {@link checkScopes}.
   *
   * @example Cognito
   * ```typescript
   * createMcpRouter(server, {
   *   auth: {
   *     cognitoUserPool: { userPoolId: 'us-east-1_xxx', clientId: 'yyy' },
   *     requiredScopes: ['mcp:access'],
   *   },
   * });
   * ```
   *
   * @example Custom verifier
   * ```typescript
   * createMcpRouter(server, {
   *   auth: {
   *     verifyToken: async (token) => myJwtLib.verify(token),
   *   },
   * });
   * ```
   */
  auth?: McpAuthOptions;
}

/**
 * Creates a Koa router configured to handle MCP protocol requests
 *
 * @param server - The MCP server instance with registered tools and resources
 * @param options - Configuration options for the router
 * @returns A Koa Router instance configured for MCP
 *
 * @example
 * ```typescript
 * import { App, bodyParser } from '@ttoss/http-server';
 * import { createMcpRouter, McpServer, z } from '@ttoss/http-server-mcp';
 *
 * const mcpServer = new McpServer({
 *   name: 'my-server',
 *   version: '1.0.0',
 * });
 *
 * mcpServer.registerTool(
 *   'hello',
 *   {
 *     description: 'Say hello',
 *     inputSchema: { name: z.string() },
 *   },
 *   async ({ name }) => ({
 *     content: [{ type: 'text', text: `Hello, ${name}!` }],
 *   })
 * );
 *
 * const app = new App();
 * app.use(bodyParser());
 *
 * const mcpRouter = createMcpRouter(mcpServer);
 * app.use(mcpRouter.routes());
 *
 * app.listen(3000);
 * ```
 */
// eslint-disable-next-line max-lines-per-function
export const createMcpRouter = (
  server: McpServer,
  options: McpRouterOptions = {}
  // eslint-disable-next-line complexity
) => {
  const {
    path = '/mcp',
    aliases = [],
    sessionIdGenerator,
    apiBaseUrl,
    getApiHeaders,
    auth,
  } = options;
  const needsContext =
    apiBaseUrl !== undefined ||
    getApiHeaders !== undefined ||
    auth !== undefined;

  // Serves each request over the protocol revision it actually speaks: the
  // existing transport wiring for 2025-era traffic, the 2026-07-28 stateless
  // core for requests carrying that revision's per-request envelope.
  const serveRequest = createMcpRequestServer({ server, sessionIdGenerator });

  const router = new Router();

  // Auth middleware applied inline per route (not via router.use prefix match)
  // so that unrelated paths like /.well-known/* are never intercepted — even
  // when aliases contains '/', which would otherwise prefix-match everything.
  let authCheck:
    ((ctx: Context, next: () => Promise<void>) => Promise<void>) | undefined;

  if (auth) {
    const verifyToken = buildVerifyToken(auth);

    // Append `path` to the base URL so clients that follow the `resource`
    // value land on the actual MCP endpoint, not the bare origin.
    const base = auth.resourceServerUrl?.replace(/\/$/, '');
    const resourceUrl =
      base === undefined || path === '/' ? base : `${base}${path}`;

    // Serving the document and advertising it are derived from **one** value,
    // deliberately: both require `resourceServerUrl` *and*
    // `authorizationServerUrl`, so binding them together is what stops a `401`
    // from advertising a `resource_metadata` location whose route was never
    // registered. Two independent conditions is exactly how that regressed
    // once — gating the header on `resourceServerUrl` alone made a config with
    // no `authorizationServerUrl` point every client at a 404.
    const metadata =
      resourceUrl !== undefined && auth.authorizationServerUrl !== undefined
        ? {
            document: protectedResourceMetadataDocument({
              resource: resourceUrl,
              authorizationServers: [auth.authorizationServerUrl],
            }),
            paths: protectedResourceMetadataPaths({ resource: resourceUrl }),
            url: protectedResourceMetadataUrl({ resource: resourceUrl }),
          }
        : undefined;

    // The router already knows the facts the metadata URL derives from, so it
    // derives the default rather than making the consumer hand-write a URL that
    // can silently name a location nothing serves — the same failure this
    // file's route registration fixes, one layer up. An explicit
    // `resourceMetadataUrl` still wins.
    const resourceMetadataUrl = auth.resourceMetadataUrl ?? metadata?.url;

    const publicMethods = new Set(auth.publicMethods ?? DEFAULT_PUBLIC_METHODS);

    const verify = authMiddleware({
      strategies: ['oauth'],
      oauth: {
        verify: (token) => {
          return verifyToken(token) as Promise<Record<string, unknown>>;
        },
        requiredScopes: auth.requiredScopes,
      },
      resourceMetadataUrl,
    });

    // Public lifecycle/discovery methods bypass verification so clients can
    // discover the server before they have a token (MCP authorization spec).
    authCheck = async (ctx: Context, next: () => Promise<void>) => {
      const method = (ctx.request.body as { method?: string } | undefined)
        ?.method;
      if (publicMethods.has(method ?? '')) {
        await next();
        return;
      }
      await verify(ctx, next);
    };

    if (metadata) {
      // `protectedResourceMetadataPaths` owns RFC 9728 §3.1's derivation rule
      // (the well-known segment goes between host and path, so a resource of
      // `https://host/mcp` is discovered at
      // `https://host/.well-known/oauth-protected-resource/mcp`) and returns
      // the root as well, de-duplicated when the resource has no path.
      // Serving only the root made a spec-following client fail discovery
      // outright, measured against a deployed consumer mounted at `/mcp`.
      for (const metadataPath of metadata.paths) {
        router.get(metadataPath, (ctx: Context) => {
          ctx.body = metadata.document;
        });
      }
    }
  }

  const handleWithContext = async (
    ctx: Context,
    body?: unknown
  ): Promise<void> => {
    const apiHeaders = getApiHeaders ? getApiHeaders(ctx) : {};
    // `authMiddleware` stores the verified payload on `ctx.state.user`.
    const identity = (ctx.state as { user?: unknown }).user;

    // Forward the already-verified identity as the SDK's pass-through
    // `authInfo` (it reads `req.auth`, set by convention — the same field
    // Express's `requireBearerAuth` populates). This is purely additive: tool
    // code written against this package keeps reading identity via
    // `getIdentity()` below.
    (ctx.req as unknown as { auth?: unknown }).auth = identity;

    const runRequest = async (): Promise<void> => {
      await serveRequest(ctx, body);
      // Prevent Koa from sending its own response
      // The MCP SDK has already handled the response
      ctx.respond = false;
    };

    if (needsContext) {
      await requestContextStore.run(
        { apiBaseUrl, apiHeaders, identity },
        runRequest
      );
    } else {
      await runRequest();
    }
  };

  const postHandler = async (ctx: Context): Promise<void> => {
    try {
      await handleWithContext(ctx, ctx.request.body);
    } catch (error) {
      // Only handle errors if headers haven't been sent
      if (!ctx.res.headersSent) {
        ctx.status = 500;
        ctx.body = {
          error:
            error instanceof Error ? error.message : 'Internal server error',
        };
      }
    }
  };

  const deleteHandler = async (ctx: Context): Promise<void> => {
    try {
      await handleWithContext(ctx);
    } catch (error) {
      if (!ctx.res.headersSent) {
        ctx.status = 500;
        ctx.body = {
          error:
            error instanceof Error ? error.message : 'Internal server error',
        };
      }
    }
  };

  // Register POST and DELETE at the primary path and every alias.
  // Support DELETE for session termination (per MCP spec).
  const allPaths = [path, ...aliases];
  for (const mcpPath of allPaths) {
    if (authCheck) {
      router.post(mcpPath, authCheck, postHandler);
      router.delete(mcpPath, authCheck, deleteHandler);
    } else {
      router.post(mcpPath, postHandler);
      router.delete(mcpPath, deleteHandler);
    }
  }

  return router;
};

export {
  type JsonObjectSchema,
  registerToolFromSchema,
  type RegisterToolFromSchemaParams,
} from './registerToolFromSchema';

/**
 * Re-export MCP SDK types and classes for convenience
 */
export { McpServer } from '@modelcontextprotocol/server';

/**
 * Re-export Zod for request/response schema definitions
 */
export {
  createGatedToolRegistrar,
  type CreateGatedToolRegistrarOptions,
  type GatedToolDef,
  type ToolCallContext,
  type ToolIdentity,
} from './createGatedToolRegistrar';
export { z } from 'zod';
