# @ttoss/http-server-mcp

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server integration for [@ttoss/http-server](https://ttoss.dev/docs/modules/packages/http-server).

## Installation

```bash
pnpm add @ttoss/http-server-mcp
```

## Quick Start

```typescript
import { App, bodyParser, cors } from '@ttoss/http-server';
import { createMcpRouter, McpServer, z } from '@ttoss/http-server-mcp';

// Create MCP server
const mcpServer = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
});

// Register tools
mcpServer.registerTool(
  'get-weather',
  {
    description: 'Get weather information for a location',
    inputSchema: {
      location: z.string().describe('City name'),
    },
  },
  async ({ location }) => ({
    content: [
      {
        type: 'text',
        text: `Weather in ${location}: Sunny, 72°F`,
      },
    ],
  })
);

// Create HTTP server
const app = new App();
app.use(cors());
app.use(bodyParser());

// Mount MCP router
const mcpRouter = createMcpRouter(mcpServer);
app.use(mcpRouter.routes());

app.listen(3000, () => {
  console.log('MCP server running on http://localhost:3000/mcp');
});
```

## `apiCall` — Generic HTTP Helper

`apiCall` is a generic HTTP helper for use inside MCP tool handlers. It works with any URL — your own REST API, third-party APIs, public APIs, or services using `x-api-key` or any other header scheme.

Use `getApiHeaders` in `createMcpRouter` to configure which headers from the incoming MCP request are automatically forwarded to every `apiCall`. Tool handlers stay clean and auth-agnostic.

### Bearer token forwarding

```typescript
import { apiCall, createMcpRouter, McpServer } from '@ttoss/http-server-mcp';

const mcpServer = new McpServer({ name: 'my-server', version: '1.0.0' });

mcpServer.registerTool(
  'list-portfolios',
  { description: 'List all portfolios', inputSchema: {} },
  async () => {
    // Bearer token is forwarded automatically — no manual wiring
    const data = await apiCall('GET', '/portfolios');
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

const mcpRouter = createMcpRouter(mcpServer, {
  apiBaseUrl: `http://localhost:${process.env.PORT}/api/v1`,
  // Extract the caller's Bearer token and inject it into every apiCall
  getApiHeaders: (ctx) => ({ Authorization: ctx.headers.authorization ?? '' }),
});
```

### x-api-key forwarding

```typescript
const mcpRouter = createMcpRouter(mcpServer, {
  apiBaseUrl: 'https://internal-service/api',
  getApiHeaders: (ctx) => ({
    'x-api-key': ctx.headers['x-api-key'] as string,
  }),
});
```

### Third-party or public APIs (full URL, no context required)

```typescript
mcpServer.registerTool(
  'get-rates',
  { description: 'Currency rates', inputSchema: {} },
  async () => {
    // Full URL — works entirely outside any context
    const rates = await apiCall('GET', 'https://api.exchangerate.host/latest');
    return { content: [{ type: 'text', text: JSON.stringify(rates) }] };
  }
);
```

### POST with a body

```typescript
const result = await apiCall('POST', '/portfolios', {
  body: { name: 'Growth Fund' },
});
```

### Per-call header override

```typescript
// Context-injected headers are merged; per-call headers take precedence
const data = await apiCall('GET', 'https://partner.api.com/data', {
  headers: { Authorization: 'Bearer fixed-service-token' },
});
```

`apiCall` throws with a clear message when called with a relative path and no `apiBaseUrl` is configured in the context.

## Authentication

`createMcpRouter` supports OAuth 2.0 Bearer token authentication via the `auth` option. Incoming MCP requests must include a valid `Authorization: Bearer <token>` header — invalid or missing tokens receive a `401 Unauthorized` response. The MCP lifecycle methods `initialize` and `tools/list` are exempt by default so clients can discover the server before authenticating (see [Public methods and discovery](#public-methods-and-discovery)).

```mermaid
sequenceDiagram
    participant Client
    participant MCP Server
    participant Verifier

    Client->>MCP Server: POST /mcp + Authorization: Bearer &lt;token&gt;
    MCP Server->>Verifier: verify(token)
    alt valid token
        Verifier-->>MCP Server: identity payload
        MCP Server->>MCP Server: run tool (identity available via getIdentity())
        MCP Server-->>Client: 200 OK
    else invalid or missing token
        Verifier-->>MCP Server: error
        MCP Server-->>Client: 401 Unauthorized
    end
```

### Amazon Cognito

Pass `cognitoUserPool` and the router creates a `CognitoJwtVerifier` (from `@ttoss/auth-core`) internally:

```typescript
import { createMcpRouter, McpServer } from '@ttoss/http-server-mcp';

const mcpRouter = createMcpRouter(mcpServer, {
  auth: {
    cognitoUserPool: {
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      clientId: process.env.COGNITO_CLIENT_ID!,
      tokenUse: 'access', // default
    },
  },
});
```

### Custom verifier

Pass an async `verifyToken` function for any provider — JWT-based or opaque. The contract is simply: resolve with an identity payload on success, or throw on failure.

```typescript
import { createMcpRouter } from '@ttoss/http-server-mcp';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://your-auth-server/.well-known/jwks.json')
);

const mcpRouter = createMcpRouter(mcpServer, {
  auth: {
    verifyToken: async (token) => {
      const { payload } = await jwtVerify(token, JWKS);
      return payload;
    },
  },
});
```

**Opaque token (database lookup):** `verifyToken` does not have to be JWT-based — a plain API-key lookup works equally well:

```typescript
const mcpRouter = createMcpRouter(mcpServer, {
  auth: {
    verifyToken: async (token) => {
      // Look up the hashed token in your database
      const record = await db.apiKeys.findByHash(sha256(token));
      if (!record || record.revokedAt) {
        throw new Error('Invalid API key');
      }
      return { sub: record.userId, scope: record.scopes.join(' ') };
    },
  },
});
```

The router emits `401 Unauthorized` whenever `verifyToken` throws, regardless of whether you are using JWTs or opaque tokens.

### Accessing the verified identity

Inside any tool handler, call `getIdentity()` to retrieve the verified JWT payload:

```typescript
import { getIdentity, createMcpRouter, McpServer } from '@ttoss/http-server-mcp';

mcpServer.registerTool(
  'get-profile',
  { description: 'Return the caller's profile', inputSchema: {} },
  async () => {
    const identity = getIdentity() as { sub: string; email: string };
    return {
      content: [{ type: 'text', text: `Hello, ${identity.email}` }],
    };
  }
);
```

### Scope enforcement

Scopes can be enforced at two levels.

**Router-level** — gate the entire MCP endpoint. Any token missing a required scope receives a `403 Forbidden` before any tool runs:

```typescript
createMcpRouter(mcpServer, {
  auth: {
    cognitoUserPool: { userPoolId: '...', clientId: '...' },
    requiredScopes: ['mcp:access'],
  },
});
```

**Per-tool** — use `checkScopes()` inside individual handlers for fine-grained control. It throws an error that the MCP SDK returns as a tool error to the client:

```typescript
import { checkScopes, getIdentity } from '@ttoss/http-server-mcp';

mcpServer.registerTool(
  'delete-user',
  { description: 'Delete a user', inputSchema: { userId: z.string() } },
  async ({ userId }) => {
    checkScopes(['admin', 'write:users']); // throws if either scope is missing

    const identity = getIdentity() as { sub: string };
    // proceed with deletion...
    return { content: [{ type: 'text', text: `Deleted ${userId}` }] };
  }
);
```

Cognito encodes scopes as a space-separated string in `payload.scope` (e.g. `"openid mcp:access admin"`).

### OAuth Protected Resource Metadata

MCP clients (Claude, Cursor, etc.) fetch `/.well-known/oauth-protected-resource` to discover which authorization server issues tokens for your MCP server. The endpoint must be **unauthenticated** — MCP clients call it before they have a token.

**With the built-in `auth` option** — add `resourceServerUrl` and `authorizationServerUrl`:

```typescript
createMcpRouter(mcpServer, {
  auth: {
    cognitoUserPool: { userPoolId: '...', clientId: '...' },
    resourceServerUrl: 'https://mcp.example.com',
    authorizationServerUrl:
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxx',
  },
});
```

**With your own auth middleware** — use `createProtectedResourceMetadataMiddleware` as a standalone middleware, mounted _before_ your auth layer so discovery stays unauthenticated:

```typescript
import {
  createProtectedResourceMetadataMiddleware,
  getWwwAuthenticateHeader,
} from '@ttoss/http-server-mcp';

// Mount the discovery endpoint before your own auth middleware
app.use(
  createProtectedResourceMetadataMiddleware({
    resource: 'https://mcp.example.com',
    authorizationServers: ['https://api.example.com'],
  })
);

// Your own auth middleware — emit the spec-compliant WWW-Authenticate header on 401s
app.use(async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token || !(await myVerify(token))) {
    ctx.status = 401;
    ctx.set(
      'WWW-Authenticate',
      getWwwAuthenticateHeader({ resource: 'https://mcp.example.com' })
    );
    ctx.body = 'Unauthorized';
    return;
  }
  await next();
});

app.use(createMcpRouter(mcpServer).routes());
```

The `WWW-Authenticate: Bearer resource_metadata="…"` header is how MCP clients bootstrap OAuth discovery after their first unauthorized request.

### Public methods and discovery

The two behaviors the [MCP authorization spec](https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/authorization/) requires for client bootstrapping are built into the `auth` option, so you no longer need the hand-rolled middleware shown above:

- **`publicMethods`** — JSON-RPC methods that bypass verification, read from the request body's `method` field. Defaults to `['initialize', 'tools/list']` so clients can discover the server before authenticating. Pass `[]` to require a token for every method, or a custom list to change the exempt set.
- **`resourceMetadataUrl`** — when set, a `401` responds with `WWW-Authenticate: Bearer resource_metadata="<resourceMetadataUrl>"` (RFC 9728) instead of a bare `Bearer`, pointing MCP clients at the protected-resource metadata document. When omitted, the header falls back to `Bearer`.

```typescript
createMcpRouter(mcpServer, {
  auth: {
    cognitoUserPool: { userPoolId: '...', clientId: '...' },
    // Serve the metadata document (unauthenticated)...
    resourceServerUrl: 'https://mcp.example.com',
    authorizationServerUrl:
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxx',
    // ...and point 401s at it for auto-discovery.
    resourceMetadataUrl:
      'https://mcp.example.com/.well-known/oauth-protected-resource',
    // publicMethods defaults to ['initialize', 'tools/list'].
  },
});
```

Both fields are optional. Omitting `resourceMetadataUrl` keeps the bare `Bearer` header, and the `publicMethods` default matches what MCP clients expect for discovery.

## OAuth 2.1 Authorization Server

The `auth` option above covers the **resource-server** half of MCP authorization — it verifies tokens issued by an external authorization server (Cognito, Auth0, …). When you want your own first-party server to _issue_ the tokens, `oauthServer` (from [`@ttoss/http-server`](https://ttoss.dev/docs/modules/packages/http-server), re-exported here) provides the **authorization-server** half: the `/authorize`, `/token`, `/register`, and discovery endpoints an MCP client (Claude, Cursor, VS Code) auto-discovers and runs the full OAuth 2.1 flow against. It is a thin Koa adapter over the runner-agnostic `createOAuthHandlers` engine in [`@ttoss/auth-core`](https://ttoss.dev/docs/modules/packages/auth-core).

ttoss owns only the protocol mechanics (PKCE, discovery metadata, code exchange, dynamic client registration). Your app keeps its own user model, token signing, and login/consent UI through pluggable hooks — the user model never leaves your app.

```typescript
import { App, bodyParser, oauthServer } from '@ttoss/http-server';

const authServer = oauthServer({
  issuer: 'https://api.example.com',
  clientStore, // register/lookup dynamic clients
  authCodeStore, // persist short-lived codes + PKCE challenge
  // App-owned token minting — ttoss never sees your signing keys
  issueTokens: async ({ subject, scopes }) => ({
    accessToken: signJwt({ sub: subject, scope: scopes.join(' ') }),
    refreshToken: createRefreshToken(subject),
    expiresIn: 3600,
  }),
  // App-owned login/consent — read your session from headers, then approve
  onAuthorize: async ({ headers, request }) => {
    const session = await getSession(headers.cookie);
    if (!session) {
      return { approved: false, redirect: '/login' };
    }
    return { approved: true, subject: session.userId, scopes: request.scopes };
  },
  // App-owned refresh validation — required to enable the refresh_token grant
  onRefreshToken: async ({ refreshToken }) => {
    const claims = await verifyRefreshToken(refreshToken);
    return claims ? { subject: claims.sub, scopes: claims.scopes } : undefined;
  },
  scopesSupported: ['mcp:access'],
});

const app = new App();
app.use(bodyParser());
app.use(authServer.routes());
```

This mounts:

| Endpoint                                  | Spec      | Purpose                                              |
| ----------------------------------------- | --------- | ---------------------------------------------------- |
| `/.well-known/oauth-authorization-server` | RFC 8414  | Authorization server metadata discovery              |
| `/.well-known/oauth-protected-resource`   | RFC 9728  | Protected-resource metadata (when `resource` is set) |
| `/authorize`                              | OAuth 2.1 | Authorization endpoint — **PKCE (S256) required**    |
| `/token`                                  | OAuth 2.1 | `authorization_code` + `refresh_token` grants        |
| `/register`                               | RFC 7591  | Dynamic Client Registration                          |

The full flow an MCP client runs: it fetches the discovery document, self-registers at `/register`, opens `/authorize` (your `onAuthorize` handles login/consent), exchanges the returned code at `/token` with its PKCE verifier, and uses the access token against your `createMcpRouter` endpoint. Pair this with `createMcpRouter({ auth: { verifyToken } })` so the same server both issues and verifies tokens.

The pluggable stores let you keep persistence in your own datastore:

```typescript
const clientStore: ClientStore = {
  get: (clientId) => db.clients.findById(clientId),
  register: (client) => db.clients.put(client),
};

const authCodeStore: AuthCodeStore = {
  save: (code) => db.codes.put(code), // set a TTL matching authorizationCodeTtl
  get: (code) => db.codes.findById(code),
  delete: (code) => db.codes.remove(code),
};
```

## API Reference

### `createMcpRouter(server, options?)`

Creates a Koa router configured to handle MCP protocol requests.

**Parameters:**

- `server` (`McpServer`) — MCP server instance with registered tools and resources
- `options` (`McpRouterOptions`) — Optional configuration
  - `path` (`string`) — HTTP path for MCP endpoint (default: `'/mcp'`)
  - `sessionIdGenerator` (`() => string`) — Session ID generator for stateful servers (default: `undefined` for stateless)
  - `apiBaseUrl` (`string`) — Base URL prepended to relative paths in `apiCall`
  - `getApiHeaders` (`(ctx: Context) => Record<string, string>`) — Return headers to inject into every `apiCall` for this request
  - `auth` (`McpAuthOptions`) — OAuth/JWT authentication; see [Authentication](#authentication)
    - `auth.cognitoUserPool` — Cognito user pool config (`userPoolId`, `clientId`, `tokenUse`)
    - `auth.verifyToken` — Custom async token verifier `(token: string) => Promise<unknown>`
    - `auth.requiredScopes` — Router-level scope guard; returns 403 if any scope is missing
    - `auth.resourceServerUrl` + `auth.authorizationServerUrl` — Enable `/.well-known/oauth-protected-resource`
    - `auth.publicMethods` — JSON-RPC methods that bypass verification (default `['initialize', 'tools/list']`)
    - `auth.resourceMetadataUrl` — Emit RFC 9728 `WWW-Authenticate: Bearer resource_metadata="…"` on 401

**Returns:** `Router` — Koa router instance

### `oauthServer(options)`

Creates an OAuth 2.1 Authorization Server (`/authorize`, `/token`, `/register`, and discovery metadata) as a Koa `Router`. Re-exported from [`@ttoss/http-server`](https://ttoss.dev/docs/modules/packages/http-server); it wraps the runner-agnostic `createOAuthHandlers` engine in `@ttoss/auth-core`. See [OAuth 2.1 Authorization Server](#oauth-21-authorization-server).

**Parameters (`OAuthServerOptions`):**

- `issuer` (`string`) — The authorization server's issuer identifier (its base URL); used to build absolute endpoint URLs in the discovery document
- `clientStore` (`ClientStore`) — `{ get(clientId), register(client) }` for dynamic clients
- `authCodeStore` (`AuthCodeStore`) — `{ save(code), get(code), delete(code) }` for short-lived authorization codes (codes are single-use)
- `issueTokens` (`({ subject, scopes, client }) => IssuedTokens`) — App-owned token minting; returns `{ accessToken, refreshToken?, expiresIn?, scope? }`
- `onAuthorize` (`({ headers, client, request }) => OnAuthorizeResult`) — App-owned login/consent; return `{ approved: true, subject, scopes? }` to issue a code, or `{ approved: false, redirect }` (or `{ approved: false, status, body }`) to decline
- `onRefreshToken` (`({ refreshToken, client, scopes }) => { subject, scopes } | undefined`, optional) — App-owned refresh-token validation; required to enable the `refresh_token` grant
- `scopesSupported` (`string[]`, optional) — Advertised in discovery metadata as `scopes_supported`
- `resource` (`string`, optional) — When set, also serves `/.well-known/oauth-protected-resource`
- `authorizationCodeTtl` (`number`, optional) — Authorization code lifetime in seconds (default: `600`)
- `endpoints` (`{ authorize?, token?, register? }`, optional) — Override the default endpoint paths

**Returns:** `Router` — Koa router instance exposing `routes()` / `allowedMethods()`

### `apiCall(method, url, options?)`

Generic HTTP helper for use inside MCP tool handlers.

**Parameters:**

- `method` (`string`) — HTTP method (`'GET'`, `'POST'`, `'PUT'`, `'DELETE'`, …)
- `url` (`string`) — Full URL **or** a path starting with `/` (prepended with `apiBaseUrl`)
- `options.body` (`unknown`, optional) — Request body, serialised as JSON
- `options.headers` (`Record<string, string>`, optional) — Per-call header overrides; merged on top of context-injected headers

**Returns:** `Promise<unknown>` — Parsed JSON response body

### `getIdentity()`

Returns the verified JWT payload for the current MCP request. Only available inside a tool handler when `auth` is configured. Returns `undefined` when called outside an authenticated context.

**Returns:** `unknown` — Verified token payload (cast to your expected shape)

### `checkScopes(required)`

Asserts that the current request token contains all required scopes. Throws `Error: Insufficient scopes. Required: …` if any scope is missing — the MCP SDK catches this and returns a tool error to the client.

**Parameters:**

- `required` (`string[]`) — Scope strings that must all be present in `payload.scope`

### `createProtectedResourceMetadataMiddleware(args)`

Creates a standalone Koa middleware that serves `GET /.well-known/oauth-protected-resource` (RFC 9728). Use this when you have your own auth middleware and don't want to tie the discovery endpoint to the built-in `auth` option.

**Parameters:**

- `args.resource` (`string`) — The protected resource's identifier URI (your MCP server URL)
- `args.authorizationServers` (`string[]`) — Issuer URIs of the authorization servers that protect this resource

**Returns:** `Koa.Middleware`

### `getWwwAuthenticateHeader(args)`

Returns the `WWW-Authenticate` header value for a 401 response, formatted per the MCP auth spec: `Bearer resource_metadata="<resource>/.well-known/oauth-protected-resource"`.

**Parameters:**

- `args.resource` (`string`) — The protected resource URL (trailing slash is stripped automatically)

**Returns:** `string` — The full `WWW-Authenticate` header value

### `registerToolFromSchema(server, params)`

Registers a tool using a **plain JSON Schema** object for `inputSchema` instead of a Zod shape.

Use this when tool definitions are shared between the MCP server and an AI SDK agent (e.g. Vercel AI SDK's `tool()` helper). Both consumers accept plain JSON Schema at runtime, so a single definition can feed both without any lossy conversion.

**Parameters:**

- `server` (`McpServer`) — The MCP server instance
- `params.name` (`string`) — Unique tool name
- `params.description` (`string`, optional) — Human-readable description
- `params.inputSchema` (`JsonObjectSchema`, optional) — Plain JSON Schema object (defaults to `{ type: 'object', properties: {} }`)
- `params.handler` (`(args: Record<string, unknown>) => CallToolResult | Promise<CallToolResult>`) — Tool handler receiving the raw request arguments

**Returns:** `void`

## Examples

### Plain JSON Schema Tool (`registerToolFromSchema`)

Use `registerToolFromSchema` when you share tool definitions across the MCP server **and** an AI SDK agent. The plain JSON Schema is forwarded verbatim over the MCP wire protocol — `anyOf`, `$ref`, `pattern`, and other features not supported by Zod v3 are preserved without loss.

```typescript
import {
  createMcpRouter,
  McpServer,
  registerToolFromSchema,
} from '@ttoss/http-server-mcp';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });

registerToolFromSchema(server, {
  name: 'get-project',
  description: 'Get a project by ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Project public ID' },
      // anyOf is preserved — Zod v3 has no direct equivalent
      status: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    },
    required: ['id'],
  },
  handler: async ({ id }) => {
    const data = await apiCall('GET', `/projects/${id}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  },
});
```

**Single source of truth across MCP and AI SDK:**

```typescript
// lib/tools.ts — shared tool definition
export const getProjectTool = {
  name: 'get-project',
  description: 'Get a project by ID',
  inputSchema: {
    type: 'object' as const,
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
};

// MCP server
import { registerToolFromSchema } from '@ttoss/http-server-mcp';
registerToolFromSchema(mcpServer, {
  ...getProjectTool,
  handler: async ({ id }) => {
    /* ... */
  },
});

// AI SDK agent
import { tool } from 'ai';
import { jsonSchema } from 'ai';
const agentTool = tool({
  description: getProjectTool.description,
  parameters: jsonSchema(getProjectTool.inputSchema),
  execute: async ({ id }) => {
    /* same logic */
  },
});
```

### Basic Tool

```typescript
import { McpServer, z } from '@ttoss/http-server-mcp';

const server = new McpServer({
  name: 'calculator',
  version: '1.0.0',
});

server.registerTool(
  'add',
  {
    description: 'Add two numbers',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    },
  },
  async ({ a, b }) => ({
    content: [
      {
        type: 'text',
        text: `${a} + ${b} = ${a + b}`,
      },
    ],
  })
);
```

### Multiple Tools

```typescript
server.registerTool(
  'multiply',
  {
    description: 'Multiply two numbers',
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a * b) }],
  })
);

server.registerTool(
  'divide',
  {
    description: 'Divide two numbers',
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return {
      content: [{ type: 'text', text: String(a / b) }],
    };
  }
);
```

### Custom Path

```typescript
const router = createMcpRouter(server, {
  path: '/api/mcp',
});
```

### Resources

```typescript
server.resource(
  'config://app',
  'Application configuration',
  'application/json',
  async () => ({
    contents: [
      {
        uri: 'config://app',
        mimeType: 'application/json',
        text: JSON.stringify({ version: '1.0.0', env: 'production' }),
      },
    ],
  })
);
```

### With CORS and Multiple Endpoints

```typescript
import { App, bodyParser, cors, Router } from '@ttoss/http-server';
import { createMcpRouter } from '@ttoss/http-server-mcp';

const app = new App();
app.use(cors());
app.use(bodyParser());

// Health check endpoint
const healthRouter = new Router();
healthRouter.get('/health', (ctx) => {
  ctx.body = { status: 'ok' };
});

// MCP endpoint
const mcpRouter = createMcpRouter(mcpServer);

app.use(healthRouter.routes());
app.use(mcpRouter.routes());

app.listen(3000);
```

## Protocol Details

This package implements the [Model Context Protocol](https://spec.modelcontextprotocol.io/) over HTTP using JSON responses (no SSE streaming). It uses the `StreamableHTTPServerTransport` from the MCP SDK with `enableJsonResponse: true` and adapts Koa's context-based middleware to work with the MCP SDK's Node.js request/response expectations.

**Supported HTTP methods:**

- `POST /mcp` - Send JSON-RPC requests/notifications
- `DELETE /mcp` - Terminate session (optional)

**Client requirements (per MCP spec):**

- `Content-Type: application/json`
- `Accept: application/json, text/event-stream`

**Stateless vs stateful mode:**

- **Stateless** (default, `sessionIdGenerator: undefined`) — a fresh transport is created per HTTP request. No session tracking. Suitable for serverless environments and simple integrations.
- **Stateful** (`sessionIdGenerator` provided) — a single shared transport handles all requests and tracks sessions by ID.

## Related Packages

- [@ttoss/http-server](https://ttoss.dev/docs/modules/packages/http-server) - HTTP server foundation
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP SDK

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
