# Migrations

## `openApiToTools` replaces `registerOpenApiTools`

The package now derives tools and leaves registering them to `registerTools`
from `@ttoss/http-server-mcp`, which can also expose them behind a
[search / describe / call catalog](./README.md#a-catalog-for-a-large-api).

```diff
-import { registerOpenApiTools } from '@ttoss/http-server-mcp-openapi';
+import { registerTools } from '@ttoss/http-server-mcp';
+import { openApiToTools } from '@ttoss/http-server-mcp-openapi';

-registerOpenApiTools({ server, spec, callApi, serverParameters });
+registerTools({
+  server,
+  tools: openApiToTools({ spec, callApi, serverParameters }),
+});
```

Every other argument keeps its name and meaning; only `server` moves to
`registerTools`. `RegisterOpenApiToolsArgs` is now `OpenApiToToolsArgs`,
without `server`.

The return value changed: `registerOpenApiTools` answered the
`ToolDefinition`s, `openApiToTools` answers `OpenApiTool`s, each carrying its
`ToolDefinition` as `definition`. Replace `tool.method` with
`tool.definition.method`, and so on, wherever you read the result.

`ToolDefinition` gained `tags`, copied from the operation. A consumer that
builds `ToolDefinition` objects by hand must add it.

**What you will observe if you miss this.** The build fails on the missing
`registerOpenApiTools` import. Generated tools answer exactly as before.
