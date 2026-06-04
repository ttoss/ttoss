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

`createMcpRouter` supports OAuth 2.0 Bearer token authentication via the `auth` option. Every incoming MCP request must include a valid `Authorization: Bearer <token>` header — invalid or missing tokens receive a `401 Unauthorized` response.

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

Pass an async `verifyToken` function for any other provider (Auth0, Keycloak, etc.):

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

For MCP clients that support OAuth auto-discovery, add `resourceServerUrl` and `authorizationServerUrl` to expose the `/.well-known/oauth-protected-resource` endpoint (RFC 9728):

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

**Returns:** `Router` — Koa router instance

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
