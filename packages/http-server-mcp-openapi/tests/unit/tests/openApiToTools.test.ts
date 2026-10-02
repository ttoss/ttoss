import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  McpServer,
  registerTools,
} from '@ttoss/http-server-mcp';
import {
  openApiToTools,
  type OpenApiToToolsArgs,
  type ResolvedRequest,
} from 'src/index';
import request from 'supertest';

import { testSpec } from '../fixtures/openApiSpec';

const sendMcpRequest = (
  app: ReturnType<typeof App.prototype.callback>,
  body: Record<string, unknown>
) => {
  return request(app)
    .post('/mcp')
    .send(body)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
};

/** Parse the JSON-RPC result out of an MCP HTTP response (JSON or SSE). */
const parseRpc = (res: request.Response): Record<string, unknown> => {
  if (typeof res.body === 'object' && res.body?.result) return res.body.result;
  const text: string = res.text || '';
  const line = text.split('\n').find((l) => {
    return l.startsWith('data:');
  });
  const json = line ? line.replace(/^data:\s*/, '') : text;
  return JSON.parse(json).result;
};

const buildApp = (calls: ResolvedRequest[]) => {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  const tools = openApiToTools({
    spec: testSpec,
    callApi: (req) => {
      calls.push(req);
      return { ok: true, url: req.url };
    },
  });
  registerTools({ server, tools });
  const app = new App();
  app.use(bodyParser());
  const router = createMcpRouter(server);
  app.use(router.routes());
  app.use(router.allowedMethods());
  return { app: app.callback(), tools };
};

describe('openApiToTools', () => {
  test('returns the registered tool definitions', () => {
    const { tools } = buildApp([]);
    expect(
      tools.map((t) => {
        return t.name;
      })
    ).toContain('create-agent');
  });

  test('lists every derived tool over the MCP wire with its JSON Schema', async () => {
    const { app } = buildApp([]);
    const res = await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    });
    expect(res.status).toBe(200);
    const result = parseRpc(res);
    const list = result.tools as Array<{
      name: string;
      inputSchema: Record<string, unknown>;
    }>;
    const names = list
      .map((t) => {
        return t.name;
      })
      .sort();
    expect(names).toEqual([
      'create-actor',
      'create-agent',
      'delete-agent',
      'get-agent',
      'list-agents',
      'update-agent',
    ]);
    const getAgent = list.find((t) => {
      return t.name === 'get-agent';
    })!;
    // Verbatim JSON Schema (not Zod-derived) is forwarded to clients.
    expect(getAgent.inputSchema.properties).toEqual({
      agentId: { type: 'string', description: '' },
    });
  });

  test('resolves a GET tool call into a method/url and returns the payload', async () => {
    const calls: ResolvedRequest[] = [];
    const { app } = buildApp(calls);
    const res = await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'get-agent', arguments: { agentId: 'agt_1' } },
    });
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/agents/agt_1');
    expect(calls[0].body).toBeUndefined();
    expect(calls[0].tool.operationId).toBe('getAgent');

    const result = parseRpc(res);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(JSON.parse(content[0].text)).toEqual({
      ok: true,
      url: '/agents/agt_1',
    });
  });

  test('resolves a POST tool call into a snake_case body', async () => {
    const calls: ResolvedRequest[] = [];
    const { app } = buildApp(calls);
    await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create-agent',
        arguments: { name: 'Alpha', skillIds: ['s1'] },
      },
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('/agents');
    expect(calls[0].body).toEqual({ name: 'Alpha', skill_ids: ['s1'] });
  });

  test('builds a query string for a list tool call', async () => {
    const calls: ResolvedRequest[] = [];
    const { app } = buildApp(calls);
    await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list-agents',
        arguments: { projectId: 'prj_1', tags: ['x'] },
      },
    });
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('/agents?tags=x&project_id=prj_1');
  });

  test('custom toText controls the text payload; string data passes through', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec: testSpec,
        callApi: () => {
          return 'raw-string';
        },
        toText: (data) => {
          return `wrapped:${String(data)}`;
        },
      }),
    });
    const app = new App();
    app.use(bodyParser());
    const router = createMcpRouter(server);
    app.use(router.routes());
    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'get-agent', arguments: { agentId: 'a' } },
    });
    const result = parseRpc(res);
    const content = result.content as Array<{ text: string }>;
    expect(content[0].text).toBe('wrapped:raw-string');
  });

  test('default toText returns a string payload verbatim', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec: testSpec,
        callApi: () => {
          return 'plain';
        },
      }),
    });
    const app = new App();
    app.use(bodyParser());
    const router = createMcpRouter(server);
    app.use(router.routes());
    const res = await sendMcpRequest(app.callback(), {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'get-agent', arguments: { agentId: 'a' } },
    });
    const result = parseRpc(res);
    const content = result.content as Array<{ text: string }>;
    expect(content[0].text).toBe('plain');
  });

  const buildAppWith = (args: Partial<OpenApiToToolsArgs>) => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec: testSpec,
        callApi: () => {
          return { id: 'agt_1' };
        },
        ...args,
      }),
    });
    const app = new App();
    app.use(bodyParser());
    const router = createMcpRouter(server);
    app.use(router.routes());
    return app.callback();
  };

  const listTools = async (app: ReturnType<typeof App.prototype.callback>) => {
    const res = await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/list',
      params: {},
    });
    return parseRpc(res).tools as Array<{
      name: string;
      _meta?: Record<string, unknown>;
    }>;
  };

  const callGetAgent = async (
    app: ReturnType<typeof App.prototype.callback>
  ) => {
    const res = await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'get-agent', arguments: { agentId: 'agt_1' } },
    });
    return parseRpc(res);
  };

  test('toolMeta sets _meta on the tools it returns a bag for', async () => {
    const seen: string[] = [];
    const app = buildAppWith({
      toolMeta: ({ tool }) => {
        seen.push(tool.operationId);
        return tool.name === 'get-agent'
          ? { ui: { resourceUri: 'ui://agents/card' } }
          : undefined;
      },
    });
    const tools = await listTools(app);
    const byName = Object.fromEntries(
      tools.map((t) => {
        return [t.name, t._meta];
      })
    );
    expect(byName['get-agent']).toEqual({
      ui: { resourceUri: 'ui://agents/card' },
    });
    expect(byName['list-agents']).toBeUndefined();
    expect(seen).toContain('getAgent');
  });

  test('tools carry no _meta without toolMeta', async () => {
    const tools = await listTools(buildAppWith({}));
    for (const tool of tools) {
      expect(tool._meta).toBeUndefined();
    }
  });

  test('toStructuredContent adds structuredContent beside the text payload', async () => {
    const seen: Array<{ data: unknown; operationId: string }> = [];
    const result = await callGetAgent(
      buildAppWith({
        toStructuredContent: ({ data, tool }) => {
          seen.push({ data, operationId: tool.operationId });
          return { agent: data };
        },
      })
    );
    expect(result.structuredContent).toEqual({ agent: { id: 'agt_1' } });
    const content = result.content as Array<{ text: string }>;
    expect(JSON.parse(content[0].text)).toEqual({ id: 'agt_1' });
    expect(seen).toEqual([{ data: { id: 'agt_1' }, operationId: 'getAgent' }]);
  });

  test('toStructuredContent returning undefined leaves the result text-only', async () => {
    const result = await callGetAgent(
      buildAppWith({
        toStructuredContent: () => {
          return undefined;
        },
      })
    );
    expect(result).not.toHaveProperty('structuredContent');
  });

  test('results carry no structuredContent without toStructuredContent', async () => {
    const result = await callGetAgent(buildAppWith({}));
    expect(result).not.toHaveProperty('structuredContent');
  });
});

const taggedSpec = {
  paths: {
    '/agents/{agent_id}': {
      get: {
        operationId: 'getAgent',
        description: 'Get an agent.',
        tags: ['agents', 42],
        parameters: [
          {
            name: 'agent_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      },
    },
    '/projects': {
      get: { operationId: 'listProjects', tags: ['projects'] },
    },
    '/health': {
      get: { operationId: 'getHealth', description: 'Check health.' },
    },
  },
} as unknown as OpenApiToToolsArgs['spec'];

describe('openApiToTools tool fields', () => {
  const tools = openApiToTools({
    spec: taggedSpec,
    callApi: () => {
      return {};
    },
  });
  const byName = (name: string) => {
    return tools.find((tool) => {
      return tool.name === name;
    })!;
  };

  test("copies the operation's string tags", () => {
    expect(byName('get-agent').tags).toEqual(['agents']);
    expect(byName('get-agent').definition.tags).toEqual(['agents']);
    expect(byName('get-health')).not.toHaveProperty('tags');
    expect(byName('get-health').definition.tags).toEqual([]);
  });

  test('summarises each tool with its route and description', () => {
    expect(byName('get-agent').summary).toBe(
      'GET /agents/{agent_id} — Get an agent.'
    );
    expect(byName('list-projects').summary).toBe('GET /projects');
  });

  test('carries the definition it was derived from', () => {
    expect(byName('get-agent').definition).toMatchObject({
      method: 'GET',
      pathTemplate: '/agents/{agent_id}',
      operationId: 'getAgent',
    });
  });

  test('sets validateArguments on every tool, off by default', () => {
    expect(byName('get-agent').validateArguments).toBe(false);
    const strict = openApiToTools({
      spec: taggedSpec,
      validateArguments: true,
      callApi: () => {
        return {};
      },
    });
    expect(
      strict.every((tool) => {
        return tool.validateArguments === true;
      })
    ).toBe(true);
  });
});

describe('openApiToTools deferred', () => {
  const buildDeferred = (calls: ResolvedRequest[]) => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec: taggedSpec,
        validateArguments: true,
        callApi: (req) => {
          calls.push(req);
          return { id: 'agt_1' };
        },
      }),
      defer: true,
    });
    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());
    return app.callback();
  };

  const callDeferred = async ({
    app,
    name,
    args,
  }: {
    app: ReturnType<typeof buildDeferred>;
    name: string;
    args: Record<string, unknown>;
  }) => {
    const res = await sendMcpRequest(app, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    });
    return parseRpc(res) as {
      isError?: boolean;
      content: Array<{ text: string }>;
      structuredContent?: Record<string, unknown>;
    };
  };

  test('search finds an operation by tag and shows its route', async () => {
    const app = buildDeferred([]);

    const result = await callDeferred({
      app,
      name: 'search',
      args: { query: '', tag: 'agents' },
    });

    expect(result.structuredContent).toEqual({
      tools: [
        {
          name: 'get-agent',
          summary: 'GET /agents/{agent_id} — Get an agent.',
          tags: ['agents'],
        },
      ],
    });
  });

  test('call builds the same request the direct tool would', async () => {
    const calls: ResolvedRequest[] = [];
    const app = buildDeferred(calls);

    const result = await callDeferred({
      app,
      name: 'call',
      args: { name: 'get-agent', arguments: { agentId: 'agt_1' } },
    });

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({ id: 'agt_1' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/agents/agt_1' });
  });

  test('call refuses a missing path argument without validateArguments', async () => {
    const calls: ResolvedRequest[] = [];
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec: taggedSpec,
        callApi: (req) => {
          calls.push(req);
          return {};
        },
      }),
      defer: true,
    });
    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    const result = await callDeferred({
      app: app.callback(),
      name: 'call',
      args: { name: 'get-agent', arguments: {} },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Missing required argument "agentId".');
    expect(calls).toEqual([]);
  });

  test('call suggests no tool that only a prefix in its description matches', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec: {
          paths: {
            '/auth/code': {
              post: {
                operationId: 'requestSignInCode',
                description: 'Does not reveal account existence.',
              },
            },
          },
        },
        callApi: () => {
          return {};
        },
      }),
      defer: true,
    });
    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    const result = await callDeferred({
      app: app.callback(),
      name: 'call',
      args: { name: 'nao-existe' },
    });

    expect(result.structuredContent?.suggestions).toEqual([]);
  });

  test('call rejects arguments the generated schema does not accept', async () => {
    const calls: ResolvedRequest[] = [];
    const app = buildDeferred(calls);

    const result = await callDeferred({
      app,
      name: 'call',
      args: { name: 'get-agent', arguments: {} },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent?.inputSchema).toMatchObject({
      required: ['agentId'],
    });
    expect(calls).toHaveLength(0);
  });
});
