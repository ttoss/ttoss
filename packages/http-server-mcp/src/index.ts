import { AsyncLocalStorage } from 'node:async_hooks';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- value import required so declaration bundler emits `export { McpServer }` not `export type { McpServer }`
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import { Router } from '@ttoss/http-server';
import { authMiddleware } from '@ttoss/http-server-auth';
import type Koa from 'koa';
import { z } from 'zod';

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
   * @default ['initialize', 'tools/list']
   */
  publicMethods?: string[];
  /**
   * When set, a `401` carries `WWW-Authenticate: Bearer resource_metadata="…"`
   * (RFC 9728) so MCP clients can discover the authorization server.
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
}

/** MCP lifecycle/discovery methods reachable before a client authenticates. */
const DEFAULT_PUBLIC_METHODS = ['initialize', 'tools/list'];

/** Builds the token verifier from the MCP auth options. */
const buildVerifyToken = (
  auth: McpAuthOptions
): ((token: string) => Promise<unknown>) => {
  if (auth.cognitoUserPool) {
    const verifier = CognitoJwtVerifier.create({
      tokenUse: 'access',
      ...auth.cognitoUserPool,
    });
    return (token) => {
      return verifier.verify(token);
    };
  }
  if (auth.verifyToken) {
    return auth.verifyToken;
  }
  throw new Error(
    'McpAuthOptions requires either cognitoUserPool or verifyToken'
  );
};

interface RequestContext {
  apiBaseUrl?: string;
  apiHeaders: Record<string, string>;
  identity?: unknown;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

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
    | { scope?: string; scopes?: string[] }
    | undefined;
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
   * `Authorization` header — except for `publicMethods` (by default
   * `initialize` and `tools/list`), which bypass verification so clients can
   * discover the server before authenticating. Invalid or missing tokens
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
  const isStateful = sessionIdGenerator !== undefined;
  const needsContext =
    apiBaseUrl !== undefined ||
    getApiHeaders !== undefined ||
    auth !== undefined;

  // Stateful mode: single shared transport connected once at startup
  let sharedTransport: StreamableHTTPServerTransport | undefined;
  if (isStateful) {
    sharedTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator,
      enableJsonResponse: true,
    });
    // Connect the shared transport to the MCP server
    server.connect(sharedTransport);
  }

  // Stateless mode: SDK 1.x requires a fresh transport per request.
  // Requests are serialised so only one stateless transport is connected at a time.
  let statelessQueue: Promise<void> = Promise.resolve();

  const enqueueStateless = (work: () => Promise<void>): Promise<void> => {
    const result = statelessQueue.then(() => {
      return work();
    });
    // Keep the queue alive even if this work rejects so subsequent
    // requests are not blocked by a previous failure.
    statelessQueue = result.catch(() => {});
    return result;
  };

  const router = new Router();

  // Auth middleware applied inline per route (not via router.use prefix match)
  // so that unrelated paths like /.well-known/* are never intercepted — even
  // when aliases contains '/', which would otherwise prefix-match everything.
  let authCheck:
    | ((ctx: Context, next: () => Promise<void>) => Promise<void>)
    | undefined;

  if (auth) {
    const verifyToken = buildVerifyToken(auth);
    const publicMethods = new Set(auth.publicMethods ?? DEFAULT_PUBLIC_METHODS);

    const verify = authMiddleware({
      strategies: ['oauth'],
      oauth: {
        verify: (token) => {
          return verifyToken(token) as Promise<Record<string, unknown>>;
        },
        requiredScopes: auth.requiredScopes,
      },
      resourceMetadataUrl: auth.resourceMetadataUrl,
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

    if (auth.resourceServerUrl && auth.authorizationServerUrl) {
      // Append `path` to the base URL so clients that follow the `resource`
      // value land on the actual MCP endpoint, not the bare origin.
      const base = auth.resourceServerUrl.replace(/\/$/, '');
      const resourceUrl = path === '/' ? base : `${base}${path}`;
      router.get('/.well-known/oauth-protected-resource', (ctx: Context) => {
        ctx.body = {
          resource: resourceUrl,
          authorization_servers: [auth.authorizationServerUrl],
        };
      });
    }
  }

  const handleWithContext = async (
    ctx: Context,
    body?: unknown
  ): Promise<void> => {
    const apiHeaders = getApiHeaders ? getApiHeaders(ctx) : {};
    // `authMiddleware` stores the verified payload on `ctx.state.user`.
    const identity = (ctx.state as { user?: unknown }).user;

    const runRequest = async (
      transport: StreamableHTTPServerTransport
    ): Promise<void> => {
      await transport.handleRequest(ctx.req, ctx.res, body);
      // Prevent Koa from sending its own response
      // The MCP SDK has already handled the response
      ctx.respond = false;
    };

    if (isStateful && sharedTransport) {
      // Stateful mode: reuse the shared transport
      if (needsContext) {
        await requestContextStore.run(
          { apiBaseUrl, apiHeaders, identity },
          () => {
            return runRequest(sharedTransport!);
          }
        );
      } else {
        await runRequest(sharedTransport);
      }
    } else {
      // Stateless mode: SDK requires a fresh transport per request.
      // Serialise so only one transport is connected at a time.
      await enqueueStateless(async () => {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        // Connect and run inside try/finally so the transport is always closed,
        // even if connect() throws — preventing server state corruption.
        try {
          await server.connect(transport);
          if (needsContext) {
            await requestContextStore.run(
              { apiBaseUrl, apiHeaders, identity },
              () => {
                return runRequest(transport);
              }
            );
          } else {
            await runRequest(transport);
          }
        } finally {
          // Close the transport to reset the server's internal transport reference,
          // allowing the next request to connect a fresh transport.
          await transport.close();
        }
      });
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

/**
 * A plain JSON Schema object (draft-07 compatible) describing the shape of a
 * tool's input. Used with {@link registerToolFromSchema} as an alternative to
 * providing a Zod shape, enabling lossless round-trips for schemas that contain
 * features not expressible in Zod v3 (`anyOf`, `$ref`, `pattern`, `allOf`, …).
 */
export interface JsonObjectSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Parameters accepted by {@link registerToolFromSchema}.
 */
export interface RegisterToolFromSchemaParams {
  /** Unique tool name. */
  name: string;
  /** Human-readable description shown to the AI client. */
  description?: string;
  /**
   * Plain JSON Schema that describes the tool's input object.
   * This schema is forwarded verbatim over the MCP wire protocol, so any
   * JSON Schema feature (`anyOf`, `$ref`, `pattern`, …) is preserved without
   * loss. Defaults to `{ type: 'object', properties: {} }` when omitted.
   */
  inputSchema?: JsonObjectSchema;
  /**
   * Tool handler invoked when the AI client calls the tool.
   * Receives the raw request arguments as a plain object (no Zod validation is
   * applied, so the shape matches whatever the client sends).
   */
  handler: (
    args: Record<string, unknown>
  ) => CallToolResult | Promise<CallToolResult>;
}

// Module-level WeakMaps so they survive across calls but are GC-friendly.
const rawSchemaRegistryMap = new WeakMap<
  McpServer,
  Map<string, JsonObjectSchema>
>();
const patchedServerSet = new WeakSet<McpServer>();

/**
 * Registers a tool on an MCP server using a **plain JSON Schema** object for
 * `inputSchema` instead of a Zod shape.
 *
 * This is useful when tool definitions are shared between the MCP server and an
 * AI SDK agent (e.g. Vercel AI SDK's `tool()` helper), because both consume a
 * plain JSON Schema at runtime. Using this helper eliminates the lossy
 * JSON-Schema→Zod conversion that would otherwise be required.
 *
 * Internally the helper:
 * 1. Registers the tool via the standard `McpServer.registerTool` API using a
 *    Zod `z.record(z.unknown())` pass-through schema so that the existing MCP
 *    `tools/call` handler correctly routes requests and delivers raw args to
 *    your handler.
 * 2. Stores the original JSON Schema and patches the `tools/list` response
 *    handler so clients receive the verbatim JSON Schema over the wire.
 *
 * @param server - The `McpServer` instance to register the tool on.
 * @param params - Tool configuration including name, description, inputSchema,
 *   and handler.
 *
 * @example
 * ```typescript
 * import { registerToolFromSchema, McpServer } from '@ttoss/http-server-mcp';
 *
 * const server = new McpServer({ name: 'my-server', version: '1.0.0' });
 *
 * registerToolFromSchema(server, {
 *   name: 'get-project',
 *   description: 'Get a project by ID',
 *   inputSchema: {
 *     type: 'object',
 *     properties: { id: { type: 'string', description: 'Project public ID' } },
 *     required: ['id'],
 *   },
 *   handler: async ({ id }) => ({
 *     content: [{ type: 'text', text: `Project: ${id}` }],
 *   }),
 * });
 * ```
 */
export const registerToolFromSchema = (
  server: McpServer,
  params: RegisterToolFromSchemaParams
): void => {
  const {
    name,
    description,
    inputSchema = { type: 'object', properties: {} },
    handler,
  } = params;

  // Ensure we have a schema registry for this server.
  if (!rawSchemaRegistryMap.has(server)) {
    rawSchemaRegistryMap.set(server, new Map());
  }

  const registry = rawSchemaRegistryMap.get(server)!;
  registry.set(name, inputSchema);

  // Register the tool with a Zod record schema so that:
  //  - `tools/call` validation always passes for any object input.
  //  - The handler receives the raw args object from the request.
  server.registerTool(
    name,
    {
      description,
      inputSchema: z.record(z.string(), z.unknown()),
    },
    async (args) => {
      return handler(args as Record<string, unknown>);
    }
  );

  // Patch the `tools/list` response handler once per server so that the
  // verbatim JSON Schema is returned instead of the Zod-derived one.
  if (!patchedServerSet.has(server)) {
    patchedServerSet.add(server);

    // Access the underlying `Server` instance and its internal request-handler
    // map. This relies on McpServer exposing a `server` property (documented in
    // the SDK's public API) and Protocol storing handlers in `_requestHandlers`
    // (an internal implementation detail). If the MCP SDK refactors its
    // internals, the patching is simply skipped and tools remain functional —
    // the only degradation is that the Zod-derived schema is shown instead of
    // the verbatim JSON Schema in `tools/list`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawServer = (server as any).server;
    const origHandler = rawServer?._requestHandlers?.get('tools/list') as
      | ((req: unknown, extra: unknown) => Promise<{ tools: unknown[] }>)
      | undefined;

    if (!origHandler && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[registerToolFromSchema] Could not patch tools/list — ' +
          'internal MCP SDK structure may have changed. ' +
          'The tool will still be callable, but tools/list may return ' +
          'a Zod-derived schema instead of the verbatim JSON Schema.'
      );
    }

    if (origHandler) {
      rawServer._requestHandlers.set(
        'tools/list',
        async (rawRequest: unknown, extra: unknown) => {
          const result = await origHandler(rawRequest, extra);

          const schemas = rawSchemaRegistryMap.get(server);
          if (!schemas) {
            return result;
          }

          return {
            ...result,
            tools: (
              result.tools as Array<{
                name: string;
                inputSchema: unknown;
                [key: string]: unknown;
              }>
            ).map((tool) => {
              const raw = schemas.get(tool.name);
              if (raw !== undefined) {
                return { ...tool, inputSchema: raw };
              }
              return tool;
            }),
          };
        }
      );
    }
  }
};

/**
 * Re-export MCP SDK types and classes for convenience
 */
export { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Re-export Zod for request/response schema definitions
 */
export {
  createGatedToolRegistrar,
  type CreateGatedToolRegistrarOptions,
  type GatedToolDef,
  type ToolIdentity,
} from './createGatedToolRegistrar';
export { z } from 'zod';
