import { App, bodyParser, Router } from '@ttoss/http-server';
import { apiCall, createMcpRouter, McpServer, z } from 'src/index';
import request from 'supertest';

// MCP SDK 1.x requires both application/json and text/event-stream in the Accept header
const MCP_ACCEPT = 'application/json, text/event-stream';

/** Build and start a lightweight REST server. Returns the base URL and a cleanup function. */
const startRestServer = (
  setup: (router: InstanceType<typeof Router>) => void
): Promise<{ baseUrl: string; close: () => Promise<void> }> => {
  return new Promise((resolve) => {
    const restApp = new App();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restRouter = new Router<any, any>();
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

  test('throws HTTP <status> when the error body is JSON without an `error` key', async () => {
    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/no-error-key', (ctx) => {
        ctx.status = 500;
        ctx.body = { message: 'something else entirely' };
      });
    });

    try {
      await expect(apiCall('GET', `${baseUrl}/no-error-key`)).rejects.toThrow(
        'HTTP 500'
      );
    } finally {
      await close();
    }
  });

  test('throws with statusText when error response body is not valid JSON', async () => {
    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/bad', (ctx) => {
        ctx.status = 503;
        ctx.type = 'text/plain';
        ctx.body = 'Service Unavailable';
      });
    });

    let capturedError: Error | undefined;

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });

      mcpServer.registerTool(
        'bad-endpoint',
        {
          description: 'Calls an endpoint that returns non-JSON error',
          inputSchema: {},
        },
        async () => {
          try {
            await apiCall('GET', '/bad');
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
          params: { name: 'bad-endpoint', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      expect(capturedError).toBeDefined();
      expect(capturedError?.message).toMatch(/Service Unavailable|HTTP 503/);
    } finally {
      await close();
    }
  });

  /**
   * REST APIs answer a failure in two shapes: `{ error: 'text' }` and a
   * structured `{ error: { code, message } }`. The object one reached
   * `new Error(...)` unread, so everything it carried arrived as
   * `[object Object]` — and inside a tool handler that string is the whole
   * answer the calling model gets.
   */
  describe('the message a failed call throws', () => {
    const messageFor = async (body: unknown, status: number) => {
      const { baseUrl, close } = await startRestServer((router) => {
        router.get('/fail', (ctx) => {
          ctx.status = status;
          ctx.body = body;
        });
      });

      try {
        return await apiCall('GET', `${baseUrl}/fail`).then(
          () => {
            return 'apiCall resolved on a non-2xx response';
          },
          (error: Error) => {
            return error.message;
          }
        );
      } finally {
        await close();
      }
    };

    test('names the code and the message of a structured error', async () => {
      const message = await messageFor(
        {
          error: {
            code: 'plan_feature_not_included',
            message: 'Guardrails are not included on the free plan.',
          },
        },
        403
      );

      expect(message).toBe(
        'plan_feature_not_included: Guardrails are not included on the free plan.'
      );
      expect(message).not.toContain('[object Object]');
    });

    test('reads a message that names no code', async () => {
      await expect(
        messageFor({ error: { message: 'Agent not found.' } }, 404)
      ).resolves.toBe('Agent not found.');
    });

    test('reads a code that carries no message', async () => {
      await expect(
        messageFor({ error: { code: 'rate_limited' } }, 429)
      ).resolves.toBe('rate_limited');
    });

    test('falls back to the status when the error object names neither', async () => {
      await expect(
        messageFor({ error: { details: { field: 'name' } } }, 422)
      ).resolves.toBe('HTTP 422');
    });

    test('falls back to the status when the body is not an object', async () => {
      await expect(messageFor(['nope'], 400)).resolves.toBe('HTTP 400');
    });

    test('falls back to the status when the error is an empty string', async () => {
      await expect(messageFor({ error: '' }, 500)).resolves.toBe('HTTP 500');
    });
  });

  test('normalizes double slash when apiBaseUrl ends with a slash', async () => {
    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/data', (ctx) => {
        ctx.body = { ok: true };
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
      mcpServer.registerTool(
        'get-data',
        { description: 'Get data', inputSchema: {} },
        async () => {
          // apiBaseUrl has a trailing slash, path has a leading slash — should not double
          const result = await apiCall('GET', '/data');
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        }
      );

      const mcpApp = new App();
      mcpApp.use(bodyParser());
      const mcpRouter = createMcpRouter(mcpServer, {
        apiBaseUrl: `${baseUrl}/v1/`, // trailing slash intentional
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

      const toolRes = await request(mcpApp.callback())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'get-data', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      expect(toolRes.status).toBe(200);
    } finally {
      await close();
    }
  });

  test('does not send Content-Type header for bodyless GET requests', async () => {
    let capturedContentType: string | undefined;

    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/check', (ctx) => {
        capturedContentType = ctx.headers['content-type'];
        ctx.body = {};
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
      mcpServer.registerTool(
        'check',
        { description: 'Check headers', inputSchema: {} },
        async () => {
          await apiCall('GET', '/check');
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
          params: { name: 'check', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      expect(capturedContentType).toBeUndefined();
    } finally {
      await close();
    }
  });

  test('returns undefined for 204 No Content responses', async () => {
    const { baseUrl, close } = await startRestServer((router) => {
      router.delete('/v1/item', (ctx) => {
        ctx.status = 204;
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
      let deleteResult: unknown = 'not-set';
      mcpServer.registerTool(
        'delete-item',
        { description: 'Delete item', inputSchema: {} },
        async () => {
          deleteResult = await apiCall('DELETE', '/item');
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
          params: { name: 'delete-item', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      expect(deleteResult).toBeUndefined();
    } finally {
      await close();
    }
  });

  test('returns plain text for non-JSON responses', async () => {
    const { baseUrl, close } = await startRestServer((router) => {
      router.get('/v1/text', (ctx) => {
        ctx.type = 'text/plain';
        ctx.body = 'hello world';
      });
    });

    try {
      const mcpServer = new McpServer({ name: 'test', version: '1.0.0' });
      let textResult: unknown;
      mcpServer.registerTool(
        'get-text',
        { description: 'Get text', inputSchema: {} },
        async () => {
          textResult = await apiCall('GET', '/text');
          return { content: [{ type: 'text', text: String(textResult) }] };
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
          params: { name: 'get-text', arguments: {} },
          id: 2,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', MCP_ACCEPT);

      expect(textResult).toBe('hello world');
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
