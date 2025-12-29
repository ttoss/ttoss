import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, z } from 'src/index';
import request from 'supertest';

describe('createMcpRouter', () => {
  test('should create a router with default path', () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const router = createMcpRouter(mcpServer);

    expect(router).toBeDefined();
    expect(router.routes).toBeDefined();
  });

  test('should create a router with custom path', () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const router = createMcpRouter(mcpServer, { path: '/custom-mcp' });

    expect(router).toBeDefined();
  });

  test('should mount router on app', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());

    const router = createMcpRouter(mcpServer);
    app.use(router.routes());

    expect(app).toBeDefined();
  });

  test('should accept POST requests on MCP path', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());

    const router = createMcpRouter(mcpServer);
    app.use(router.routes());

    const response = await request(app.callback())
      .post('/mcp')
      .send({ test: 'data' })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.status).not.toBe(404);
    expect(response.status).not.toBe(405);
  });

  test('should return 404 for GET requests (no SSE support)', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    const router = createMcpRouter(mcpServer);
    app.use(router.routes());

    const response = await request(app.callback()).get('/mcp');

    expect(response.status).toBe(404);
  });

  test('should accept DELETE requests for session termination', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    const router = createMcpRouter(mcpServer);
    app.use(router.routes());

    const response = await request(app.callback()).delete('/mcp');

    // Should not be 404 - route exists (may return 405 if server doesn't support session termination)
    expect(response.status).not.toBe(404);
  });

  test('should register tools', () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    mcpServer.registerTool(
      'test-tool',
      {
        description: 'A test tool',
        inputSchema: {
          param: z.string(),
        },
      },
      async ({ param }) => {
        return {
          content: [{ type: 'text', text: param }],
        };
      }
    );

    const router = createMcpRouter(mcpServer);
    expect(router).toBeDefined();
  });

  test('should work with custom path', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());

    const router = createMcpRouter(mcpServer, { path: '/api/mcp' });
    app.use(router.routes());

    const response = await request(app.callback())
      .post('/api/mcp')
      .send({})
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream');

    expect(response.status).not.toBe(404);
  });

  test('should return 404 for unregistered paths', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());

    const router = createMcpRouter(mcpServer);
    app.use(router.routes());

    const response = await request(app.callback()).post('/unknown');

    expect(response.status).toBe(404);
  });

  test('should support multiple tools registration', () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    mcpServer.registerTool(
      'tool1',
      {
        description: 'First tool',
        inputSchema: { a: z.string() },
      },
      async ({ a }) => {
        return {
          content: [{ type: 'text', text: a }],
        };
      }
    );

    mcpServer.registerTool(
      'tool2',
      {
        description: 'Second tool',
        inputSchema: { b: z.number() },
      },
      async ({ b }) => {
        return {
          content: [{ type: 'text', text: String(b) }],
        };
      }
    );

    const router = createMcpRouter(mcpServer);
    expect(router).toBeDefined();
  });
});
