/* eslint-disable no-console */
import {
  addHealthCheck,
  App,
  bodyParser,
  cors,
  Router,
} from '@ttoss/http-server';
import {
  createMcpRouter,
  Server as McpServer,
  z,
} from '@ttoss/http-server-mcp';

/**
 * Business logic: Simple sum function
 * This is our single source of truth that will be reused by both REST and MCP endpoints
 */
const sum = (a: number, b: number): number => {
  return a + b;
};

/**
 * Create the HTTP server
 */
const app = new App();

// Add middleware
app.use(cors());
app.use(bodyParser());

// Add health check endpoint
addHealthCheck({ app });

/**
 * REST API Setup
 * Traditional HTTP endpoints for regular clients
 */
const restRouter = new Router();

restRouter.post('/sum', (ctx) => {
  const { a, b } = ctx.request.body as { a: number; b: number };

  // Validate inputs
  if (typeof a !== 'number' || typeof b !== 'number') {
    ctx.status = 400;
    ctx.body = {
      error: 'Both a and b must be numbers',
    };
    return;
  }

  // Reuse business logic
  const result = sum(a, b);

  ctx.body = {
    result,
    operation: `${a} + ${b} = ${result}`,
  };
});

// Mount REST routes
app.use(restRouter.routes());
app.use(restRouter.allowedMethods());

/**
 * MCP Server Setup
 * AI-compatible endpoints following the Model Context Protocol
 */
const mcpServer = new McpServer({
  name: 'calculator-server',
  version: '1.0.0',
});

// Register the sum tool using the same business logic
mcpServer.registerTool(
  'sum',
  {
    description: 'Add two numbers together',
    inputSchema: {
      a: z.number().describe('First number to add'),
      b: z.number().describe('Second number to add'),
    },
  },
  async ({ a, b }) => {
    // Reuse the same business logic as REST endpoint
    const result = sum(a, b);

    return {
      content: [
        {
          type: 'text',
          text: `${a} + ${b} = ${result}`,
        },
      ],
    };
  }
);

// Create and mount MCP router
const mcpRouter = createMcpRouter(mcpServer);
app.use(mcpRouter.routes());

/**
 * Start the server
 * Both REST and MCP endpoints will be available on the same port
 */
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`\n📍 Available endpoints:`);
  console.log(`   - Health: GET http://localhost:${PORT}/health`);
  console.log(`   - REST:   POST http://localhost:${PORT}/sum`);
  console.log(`   - MCP:    POST http://localhost:${PORT}/mcp`);
  console.log(`\n💡 Try it out:`);
  console.log(
    `   curl -X POST http://localhost:${PORT}/sum -H "Content-Type: application/json" -d '{"a": 5, "b": 3}'`
  );
});
