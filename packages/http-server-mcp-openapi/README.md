# @ttoss/http-server-mcp-openapi

Generate [Model Context Protocol (MCP)](https://modelcontextprotocol.io) tools
from an [OpenAPI](https://www.openapis.org/) specification and register them on
a [@ttoss/http-server-mcp](https://ttoss.dev/docs/modules/packages/http-server-mcp)
server.

Point it at your existing OpenAPI document and every operation becomes an MCP
tool whose handler resolves the incoming arguments into an HTTP request against
your REST API. The OpenAPI spec stays the single source of truth for both your
REST surface and your MCP tool surface.

## Installation

```bash
pnpm add @ttoss/http-server-mcp-openapi @ttoss/http-server-mcp
```

## Quick Start

```typescript
import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, McpServer } from '@ttoss/http-server-mcp';
import { registerOpenApiTools } from '@ttoss/http-server-mcp-openapi';

import openApiDocument from './openapi.json' with { type: 'json' };

const server = new McpServer({ name: 'my-api', version: '1.0.0' });

registerOpenApiTools({
  server,
  spec: openApiDocument,
  // You own how the request is executed — base URL, auth, fetch impl.
  callApi: async ({ method, url, body }) => {
    const res = await fetch(`https://api.example.com${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  },
});

const app = new App();
app.use(bodyParser());
app.use(createMcpRouter(server).routes());
app.listen(3000);
```

## How Operations Map to Tools

Each OpenAPI operation with an `operationId` and a supported HTTP method
(`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) becomes one tool:

| OpenAPI                   | MCP tool                                     |
| ------------------------- | -------------------------------------------- |
| `operationId: listAgents` | tool name `list-agents` (kebab-case)         |
| path/query/body params    | a single camelCase `inputSchema` object      |
| `$ref`, `oneOf`, `anyOf`  | dereferenced and merged into a flat schema   |
| snake_case body fields    | camelCase tool inputs, mapped back on call   |
| operation `description`   | tool description (quotes/newlines sanitised) |

Path params are always required strings. Query and body params carry their
declared type and `required` flag. Array params keep their `items` schema.
Parameters declared at the **path-item level** (shared by every operation on a
path) are merged into each operation; an operation-level parameter overrides a
path-item one with the same `name`+`in`.

Tool arguments are **camelCase** (`agentId`, `projectId`); the generated
request path, query string, and body use the original **snake_case** names.

## `registerOpenApiTools`

| Field      | Description                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| `server`   | The `McpServer` to register tools on.                                                                         |
| `spec`     | One OpenAPI document, or an array of them (tools are flattened).                                              |
| `callApi`  | Runs the resolved `{ method, url, body, tool }` request and returns the raw data.                             |
| `toText?`  | Serialises the raw data into the tool's text payload. Defaults to pretty JSON; strings pass through verbatim. |
| `options?` | See [Options](#options).                                                                                      |

Returns the list of `ToolDefinition`s that were registered.

## `openApiToToolDefinitions`

Use the lower-level function when you want the tool definitions without
registering them — to inspect, filter, or wire handlers yourself:

```typescript
import { openApiToToolDefinitions } from '@ttoss/http-server-mcp-openapi';

const tools = openApiToToolDefinitions({ spec: openApiDocument });

for (const tool of tools) {
  // tool.name, tool.method, tool.inputSchema, tool.extensions, ...
  const url = tool.path(args) + (tool.query ? tool.query(args) : '');
  const body = tool.body?.(args);
}
```

Each `ToolDefinition` exposes `name`, `description`, `inputSchema`, `method`,
`pathTemplate`, `operationId`, the `path`/`query`/`body` builders,
`acceptedBodyFields`, and `extensions`.

## Options

```typescript
registerOpenApiTools({
  server,
  spec,
  callApi,
  options: {
    excludeExtension: 'x-mcp-exclude', // operations flagged truthy are skipped
    serverManagedExtension: 'x-mcp-server-managed', // body fields hidden from the input schema
  },
});
```

- **`excludeExtension`** (default `x-mcp-exclude`) — an operation with this
  extension set truthy is omitted from the tool surface.
- **`serverManagedExtension`** (default `x-mcp-server-managed`) — a request-body
  property with this extension set truthy is hidden from the tool's
  `inputSchema` (the caller can't set it) but still appears in
  `acceptedBodyFields`.

### Reading custom extensions

Every `x-` prefixed extension on an operation is forwarded verbatim on
`tool.extensions`, so you can attach and read your own metadata without this
package needing to know about it:

```typescript
const tools = openApiToToolDefinitions({ spec: openApiDocument });
const iamAction = tools[0].extensions['x-iam-action'];
```

## Related Packages

- [@ttoss/http-server-mcp](https://ttoss.dev/docs/modules/packages/http-server-mcp) - MCP server integration for @ttoss/http-server
- [@ttoss/http-server](https://ttoss.dev/docs/modules/packages/http-server) - HTTP server foundation
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP SDK

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
