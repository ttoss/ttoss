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
  test('throws when called with a relative path and no apiBaseUrl context', async () => {
    await expect(apiCall('GET', '/test')).rejects.toThrow(
      'apiCall received a relative path'
    );
  });

  test('works with a full URL outside any MCP context (public API)', async () => {
    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/public/data', (ctx) => {
        ctx.body = { value: 42 };
      });
    });

    try {
      const result = await apiCall('GET', `${baseUrl}/public/data`);
      expect(result).toEqual({ value: 42 });
    } finally {
      await close();
    }
  });

  test('per-call headers override context-injected headers', async () => {
    let capturedAuthorization = '';
    let capturedXApiKey = '';

    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/resource', (ctx) => {
        capturedAuthorization = (ctx.headers.authorization as string) ?? '';
        capturedXApiKey = (ctx.headers['x-api-key'] as string) ?? '';
        ctx.body = {};
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

      mcpServer.registerTool(
        'get-resource',
        { description: 'Get resource', inputSchema: {} },
        async () => {
          // Per-call header should override the context-injected Bearer token
          await apiCall('GET', '/resource', {
            headers: { Authorization: 'Bearer overridden-token' },
          });
          return { content: [{ type: 'text', text: '{}' }] };
        }
      );

      const mcpApp = new App();
      mcpApp.use(bodyParser());
      const mcpRouter = createMcpRouter(mcpServer, {
        apiBaseUrl: `${baseUrl}/v1`,
        // Context only injects Authorization; x-api-key is NOT in context
        getApiHeaders: (ctx) => {
          return {
            Authorization: ctx.headers.authorization ?? '',
          };
        },
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
        .set('Accept', MCP_ACCEPT)
        .set('Authorization', 'Bearer original-token');

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'get-resource', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT)
        .set('Authorization', 'Bearer original-token');

      // Per-call override wins over the context-injected token
      expect(capturedAuthorization).toBe('Bearer overridden-token');
      // x-api-key was not configured in context and not passed per-call — must be absent
      expect(capturedXApiKey).toBeFalsy();
    } finally {
      await close();
    }
  });
});

describe('createMcpRouter with getApiHeaders', () => {
  test('forwards Bearer token via getApiHeaders to apiCall inside tool handler', async () => {
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
        getApiHeaders: (ctx) => {
          return {
            Authorization: ctx.headers.authorization ?? '',
          };
        },
      });
      mcpApp.use(mcpRouter.routes());

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
      expect(capturedAuth).toContain('Bearer test-token-abc');
    } finally {
      await close();
    }
  });

  test('forwards x-api-key via getApiHeaders to apiCall inside tool handler', async () => {
    const capturedApiKey: string[] = [];

    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/items', (ctx) => {
        capturedApiKey.push((ctx.headers['x-api-key'] as string) ?? '');
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
        getApiHeaders: (ctx) => {
          return {
            'x-api-key': (ctx.headers['x-api-key'] as string) ?? '',
          };
        },
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
        .set('Accept', MCP_ACCEPT)
        .set('x-api-key', 'my-secret-key');

      await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'list-items', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT)
        .set('x-api-key', 'my-secret-key');

      expect(capturedApiKey).toContain('my-secret-key');
    } finally {
      await close();
    }
  });

  test('apiCall sends request body when provided via options.body', async () => {
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
          const result = await apiCall('POST', '/items', { body: { name } });
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
        .set('Accept', MCP_ACCEPT);

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

  test('router without apiBaseUrl or getApiHeaders works as before', async () => {
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
});
