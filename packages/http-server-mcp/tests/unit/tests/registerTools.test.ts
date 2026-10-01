import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  McpServer,
  registerTools,
  type Tool,
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
  return request(app)
    .post('/mcp')
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
};

describe('registerTools', () => {
  test('should be exported from the package', () => {
    expect(typeof registerTools).toBe('function');
  });

  test('should register a tool with a plain JSON Schema without throwing', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    expect(() => {
      registerTools({
        server,
        tools: [
          {
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
          },
        ],
      });
    }).not.toThrow();
  });

  test('should register a tool with no inputSchema (defaults to empty object schema)', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    expect(() => {
      registerTools({
        server,
        tools: [
          {
            name: 'list-items',
            description: 'List all items',
            handler: async () => {
              return {
                content: [{ type: 'text', text: '[]' }],
              };
            },
          },
        ],
      });
    }).not.toThrow();
  });

  test('should register multiple tools on the same server', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    expect(() => {
      registerTools({
        server,
        tools: [
          {
            name: 'tool-a',
            description: 'tool-a',
            handler: async () => {
              return { content: [{ type: 'text', text: 'a' }] };
            },
          },
        ],
      });

      registerTools({
        server,
        tools: [
          {
            name: 'tool-b',
            description: 'tool-b',
            handler: async () => {
              return { content: [{ type: 'text', text: 'b' }] };
            },
          },
        ],
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

    registerTools({
      server,
      tools: [
        {
          name: 'get-project',
          description: 'Get a project',
          inputSchema: rawSchema,
          handler: async ({ id }) => {
            return {
              content: [{ type: 'text', text: String(id) }],
            };
          },
        },
      ],
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
      res.body.result?.tools ?? [];

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

    registerTools({
      server,
      tools: [
        {
          name: 'list-all',
          description: 'List everything',
          handler: async () => {
            return { content: [{ type: 'text', text: '[]' }] };
          },
        },
      ],
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
      res.body.result?.tools ?? [];

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
    registerTools({
      server,
      tools: [
        {
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
        },
      ],
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
      res.body.result?.tools ?? [];

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

    registerTools({
      server,
      tools: [
        {
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
        },
      ],
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

    const content = res.body.result?.content ?? [];
    expect(content).toContainEqual({ type: 'text', text: 'Hello, World!' });
  });

  test('tools/call should pass all args including complex nested objects', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    const capturedArgs: Record<string, unknown>[] = [];

    registerTools({
      server,
      tools: [
        {
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
        },
      ],
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

  describe('tools/call argument validation', () => {
    const buildApp = (
      inputSchema: Record<string, unknown>,
      validateArguments?: boolean
    ) => {
      const server = new McpServer({ name: 'test', version: '1.0.0' });
      registerTools({
        server,
        tools: [
          {
            name: 'validated',
            description: 'Validated tool',
            inputSchema: inputSchema as never,
            validateArguments,
            handler: async (args) => {
              return {
                content: [{ type: 'text', text: JSON.stringify(args) }],
              };
            },
          },
        ],
      });
      const app = new App();
      app.use(bodyParser());
      app.use(createMcpRouter(server).routes());
      return app.callback();
    };

    const callWith = (
      app: ReturnType<typeof App.prototype.callback>,
      args: Record<string, unknown>
    ) => {
      return sendMcpRequest(app, {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'validated', arguments: args },
      });
    };

    const stringSchema = {
      type: 'object',
      properties: { value: { type: 'string' } },
    };

    describe('by default (validateArguments omitted)', () => {
      // Arguments are forwarded to the handler unchecked, so a schema that
      // describes its input incompletely — the usual shape of one generated
      // from an OpenAPI document — never rejects a call the underlying API
      // would have accepted.

      test('a null reaches the handler even though the schema says string', async () => {
        const res = await callWith(buildApp(stringSchema), { value: null });

        expect(res.body.result?.isError).toBeFalsy();
        expect(res.body.result?.content?.[0]?.text).toBe('{"value":null}');
      });

      test('a value of the wrong type reaches the handler', async () => {
        const res = await callWith(buildApp(stringSchema), { value: 42 });

        expect(res.body.result?.isError).toBeFalsy();
        expect(res.body.result?.content?.[0]?.text).toBe('{"value":42}');
      });

      test('the schema is still advertised verbatim over tools/list', async () => {
        const res = await sendMcpRequest(buildApp(stringSchema), {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        });

        expect(res.body.result?.tools?.[0]?.inputSchema).toEqual(stringSchema);
      });
    });

    describe('with validateArguments: true', () => {
      test('a schema without `nullable` rejects an explicit null for that field', async () => {
        const res = await callWith(buildApp(stringSchema, true), {
          value: null,
        });

        expect(res.body.result?.isError).toBe(true);
        expect(res.body.result?.content?.[0]?.text).toContain(
          'Invalid arguments'
        );
      });

      test('a `[type, "null"]` schema accepts both the declared type and null', async () => {
        const app = buildApp(
          {
            type: 'object',
            properties: { value: { type: ['string', 'null'] } },
          },
          true
        );

        const withValue = await callWith(app, { value: 'hi' });
        expect(withValue.body.result?.isError).toBeFalsy();

        const withNull = await callWith(app, { value: null });
        expect(withNull.body.result?.isError).toBeFalsy();
      });

      test('a value of the wrong type is rejected', async () => {
        const res = await callWith(buildApp(stringSchema, true), { value: 42 });

        expect(res.body.result?.isError).toBe(true);
      });

      test('a property-level oneOf accepts either alternative', async () => {
        const app = buildApp(
          {
            type: 'object',
            properties: {
              toolChoice: {
                oneOf: [
                  { type: 'string', enum: ['auto', 'required'] },
                  {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      name: { type: 'string' },
                    },
                  },
                ],
              },
            },
          },
          true
        );

        const withString = await callWith(app, { toolChoice: 'auto' });
        expect(withString.body.result?.isError).toBeFalsy();

        const withObject = await callWith(app, {
          toolChoice: { type: 'tool', name: 'get_weather' },
        });
        expect(withObject.body.result?.isError).toBeFalsy();
      });

      test('required: undefined is treated the same as omitting required', async () => {
        const app = buildApp(
          {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: undefined,
          },
          true
        );

        const res = await callWith(app, {});

        expect(res.body.result?.isError).toBeFalsy();
      });

      test('a zero-arg schema ({ type: "object" }, no properties) accepts an empty call', async () => {
        const res = await callWith(buildApp({ type: 'object' }, true), {});

        expect(res.body.result?.isError).toBeFalsy();
      });
    });
  });

  test('works together with createMcpRouter', () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    registerTools({
      server,
      tools: [
        {
          name: 'ping',
          description: 'ping',
          handler: async () => {
            return { content: [{ type: 'text', text: 'pong' }] };
          },
        },
      ],
    });

    const router = createMcpRouter(server);
    expect(router).toBeDefined();
    expect(typeof router.routes).toBe('function');
  });
  describe('tool metadata', () => {
    test('forwards _meta verbatim on tools/list', async () => {
      const server = new McpServer({ name: 'test', version: '1.0.0' });
      registerTools({
        server,
        tools: [
          {
            name: 'get-project',
            description: 'Get a project by ID',
            _meta: {
              ui: { resourceUri: 'ui://projects/detail', visibility: ['app'] },
            },
            handler: async () => {
              return { content: [{ type: 'text', text: 'ok' }] };
            },
          },
        ],
      });

      const app = new App();
      app.use(bodyParser());
      app.use(createMcpRouter(server).routes());

      const response = await sendMcpRequest(app.callback(), {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      });

      expect(response.body.result.tools[0]._meta).toEqual({
        ui: { resourceUri: 'ui://projects/detail', visibility: ['app'] },
      });
    });

    test('publishes no _meta when the tool declares none', async () => {
      const server = new McpServer({ name: 'test', version: '1.0.0' });
      registerTools({
        server,
        tools: [
          {
            name: 'get-project',
            description: 'Get a project by ID',
            handler: async () => {
              return { content: [{ type: 'text', text: 'ok' }] };
            },
          },
        ],
      });

      const app = new App();
      app.use(bodyParser());
      app.use(createMcpRouter(server).routes());

      const response = await sendMcpRequest(app.callback(), {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      });

      expect(response.body.result.tools[0]).not.toHaveProperty('_meta');
    });
  });

  describe('Standard Schema input', () => {
    const buildZodApp = (handler: jest.Mock) => {
      const server = new McpServer({ name: 'test', version: '1.0.0' });
      registerTools({
        server,
        tools: [
          {
            name: 'list-items',
            description: 'List items',
            inputSchema: z.object({
              limit: z.number().int().default(10),
            }),
            handler,
          },
        ],
      });
      const app = new App();
      app.use(bodyParser());
      app.use(createMcpRouter(server).routes());
      return app.callback();
    };

    test('advertises the JSON Schema derived from the Zod schema', async () => {
      const app = buildZodApp(jest.fn());
      const res = await sendMcpRequest(app, {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      });

      expect(res.body.result.tools[0].inputSchema).toMatchObject({
        type: 'object',
        properties: { limit: { type: 'integer', default: 10 } },
      });
    });

    test('always enforces it and hands the parsed output to the handler', async () => {
      const handler = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'ok' }],
      });
      const app = buildZodApp(handler);

      const valid = await sendMcpRequest(app, {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'list-items', arguments: {} },
      });
      expect(valid.body.result.isError).toBeFalsy();
      expect(handler).toHaveBeenCalledWith({ limit: 10 });

      const invalid = await sendMcpRequest(app, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'list-items', arguments: { limit: 'ten' } },
      });
      expect(invalid.body.result.isError).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('tool fields on tools/list', () => {
    const listWith = async (tool: Partial<Tool>) => {
      const server = new McpServer({ name: 'test', version: '1.0.0' });
      registerTools({
        server,
        tools: [
          {
            name: 'get-item',
            description: 'Get an item',
            handler: async () => {
              return {
                content: [{ type: 'text', text: '{}' }],
                structuredContent: { id: 1 },
              };
            },
            ...tool,
          },
        ],
      });
      const app = new App();
      app.use(bodyParser());
      app.use(createMcpRouter(server).routes());
      const res = await sendMcpRequest(app.callback(), {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      });
      return res.body.result.tools[0];
    };

    test('forwards title and annotations, never tags or summary', async () => {
      const listed = await listWith({
        title: 'Get Item',
        annotations: { readOnlyHint: true },
        tags: ['items'],
        summary: 'Get one item',
      });

      expect(listed.title).toBe('Get Item');
      expect(listed.annotations).toEqual({ readOnlyHint: true });
      expect(listed).not.toHaveProperty('tags');
      expect(listed).not.toHaveProperty('summary');
    });

    test('advertises a JSON Schema outputSchema verbatim', async () => {
      const outputSchema = {
        type: 'object' as const,
        properties: { id: { type: 'number' } },
      };

      const listed = await listWith({ outputSchema });

      expect(listed.outputSchema).toEqual(outputSchema);
    });

    test('advertises a Zod outputSchema as JSON Schema', async () => {
      const listed = await listWith({
        outputSchema: z.object({ id: z.number() }),
      });

      expect(listed.outputSchema).toMatchObject({
        type: 'object',
        properties: { id: { type: 'number' } },
      });
    });
  });
});
