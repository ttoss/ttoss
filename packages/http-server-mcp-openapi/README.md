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
  // `headers` is what createMcpRouter's `getApiHeaders` produced for this
  // MCP request — typically the caller's credentials.
  callApi: async ({ method, url, body, headers }) => {
    const res = await fetch(`https://api.example.com${url}`, {
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined;
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
| path/query/body params    | a single `inputSchema` object                |
| `$ref`, `oneOf`, `anyOf`  | dereferenced and merged into a flat schema   |
| snake_case names          | camelCase tool inputs, mapped back on call   |
| operation `description`   | tool description (quotes/newlines sanitised) |

Path params are always required strings. Query and body params carry their
declared type and `required` flag. Array params keep their `items` schema. A
body property declared as a single-entry `allOf` (usually `allOf: [{ $ref }]`
beside its own `description`) takes `type`, `nullable` and `items` from the
referenced schema; a multi-entry `allOf` is forwarded verbatim, and a property
with no declared type is advertised untyped so it accepts any value.
OpenAPI's `nullable` becomes JSON Schema at every depth — inside `items`,
`properties`, `additionalProperties` and `oneOf` / `anyOf` / `allOf`
alternatives: `nullable: true` adds `'null'` to the `type`, and the keyword is
dropped.
Parameters declared at the **path-item level** (shared by every operation on a
path) are merged into each operation; an operation-level parameter overrides a
path-item one with the same `name`+`in`.

By default tool arguments are **camelCase** (`agentId`, `projectId`) and the
generated request path, query string, and body use the spec's original names.
Set `argumentNames: 'verbatim'` to use the spec's names as the arguments too,
so the MCP contract matches the REST contract exactly.

Query params honour their declared `style` and `explode`. `form` (the default)
repeats array values, `spaceDelimited`/`pipeDelimited` join them, and
`deepObject` emits bracketed keys — including nested objects and arrays, so
`{ documentId: { $eq: 'doc_1' } }` becomes `filters[documentId][$eq]=doc_1`.

## `registerOpenApiTools`

| Field                  | Description                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `server`               | The `McpServer` to register tools on.                                                                         |
| `spec`                 | One OpenAPI document, or an array of them (tools are flattened).                                              |
| `callApi`              | Runs the resolved `{ method, url, body, tool, headers }` request and returns the raw data.                    |
| `toText?`              | Serialises the raw data into the tool's text payload. Defaults to pretty JSON; strings pass through verbatim. |
| `serverParameters?`    | Supplies server-managed path/query parameter values. See [Server-managed values](#server-managed-values).     |
| `toStructuredContent?` | `({ data, tool })` → the result's `structuredContent`, sent beside the text. `undefined` keeps it text-only.  |
| `toolMeta?`            | `({ tool })` → the tool's `_meta` on `tools/list`. See [MCP Apps views](#mcp-apps-views).                     |
| `options?`             | See [Options](#options).                                                                                      |

The default `toText` answers `NO_CONTENT_TEXT` (`Succeeded. The operation
returned no content.`) when `callApi` resolves `undefined` or `''`, so a `204`
reaches the client as a success.

Returns the list of `ToolDefinition`s that were registered.

### MCP Apps views

A generated tool links to a view through `toolMeta`, and the view reads the
result from `structuredContent`:

```typescript
import { registerAppResource } from '@ttoss/http-server-mcp';

const agentCard = registerAppResource({
  server,
  name: 'agent_card',
  uri: 'ui://agents/card',
  html: agentCardHtml,
});

registerOpenApiTools({
  server,
  spec,
  callApi,
  toolMeta: ({ tool }) => {
    return tool.name === 'get-agent' ? agentCard.toolMeta() : undefined;
  },
  toStructuredContent: ({ data, tool }) => {
    return tool.name === 'get-agent'
      ? (data as Record<string, unknown>)
      : undefined;
  },
});
```

Keep the text payload: a host without MCP Apps support renders only that.

## Calling the API In-Process

When the REST API runs in the same process as the MCP server,
`createInProcessCallApi` dispatches each tool call through the app's own
middleware chain with no socket (see `dispatchInProcess` in
[@ttoss/http-server](https://ttoss.dev/docs/modules/packages/http-server)), so
validation, authorization and error handling exist once, in the routes. The MCP
request's headers — what `createMcpRouter`'s `getApiHeaders` produced — are
forwarded onto the dispatched request.

```typescript
import {
  createInProcessCallApi,
  registerOpenApiTools,
} from '@ttoss/http-server-mcp-openapi';

registerOpenApiTools({
  server,
  spec,
  callApi: createInProcessCallApi({
    app, // or () => app, when the app is built after the tools
    headers: () => ({ 'x-via': 'mcp' }), // optional, added to every call
  }),
});

const router = createMcpRouter(server, {
  getApiHeaders: (ctx) => ({ authorization: ctx.headers.authorization ?? '' }),
});
app.use(router.routes());
```

A 2xx answers its body. Anything else throws, so the client sees a tool error
rather than an error body rendered as a result: the message is read from a
string body, `{ error: '…' }`, `{ error: { code, message } }` (as
`code: message`) or `{ message: '…' }` (exported as `errorMessageOf`), falling
back to `HTTP <status>`. Pass `toError` to build the error yourself.

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
`acceptedBodyFields`, `extensions`, and `serverManagedParameters`.

## Options

```typescript
registerOpenApiTools({
  server,
  spec,
  callApi,
  options: {
    excludeExtension: 'x-mcp-exclude', // operations flagged truthy are skipped
    serverManagedExtension: 'x-mcp-server-managed', // or several: ['x-a', 'x-b']
    argumentNames: 'camelCase', // or 'verbatim'
    documents: { './tags.yaml': tagsDocument }, // targets of cross-file $refs
    schemaDetail: 'full', // or 'compact' (default)
    describe: ({ operation, method, pathTemplate }) => operation.summary ?? '',
  },
});
```

- **`excludeExtension`** (default `x-mcp-exclude`) — an operation with this
  extension set truthy is omitted from the tool surface.
- **`serverManagedExtension`** (default `x-mcp-server-managed`) — one name or
  an array of names; see [Server-managed values](#server-managed-values).
- **`argumentNames`** (default `camelCase`) — `verbatim` keeps the spec's
  parameter and property names as tool argument names.
- **`documents`** — sibling documents for `$ref`s with a file part, keyed by
  that part as the spec writes it (a leading `./` is optional). In
  `./tags.yaml#/components/schemas/Tag` the key is `./tags.yaml`; refs inside
  a sibling resolve against that sibling. A ref to a file missing from the map
  resolves to an empty schema, which accepts any value.

- **`schemaDetail`** (default `compact`) — see [Schema detail](#schema-detail).
- **`describe`** — builds each tool's description from `{ operation, method, pathTemplate }`
  (method uppercase). The default is the operation's `description` flattened to one line.

### Schema detail

`compact` gives each top-level argument its `type`, `items` and `description`,
with descriptions flattened to one line. It is the smallest surface, and the
model learns nothing about which values are allowed.

`full` gives each argument its whole schema: `enum`, `format`, `pattern`,
`minimum`/`maximum`, `default`, nested `properties` and `required`, `oneOf`,
`additionalProperties`, and descriptions verbatim. It changes only what JSON
Schema cannot express:

- `allOf` is merged — the properties and `required` of an object composition,
  or a single referenced scalar with the wrapper's own `description` winning;
- `nullable: true` adds `'null'` to the `type`, and `null` to an `enum`;
- OpenAPI-only keywords (`example`, `discriminator`, `xml`, `externalDocs`) and
  `x-` extensions are dropped;
- a path or query parameter's own `description` wins over its schema's.

`properties` is always present in `full`, even when empty. The same
transformation is exported as `toToolSchema`, for a schema you derive yourself.

### Server-managed values

A value flagged with `serverManagedExtension` is never offered to the model:

- A **request-body property** is hidden from `inputSchema` and, unless pinned,
  never sent (the API sets it itself). It still appears in
  `acceptedBodyFields`.
- A **path or query parameter** is hidden from `inputSchema` and listed in
  `tool.serverManagedParameters`. `registerOpenApiTools` discards anything the
  model sent for it and fills it from `serverParameters`, keyed by spec name:

```typescript
registerOpenApiTools({
  server,
  spec,
  callApi,
  serverParameters: ({ tool, headers }) => ({
    project_id: projectIdFromToken(headers.Authorization),
  }),
});
```

With `openApiToToolDefinitions`, set each entry's `argName` in the args before
calling `tool.path` / `tool.query`.

A **string** extension value pins the parameter: `wait` declared with
`x-mcp-server-managed: 'true'` is always sent as `wait=true`. `tool.path` and
`tool.query` apply pinned values themselves, over anything in the args or
`serverParameters`, and the entry in `serverManagedParameters` carries it as
`value`.

A pinned **request-body property** is sent by `tool.body`, over anything in the
args, as the JSON type its schema declares: `'true'` on a `boolean` is `true`,
`'3'` on an `integer` is `3`. A pin its type cannot hold (`'yes'` on a
`boolean`, any pin on an `object`, `array` or untyped property) throws while
the tools are generated, naming the operation and property.

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
