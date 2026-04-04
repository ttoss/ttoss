import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { App, bodyParser, Router } from '@ttoss/http-server';
import { apiCall, createMcpRouter, z } from 'src/index';
import request from 'supertest';

// MCP SDK 1.x requires both application/json and text/event-stream in the Accept header
const MCP_ACCEPT = 'application/json, text/event-stream';

/** Build and start a lightweight REST server. Returns the base URL and a cleanup function. */
const startRestServer = (
  setup: (router: InstanceType<typeof Router>) => void
): Promise<{ baseUrl: string; close: () => Promise<void> }> => {
  return new Promise((resolve) => {
    const restApp = new App();
    const restRouter = new Router();
    restApp.use(bodyParser());
    setup(restRouter);
    restApp.use(restRouter.routes());

    const server = restApp.listen(0, () => {
      const { port } = server.address() as { port: number };
      resolve({
        baseUrl: `http://localhost:${port}`,
        close: () => {
          return new Promise<void>((res, rej) => {
            return server.close((err) => {
              return err ? rej(err) : res();
            });
          });
        },
      });
    });
  });
};

describe('apiCall', () => {
  test('throws when called outside an MCP request context', async () => {
    await expect(apiCall('GET', '/test')).rejects.toThrow(
      'apiCall must be called within an MCP request context'
    );
  });
});

describe('createMcpRouter with apiBaseUrl', () => {
  test('forwards Authorization header to apiCall inside tool handler', async () => {
    const capturedAuth: string[] = [];

    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/items', (ctx) => {
        capturedAuth.push((ctx.headers.authorization as string) ?? '');
        ctx.body = [{ id: 1 }];
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

      mcpServer.registerTool(
        'list-items',
        { description: 'List items', inputSchema: {} },
        async () => {
          const data = await apiCall('GET', '/items');
          return {
            content: [{ type: 'text', text: JSON.stringify(data) }],
          };
        }
      );

      const mcpApp = new App();
      mcpApp.use(bodyParser());
      const mcpRouter = createMcpRouter(mcpServer, {
        apiBaseUrl: `${baseUrl}/v1`,
      });
      mcpApp.use(mcpRouter.routes());

      // 1. Initialize the MCP session
      const initRes = await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT)
        .set('Authorization', 'Bearer test-token-abc');

      expect(initRes.status).toBe(200);

      // 2. Call the tool – this triggers apiCall inside the handler
      const toolRes = await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'list-items', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT)
        .set('Authorization', 'Bearer test-token-abc');

      expect(toolRes.status).toBe(200);

      // The REST server should have received the forwarded token
      expect(capturedAuth).toContain('Bearer test-token-abc');
    } finally {
      await close();
    }
  });

  test('apiCall sends request body when provided', async () => {
    let capturedBody: unknown;

    const { baseUrl, close } = await startRestServer((router) => {
      router.post('/v1/items', (ctx) => {
        capturedBody = ctx.request.body;
        ctx.status = 201;
        ctx.body = { id: 2 };
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

      mcpServer.registerTool(
        'create-item',
        {
          description: 'Create an item',
          inputSchema: { name: z.string() },
        },
        async ({ name }) => {
          const result = await apiCall('POST', '/items', { name });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        }
      );

      const mcpApp = new App();
      mcpApp.use(bodyParser());
      const mcpRouter = createMcpRouter(mcpServer, {
        apiBaseUrl: `${baseUrl}/v1`,
      });
      mcpApp.use(mcpRouter.routes());

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'create-item', arguments: { name: 'widget' } },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT)
        .set('Authorization', 'Bearer token-xyz');

      expect(capturedBody).toEqual({ name: 'widget' });
    } finally {
      await close();
    }
  });

  test('apiCall propagates REST API errors to the tool handler', async () => {
    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/fail', (ctx) => {
        ctx.status = 404;
        ctx.body = { error: 'Resource not found' };
      });
    });

    let capturedError: Error | undefined;

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

      mcpServer.registerTool(
        'failing-tool',
        {
          description: 'A tool that calls a failing endpoint',
          inputSchema: {},
        },
        async () => {
          try {
            await apiCall('GET', '/fail');
          } catch (error) {
            capturedError = error as Error;
          }
          return { content: [{ type: 'text', text: 'done' }] };
        }
      );

      const mcpApp = new App();
      mcpApp.use(bodyParser());
      const mcpRouter = createMcpRouter(mcpServer, {
        apiBaseUrl: `${baseUrl}/v1`,
      });
      mcpApp.use(mcpRouter.routes());

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'failing-tool', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      expect(capturedError).toBeDefined();
      expect(capturedError?.message).toBe('Resource not found');
    } finally {
      await close();
    }
  });

  test('router without apiBaseUrl works as before (no context overhead)', async () => {
    const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
    const app = new App();
    app.use(bodyParser());
    const mcpRouter = createMcpRouter(mcpServer);
    app.use(mcpRouter.routes());

    const response = await request(app.callback())
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
        id: 1,
      })
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT);

    expect(response.status).toBe(200);
  });

  test('does not forward Authorization header when incoming request has no token', async () => {
    const capturedAuth: string[] = [];

    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/data', (ctx) => {
        capturedAuth.push((ctx.headers.authorization as string) ?? '');
        ctx.body = {};
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

      mcpServer.registerTool(
        'get-data',
        { description: 'Get data', inputSchema: {} },
        async () => {
          await apiCall('GET', '/data');
          return { content: [{ type: 'text', text: '{}' }] };
        }
      );

      const mcpApp = new App();
      mcpApp.use(bodyParser());
      const mcpRouter = createMcpRouter(mcpServer, {
        apiBaseUrl: `${baseUrl}/v1`,
      });
      mcpApp.use(mcpRouter.routes());

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'get-data', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);
      // No Authorization header on either request above

      // apiCall should NOT have sent an Authorization header
      expect(
        capturedAuth.every((h) => {
          return !h;
        })
      ).toBe(true);
    } finally {
      await close();
    }
  });
});
