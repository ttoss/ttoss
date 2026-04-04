# @ttoss/http-server-mcp

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server integration for [@ttoss/http-server](https://ttoss.dev/docs/modules/packages/http-server).

## Installation

```bash
pnpm add @ttoss/http-server-mcp
```

## Quick Start

```typescript
import { App, bodyParser, cors } from '@ttoss/http-server';
import {
  createMcpRouter,
  Server as McpServer,
  z,
} from '@ttoss/http-server-mcp';

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

## Authenticated REST API Calls

When your MCP server needs to call the host application's own REST API on behalf of the authenticated caller, configure `apiBaseUrl` and use the `apiCall` helper inside tool handlers.

`createMcpRouter` extracts the `Authorization: Bearer <token>` header from each incoming MCP request and makes it available to `apiCall` via an `AsyncLocalStorage` context — no manual wiring required.

```typescript
import {
  apiCall,
  createMcpRouter,
  Server as McpServer,
} from '@ttoss/http-server-mcp';

const mcpServer = new McpServer({ name: 'my-server', version: '1.0.0' });

mcpServer.registerTool(
  'list-portfolios',
  { description: 'List all portfolios', inputSchema: {} },
  async () => {
    // apiCall automatically forwards the caller's Bearer token
    const data = await apiCall('GET', '/portfolios');
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

mcpServer.registerTool(
  'create-portfolio',
  {
    description: 'Create a portfolio',
    inputSchema: { name: z.string() },
  },
  async ({ name }) => {
    const result = await apiCall('POST', '/portfolios', { name });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

const mcpRouter = createMcpRouter(mcpServer, {
  // apiCall will prepend this base URL to all paths
  apiBaseUrl: `http://localhost:${process.env.PORT}/api/v1`,
});
```

`apiCall` throws if called outside an active MCP request context (i.e., without `apiBaseUrl` configured).

## API Reference

### `createMcpRouter(server, options?)`

Creates a Koa router configured to handle MCP protocol requests.

**Parameters:**

- `server` (`McpServer`) - MCP server instance with registered tools and resources
- `options` (`McpRouterOptions`) - Optional configuration
  - `path` (`string`) - HTTP path for MCP endpoint (default: `'/mcp'`)
  - `sessionIdGenerator` (`() => string`) - Session ID generator for stateful servers (default: `undefined` for stateless)
  - `apiBaseUrl` (`string`) - Base URL for authenticated internal REST API calls via `apiCall`

**Returns:** `Router` - Koa router instance

### `apiCall(method, path, body?)`

Makes an authenticated REST API call using the current MCP request's auth token. Must be called within a tool handler when `apiBaseUrl` is configured.

**Parameters:**

- `method` (`string`) - HTTP method (`'GET'`, `'POST'`, `'PUT'`, `'DELETE'`, …)
- `path` (`string`) - Path appended to `apiBaseUrl` (e.g. `'/portfolios'`)
- `body` (`unknown`, optional) - Request body, serialised as JSON

**Returns:** `Promise<unknown>` - Parsed JSON response body

## Examples

### Basic Tool

```typescript
import { Server as McpServer, z } from '@ttoss/http-server-mcp';

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
