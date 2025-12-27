# HTTP Server MCP Calculator Example

This example demonstrates how to create a single HTTP server that exposes both REST and MCP (Model Context Protocol) endpoints, sharing the same business logic.

Using [`@ttoss/http-server`](https://ttoss.dev/docs/modules/packages/http-server/) and [`@ttoss/http-server-mcp`](https://ttoss.dev/docs/modules/packages/http-server-mcp/), which are built on top of [Koa](https://koajs.com/) and the official [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), this example showcases how to integrate traditional REST APIs with AI-compatible MCP endpoints in a single application.

## Features

- **Shared Business Logic**: A simple `sum` function used by both REST and MCP endpoints
- **REST Endpoint**: `POST /sum` - Traditional HTTP API
- **MCP Endpoint**: `POST /mcp` - AI-compatible MCP protocol
- **Single Server**: Both endpoints run on the same server instance

## Running the Example

```bash
# Clone the ttoss repository
git clone https://github.com/ttoss/ttoss.git
cd ttoss

# Install dependencies from monorepo root
pnpm install

# Navigate to this example
cd examples/http-server-mcp-calculator

# Run the example
pnpm dev
```

The server will start on `http://localhost:3000`.

## Testing the Endpoints

### REST Endpoint

```bash
curl -X POST http://localhost:3000/sum \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 3}'
```

Expected response:

```json
{
  "result": 8,
  "operation": "5 + 3 = 8"
}
```

### MCP Endpoint

The MCP endpoint follows the [Model Context Protocol specification](https://modelcontextprotocol.io) and can be called by AI assistants like Claude Desktop.

Configure in Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "calculator": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Or test with the MCP Inspector CLI:

```bash
# List available tools
npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp \
  --transport http --method tools/list

# Call the sum tool
npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp \
  --transport http --method tools/call \
  --tool-name sum --tool-arg a=5 --tool-arg b=3
```

Or test manually with raw JSON-RPC:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "sum",
      "arguments": {
        "a": 5,
        "b": 3
      }
    },
    "id": 1
  }'
```

## Key Concepts

### 1. Shared Business Logic

```typescript
// Single source of truth
const sum = (a: number, b: number) => a + b;
```

This function is reused by both REST and MCP endpoints, ensuring consistency.

### 2. REST Endpoint

Traditional HTTP API that directly uses the business logic:

```typescript
router.post('/sum', (ctx) => {
  const { a, b } = ctx.request.body;
  const result = sum(a, b);
  ctx.body = { result, operation: `${a} + ${b} = ${result}` };
});
```

### 3. MCP Endpoint

AI-compatible endpoint that also uses the same business logic:

```typescript
mcpServer.registerTool(
  'sum',
  {
    description: 'Add two numbers together',
    inputSchema: {
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    },
  },
  async ({ a, b }) => {
    const result = sum(a, b);
    return {
      content: [{ type: 'text', text: `${a} + ${b} = ${result}` }],
    };
  }
);
```

### 4. Single Server Instance

Both endpoints are mounted on the same Koa app:

```typescript
const app = new App();
app.use(restRouter.routes()); // REST endpoints
app.use(mcpRouter.routes()); // MCP endpoints
app.listen(3000);
```

## Benefits of This Architecture

1. **Code Reuse**: Business logic is written once, used everywhere
2. **Consistency**: Same validation and behavior across protocols
3. **Maintainability**: Changes to business logic automatically apply to all endpoints
4. **Flexibility**: Support both traditional clients (REST) and AI assistants (MCP)
5. **Resource Efficiency**: Single server process handles all traffic

## Learn More

- [@ttoss/http-server](https://ttoss.dev/docs/modules/packages/http-server/)
- [@ttoss/http-server-mcp](https://ttoss.dev/docs/modules/packages/http-server-mcp/)
- [Model Context Protocol](https://modelcontextprotocol.io)
