# Migrations

## One `Tool` type: `registerTools` replaces `registerToolFromSchema` and `createGatedToolRegistrar`

A tool is now one value, `Tool`, and registering is one call, `registerTools`,
which also exposes tools behind a [search / describe / call
catalog](./README.md#catalog-for-large-tool-sets). Gating became a function
from `Tool` to `Tool`, so a gated tool joins a catalog like any other.

**`registerToolFromSchema`** — wrap the params in a `tools` list:

```diff
-registerToolFromSchema(server, {
-  name: 'get-project',
-  description: 'Get a project',
-  inputSchema,
-  handler,
-});
+registerTools({
+  server,
+  tools: [{ name: 'get-project', description: 'Get a project', inputSchema, handler }],
+});
```

`description` is now required. `validateArguments` and `_meta` keep their
meaning, as fields of the tool.

**`createGatedToolRegistrar`** — the registrar options become gate options
(minus `server` and `notFoundMessage`), and each `register(def)` becomes a
gated `defineTool`:

```diff
-const { register } = createGatedToolRegistrar({ server, resolveIdentity, gates });
+const gate = createToolGate({ resolveIdentity, gates });

-register({
-  name: 'list-campaigns',
-  description: 'List campaigns.',
-  requiredScope: 'campaigns:read',
-  inputSchema: { limit: z.number().optional() },
-  method: ({ limit }) => fetchCampaigns(limit),
-});
+registerTools({
+  server,
+  tools: [
+    gate({
+      requiredScope: 'campaigns:read',
+      tool: defineTool({
+        name: 'list-campaigns',
+        description: 'List campaigns.',
+        inputSchema: z.object({ limit: z.number().optional() }),
+        method: ({ limit }) => fetchCampaigns(limit),
+      }),
+    }),
+  ],
+});
```

- **`inputSchema` and `outputSchema` take `z.object({...})`**, not a Zod field
  map: a schema is now a JSON Schema or a Standard Schema. Wrap
  `{ limit: z.number() }` as `z.object({ limit: z.number() })`.
- **`notFoundMessage` moved to `defineTool`**, per tool. A registrar-wide value
  is now a wrapper around `defineTool` that sets it.
- **Per-tool `gates` move to the gate call**, next to `requiredScope`.
- `GatedToolDef` and `CreateGatedToolRegistrarOptions` are gone;
  `CreateToolGateOptions`, `ToolCallGate`, `ToolCallContext` and
  `ToolIdentity` remain.

**What you will observe if you miss this.** The build fails: every removed
export is a missing import, and a Zod field map passed as `inputSchema` is a
type error. Nothing changes at runtime for code that compiles — results,
scope refusals, gate order and localized errors are byte-for-byte the same.

## The `2026-07-28` revision needs `createMcpServer`

That revision is served only when `createMcpRouter` is given a
`createMcpServer` factory.

```diff
+const buildServer = () => {
+  const mcpServer = new McpServer({ name: 'my-server', version: '1.0.0' });
+  registerEverything(mcpServer);
+  return mcpServer;
+};
+
-createMcpRouter(mcpServer, {
+createMcpRouter(buildServer(), {
+  createMcpServer: buildServer,
   auth: { ... },
 });
```

**Why it cannot default to the server you already pass.** The negotiated
revision is instance state: serving one `2026-07-28` request marks that
`McpServer` modern for good, and it then validates every later message against
that revision. One instance serving both eras is pinned by the first client to
speak the newer one, after which every 2025-era request is answered
`-32602 Request is missing the required _meta envelope for protocol revision
2026-07-28` at **HTTP 200** for the life of the process — a status and body a
client reads as "no tools" rather than as a fault. The SDK's own serving
entries take a factory and call it once per request for this reason.

**What you will observe if you miss this.** A client speaking `2026-07-28` gets
`400` with `-32022 Unsupported protocol version` and `data.supported` listing
the 2025-era revisions, which it can renegotiate from. Only deployments
actually receiving that traffic are affected; every client without the
per-request envelope is served exactly as before.

## `tools/list` is no longer public by default

`auth.publicMethods` now defaults to `['initialize']` instead of
`['initialize', 'tools/list']`. A server with `auth` configured no longer
serves its tool catalogue to unauthenticated callers.

```diff
 createMcpRouter(mcpServer, {
   auth: {
     cognitoUserPool: { userPoolId: '...', clientId: '...' },
+    // Only needed if unauthenticated callers must keep listing tools.
+    publicMethods: ['initialize', 'tools/list'],
   },
 });
```

**What you will observe if you miss this.** An unauthenticated `tools/list`
returns `401` with `WWW-Authenticate: Bearer resource_metadata="…"` instead of
`200` and the catalogue. It fails on the first such request rather than on
particular inputs, so a smoke test against a deployed server surfaces it
immediately.

**Who is affected.** Only consumers that configure `auth` and never set
`publicMethods`. Anyone already passing `publicMethods` — including
`publicMethods: []` — is unaffected, and so is any server without `auth`.

**Who should not restore the old value.** OAuth clients do not need it. The
`401` and its RFC 9728 challenge are what start the authorization flow, and a
client that lists tools anonymously still cannot call one; the flow reaches the
authorization redirect identically with `tools/list` open or closed. Restore it
only to serve callers that will never authenticate, and note what that exposes:
every tool name, description, and input schema, which for an OpenAPI-derived
server is a map of the whole underlying API.

The one-time startup warning that pre-announced this change is gone, since the
default it warned about is now the secure one.
