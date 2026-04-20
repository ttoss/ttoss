import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  McpServer,
  registerToolFromSchema,
  z,
} from 'src/index';
import request from 'supertest';

/**
 * Helper: Send an MCP JSON-RPC request and return the parsed response body.
 */
const sendMcpRequest = async (
  app: ReturnType<typeof App.prototype.callback>,
  body: Record<string, unknown>
) => {
  const res = await request(app)
    .post('/mcp')
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
  return res;
};

describe('registerToolFromSchema', () => {
  test('should be exported from the package', () => {
    expect(typeof registerToolFromSchema).toBe('function');
  });

  test('should register a tool with a plain JSON Schema without throwing', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    expect(() => {
      registerToolFromSchema(server, {
        name: 'get-project',
        description: 'Get a project by ID',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string', description: 'Project ID' } },
          required: ['id'],
        },
        handler: async ({ id }) => {
          return {
            content: [{ type: 'text', text: String(id) }],
          };
        },
      });
    }).not.toThrow();
  });

  test('should register a tool with no inputSchema (defaults to empty object schema)', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    expect(() => {
      registerToolFromSchema(server, {
        name: 'list-items',
        description: 'List all items',
        handler: async () => {
          return {
            content: [{ type: 'text', text: '[]' }],
          };
        },
      });
    }).not.toThrow();
  });

  test('should register multiple tools on the same server', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    expect(() => {
      registerToolFromSchema(server, {
        name: 'tool-a',
        handler: async () => {
          return { content: [{ type: 'text', text: 'a' }] };
        },
      });

      registerToolFromSchema(server, {
        name: 'tool-b',
        handler: async () => {
          return { content: [{ type: 'text', text: 'b' }] };
        },
      });
    }).not.toThrow();
  });

  test('tools/list should expose the verbatim JSON Schema, not the Zod-derived one', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    const rawSchema = {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Project public ID' },
        filter: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      },
      required: ['id'],
    };

    registerToolFromSchema(server, {
      name: 'get-project',
      description: 'Get a project',
      inputSchema: rawSchema,
      handler: async ({ id }) => {
        return {
          content: [{ type: 'text', text: String(id) }],
        };
      },
    });

    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    });

    expect(res.status).toBe(200);

    const tools: Array<{ name: string; inputSchema: unknown }> =
      res.body?.result?.tools ?? [];

    const tool = tools.find((t) => {
      return t.name === 'get-project';
    });
    expect(tool).toBeDefined();

    // The inputSchema on the wire must be the exact plain JSON Schema we provided,
    // preserving `anyOf` and other features that Zod cannot represent.
    expect(tool!.inputSchema).toEqual(rawSchema);
  });

  test('tools/list should expose empty object schema when no inputSchema provided', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    registerToolFromSchema(server, {
      name: 'list-all',
      description: 'List everything',
      handler: async () => {
        return { content: [{ type: 'text', text: '[]' }] };
      },
    });

    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    });

    const tools: Array<{ name: string; inputSchema: unknown }> =
      res.body?.result?.tools ?? [];

    const tool = tools.find((t) => {
      return t.name === 'list-all';
    });
    expect(tool).toBeDefined();
    expect(tool!.inputSchema).toEqual({ type: 'object', properties: {} });
  });

  test('tools/list should preserve raw schemas for all custom tools alongside normal Zod tools', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    // Normal Zod-based tool
    server.registerTool(
      'zod-tool',
      { description: 'Zod tool', inputSchema: { x: z.number() } },
      async ({ x }) => {
        return { content: [{ type: 'text', text: String(x) }] };
      }
    );

    // Raw JSON Schema tool
    registerToolFromSchema(server, {
      name: 'raw-tool',
      description: 'Raw tool',
      inputSchema: {
        type: 'object',
        properties: { q: { type: 'string' } },
        required: ['q'],
      },
      handler: async ({ q }) => {
        return {
          content: [{ type: 'text', text: String(q) }],
        };
      },
    });

    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    });

    const tools: Array<{ name: string; inputSchema: unknown }> =
      res.body?.result?.tools ?? [];

    const zodTool = tools.find((t) => {
      return t.name === 'zod-tool';
    });
    const rawTool = tools.find((t) => {
      return t.name === 'raw-tool';
    });

    expect(zodTool).toBeDefined();
    expect(rawTool).toBeDefined();

    // Raw tool should have our verbatim schema
    expect(rawTool!.inputSchema).toEqual({
      type: 'object',
      properties: { q: { type: 'string' } },
      required: ['q'],
    });

    // Zod tool should still have a schema derived from Zod
    expect(zodTool!.inputSchema).toMatchObject({ type: 'object' });
  });

  test('tools/call should invoke the handler and return its result', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    registerToolFromSchema(server, {
      name: 'greet',
      description: 'Greet someone',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      handler: async ({ name }) => {
        return {
          content: [{ type: 'text', text: `Hello, ${name}!` }],
        };
      },
    });

    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'greet', arguments: { name: 'World' } },
    });

    expect(res.status).toBe(200);

    const content = res.body?.result?.content ?? [];
    expect(content).toContainEqual({ type: 'text', text: 'Hello, World!' });
  });

  test('tools/call should pass all args including complex nested objects', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    const capturedArgs: Record<string, unknown>[] = [];

    registerToolFromSchema(server, {
      name: 'complex',
      description: 'Complex args',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          options: {
            type: 'object',
            properties: { limit: { type: 'number' } },
          },
        },
      },
      handler: async (args) => {
        capturedArgs.push(args);
        return { content: [{ type: 'text', text: 'ok' }] };
      },
    });

    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'complex',
        arguments: { id: 'abc', options: { limit: 10 } },
      },
    });

    expect(capturedArgs).toHaveLength(1);
    expect(capturedArgs[0]).toEqual({ id: 'abc', options: { limit: 10 } });
  });

  test('works together with createMcpRouter', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    registerToolFromSchema(server, {
      name: 'ping',
      handler: async () => {
        return { content: [{ type: 'text', text: 'pong' }] };
      },
    });

    const router = createMcpRouter(server);
    expect(router).toBeDefined();
    expect(typeof router.routes).toBe('function');
  });

  test('emits a dev-time warning when the tools/list handler cannot be patched', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      // Use a fresh server and delete the tools/list handler after the SDK installs
      // it (via a normal registerTool call), to simulate the "origHandler undefined"
      // branch inside registerToolFromSchema's patching logic.
      const server = new McpServer({ name: 'server-warn', version: '1.0.0' });

      server.registerTool(
        'seed',
        { description: 'seed', inputSchema: { x: z.string() } },
        async ({ x }) => {
          return { content: [{ type: 'text', text: x }] };
        }
      );

      // Remove the tools/list handler so origHandler will be undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (server as any).server?._requestHandlers?.delete('tools/list');

      registerToolFromSchema(server, {
        name: 'my-tool',
        handler: async () => {
          return { content: [{ type: 'text', text: 'hi' }] };
        },
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not patch tools/list')
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      warnSpy.mockRestore();
    }
  });
});
