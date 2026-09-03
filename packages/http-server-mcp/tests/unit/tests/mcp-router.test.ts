import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, McpServer, z } from 'src/index';
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

  test('should support stateful mode with sessionIdGenerator', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());

    let sessionCounter = 0;
    const router = createMcpRouter(mcpServer, {
      sessionIdGenerator: () => {
        return `session-${++sessionCounter}`;
      },
    });
    app.use(router.routes());

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
      .set('Accept', 'application/json, text/event-stream');

    expect(response.status).not.toBe(404);
  });

  test('should support stateful mode with sessionIdGenerator and apiBaseUrl', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());

    let sessionCounter = 0;
    const router = createMcpRouter(mcpServer, {
      sessionIdGenerator: () => {
        return `session-${++sessionCounter}`;
      },
      apiBaseUrl: 'http://localhost:9999/api',
    });
    app.use(router.routes());

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
      .set('Accept', 'application/json, text/event-stream');

    expect(response.status).not.toBe(404);
  });

  test('POST handler returns 500 when internal transport connect throws', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());
    const router = createMcpRouter(mcpServer);
    app.use(router.routes());

    const connectSpy = jest
      .spyOn(mcpServer, 'connect')
      .mockRejectedValueOnce(new Error('Transport connect failed'));

    const response = await request(app.callback())
      .post('/mcp')
      .send({ jsonrpc: '2.0', method: 'initialize', params: {}, id: 1 })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream');

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/Transport connect failed/);

    connectSpy.mockRestore();
  });

  test('DELETE handler returns 500 when internal transport connect throws', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    const router = createMcpRouter(mcpServer);
    app.use(router.routes());

    const connectSpy = jest
      .spyOn(mcpServer, 'connect')
      .mockRejectedValueOnce(new Error('Transport connect failed'));

    const response = await request(app.callback()).delete('/mcp');

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/Transport connect failed/);

    connectSpy.mockRestore();
  });

  test('POST handler returns 500 when getApiHeaders throws', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());
    const router = createMcpRouter(mcpServer, {
      getApiHeaders: () => {
        throw new Error('getApiHeaders failed');
      },
    });
    app.use(router.routes());

    const response = await request(app.callback())
      .post('/mcp')
      .send({ jsonrpc: '2.0', method: 'initialize', params: {}, id: 1 })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream');

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/getApiHeaders failed/);
  });

  test('DELETE handler returns 500 when getApiHeaders throws', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    const router = createMcpRouter(mcpServer, {
      getApiHeaders: () => {
        throw new Error('getApiHeaders failed');
      },
    });
    app.use(router.routes());

    const response = await request(app.callback()).delete('/mcp');

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/getApiHeaders failed/);
  });

  test('POST handler returns 500 when getApiHeaders throws a non-Error', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(bodyParser());
    app.use(
      createMcpRouter(mcpServer, {
        getApiHeaders: () => {
          throw 'a bare string, not an Error';
        },
      }).routes()
    );

    const response = await request(app.callback())
      .post('/mcp')
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 1, params: {} })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  test('DELETE handler returns 500 when getApiHeaders throws a non-Error', async () => {
    const mcpServer = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    const app = new App();
    app.use(
      createMcpRouter(mcpServer, {
        getApiHeaders: () => {
          throw 'a bare string, not an Error';
        },
      }).routes()
    );

    const response = await request(app.callback()).delete('/mcp');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  describe('2026-07-28 protocol revision', () => {
    /**
     * A request speaking the 2026-07-28 revision: the per-request envelope in
     * `params._meta` plus the `Mcp-Method` header the revision requires. Such a
     * request is served by that revision's stateless core rather than the
     * transport that answers 2025-era traffic.
     */
    const modernRequest = (method: string) => {
      return {
        body: {
          jsonrpc: '2.0',
          method,
          id: 1,
          params: {
            _meta: {
              'io.modelcontextprotocol/protocolVersion': '2026-07-28',
              'io.modelcontextprotocol/clientCapabilities': {},
            },
          },
        },
        headers: { 'Mcp-Method': method },
      };
    };

    const buildApp = () => {
      const mcpServer = new McpServer({
        name: 'test-server',
        version: '1.0.0',
      });
      mcpServer.registerTool(
        'test-tool',
        { description: 'A test tool', inputSchema: { param: z.string() } },
        async ({ param }) => {
          return { content: [{ type: 'text', text: param }] };
        }
      );
      const app = new App();
      app.use(bodyParser());
      app.use(createMcpRouter(mcpServer).routes());
      return app;
    };

    test('serves tools/list from the same registered tools', async () => {
      const { body, headers } = modernRequest('tools/list');

      const response = await request(buildApp().callback())
        .post('/mcp')
        .send(body)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json, text/event-stream')
        .set(headers);

      expect(response.status).toBe(200);
      expect(response.body.result.tools).toEqual([
        expect.objectContaining({ name: 'test-tool' }),
      ]);
    });

    test('answers with plain JSON, same as 2025-era traffic', async () => {
      const { body, headers } = modernRequest('tools/list');

      const response = await request(buildApp().callback())
        .post('/mcp')
        .send(body)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json, text/event-stream')
        .set(headers);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('a 2025-era request is still served by the legacy transport', async () => {
      const response = await request(buildApp().callback())
        .post('/mcp')
        .send({ jsonrpc: '2.0', method: 'tools/list', id: 1, params: {} })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json, text/event-stream');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.result.tools).toEqual([
        expect.objectContaining({ name: 'test-tool' }),
      ]);
    });
  });

  describe('aliases', () => {
    test('POST at alias path is handled', async () => {
      const mcpServer = new McpServer({
        name: 'test-server',
        version: '1.0.0',
      });

      const app = new App();
      app.use(bodyParser());

      const router = createMcpRouter(mcpServer, { aliases: ['/'] });
      app.use(router.routes());

      const response = await request(app.callback())
        .post('/')
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
        .set('Accept', 'application/json, text/event-stream');

      expect(response.status).not.toBe(404);
    });

    test('DELETE at alias path is handled', async () => {
      const mcpServer = new McpServer({
        name: 'test-server',
        version: '1.0.0',
      });

      const app = new App();
      const router = createMcpRouter(mcpServer, { aliases: ['/'] });
      app.use(router.routes());

      const response = await request(app.callback()).delete('/');

      expect(response.status).not.toBe(404);
    });

    test('primary path still works when aliases are set', async () => {
      const mcpServer = new McpServer({
        name: 'test-server',
        version: '1.0.0',
      });

      const app = new App();
      app.use(bodyParser());

      const router = createMcpRouter(mcpServer, { aliases: ['/'] });
      app.use(router.routes());

      const response = await request(app.callback())
        .post('/mcp')
        .send({})
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json, text/event-stream');

      expect(response.status).not.toBe(404);
    });

    test('multiple aliases are all registered', async () => {
      const mcpServer = new McpServer({
        name: 'test-server',
        version: '1.0.0',
      });

      const app = new App();
      app.use(bodyParser());

      const router = createMcpRouter(mcpServer, {
        path: '/mcp',
        aliases: ['/', '/v2/mcp'],
      });
      app.use(router.routes());

      const callback = app.callback();

      const res1 = await request(callback)
        .post('/')
        .send({})
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');
      expect(res1.status).not.toBe(404);

      const res2 = await request(callback)
        .post('/v2/mcp')
        .send({})
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');
      expect(res2.status).not.toBe(404);
    });
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
