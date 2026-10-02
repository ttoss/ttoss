import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  type DeferToolsOptions,
  McpServer,
  rankTools,
  registerTools,
  type Tool,
  z,
} from 'src/index';
import request from 'supertest';

type CallResult = {
  isError?: boolean;
  content: Array<{ type: string; text: string }>;
  structuredContent?: Record<string, unknown>;
};

const textResult = (text: string) => {
  return { content: [{ type: 'text' as const, text }] };
};

const tool = (overrides: Partial<Tool> & { name: string }): Tool => {
  return {
    description: `The ${overrides.name} tool.`,
    handler: async (args) => {
      return textResult(JSON.stringify({ tool: overrides.name, args }));
    },
    ...overrides,
  };
};

const TOOLS: Tool[] = [
  tool({
    name: 'list-agents',
    description: 'List the agents of a project.',
    tags: ['agents'],
  }),
  tool({
    name: 'create-agent',
    description: 'Create an agent.',
    tags: ['agents'],
    inputSchema: z.object({ name: z.string() }),
  }),
  tool({
    name: 'get-project',
    title: 'Get Project',
    description: 'Get a project by id.\nSecond line of detail.',
    tags: ['projects'],
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  }),
  tool({
    name: 'delete-memory',
    description: 'Delete a memory from an agent.',
    summary: 'DELETE /memories/{memory_id}',
  }),
];

const buildApp = ({
  tools = TOOLS,
  defer = true,
}: {
  tools?: Tool[];
  defer?: boolean | DeferToolsOptions;
} = {}) => {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  registerTools({ server, tools, defer });
  const app = new App();
  app.use(bodyParser());
  app.use(createMcpRouter(server).routes());
  return app.callback();
};

const rpc = async (
  app: ReturnType<typeof buildApp>,
  method: string,
  params: Record<string, unknown> = {}
) => {
  const res = await request(app)
    .post('/mcp')
    .send({ jsonrpc: '2.0', id: 1, method, params })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream');
  return res.body.result;
};

const callTool = async ({
  app,
  name,
  args,
}: {
  app: ReturnType<typeof buildApp>;
  name: string;
  args: Record<string, unknown>;
}): Promise<CallResult> => {
  return rpc(app, 'tools/call', { name, arguments: args });
};

const listedNames = async (app: ReturnType<typeof buildApp>) => {
  const { tools } = await rpc(app, 'tools/list');
  return (tools as Array<{ name: string }>).map((listed) => {
    return listed.name;
  });
};

const search = async ({
  app = buildApp(),
  ...args
}: {
  app?: ReturnType<typeof buildApp>;
  query: string;
  tag?: string;
  limit?: number;
}) => {
  const result = await callTool({ app, name: 'search', args });
  return result.structuredContent?.tools as Array<{
    name: string;
    summary: string;
    tags?: string[];
  }>;
};

const namesOf = (tools: Array<{ name: string }>) => {
  return tools.map((listed) => {
    return listed.name;
  });
};

describe('registerTools defer', () => {
  describe('tools/list', () => {
    test('exposes only search, describe and call', async () => {
      expect(await listedNames(buildApp())).toEqual([
        'search',
        'describe',
        'call',
      ]);
    });

    test('also registers tools linked to an MCP Apps view by default', async () => {
      const app = buildApp({
        tools: [
          ...TOOLS,
          tool({
            name: 'show-dashboard',
            _meta: { ui: { resourceUri: 'ui://app/dashboard' } },
          }),
          tool({
            name: 'show-legacy',
            _meta: { 'ui/resourceUri': 'ui://app/legacy' },
          }),
          tool({
            name: 'with-other-meta',
            _meta: { ui: { prefersBorder: 1 } },
          }),
        ],
      });

      expect(await listedNames(app)).toEqual([
        'search',
        'describe',
        'call',
        'show-dashboard',
        'show-legacy',
      ]);
    });

    test('`except` keeps tools standalone, still reachable through search', async () => {
      const app = buildApp({
        defer: {
          except: ({ tool: candidate }) => {
            return candidate.name === 'get-project';
          },
        },
      });

      expect(await listedNames(app)).toEqual([
        'search',
        'describe',
        'call',
        'get-project',
      ]);
      expect(namesOf(await search({ app, query: 'project' }))).toEqual([
        'get-project',
        'list-agents',
      ]);
    });

    test('`names` renames search, describe and call', async () => {
      const app = buildApp({
        defer: {
          names: { search: 'find', describe: 'explain', call: 'run' },
        },
      });

      expect(await listedNames(app)).toEqual(['find', 'explain', 'run']);
      const { tools } = await rpc(app, 'tools/list');
      expect(tools[0].description).toContain('"explain"');
      expect(tools[0].description).toContain('"run"');
    });

    test('the search description counts the tools and lists their tags', async () => {
      const { tools } = await rpc(buildApp(), 'tools/list');

      expect(tools[0].description).toContain('among the 4 this server');
      expect(tools[0].description).toContain('Tags: agents, projects.');
      expect(tools[0].inputSchema.properties.tag.enum).toEqual([
        'agents',
        'projects',
      ]);
    });

    test('without tags, the search description and schema name none', async () => {
      const { tools } = await rpc(
        buildApp({ tools: [tool({ name: 'ping' })] }),
        'tools/list'
      );

      expect(tools[0].description).not.toContain('Tags:');
      expect(tools[0].inputSchema.properties.tag).not.toHaveProperty('enum');
    });

    test('rejects two tools with the same name', () => {
      expect(() => {
        buildApp({ tools: [tool({ name: 'a' }), tool({ name: 'a' })] });
      }).toThrow('Two tools are named "a".');
    });
  });

  describe('search', () => {
    test('ranks a name match above a description match', async () => {
      expect(namesOf(await search({ query: 'agent' }))).toEqual([
        'list-agents',
        'create-agent',
        'delete-memory',
      ]);
    });

    test('scores every query term, so the best overall match comes first', async () => {
      expect(namesOf(await search({ query: 'create agents' }))[0]).toBe(
        'create-agent'
      );
    });

    test('matches a prefix of a word', async () => {
      expect(namesOf(await search({ query: 'proj' }))).toEqual([
        'get-project',
        'list-agents',
      ]);
    });

    test('matches the explicit summary', async () => {
      expect(namesOf(await search({ query: 'memories' }))).toEqual([
        'delete-memory',
      ]);
    });

    test('filters by tag', async () => {
      expect(namesOf(await search({ query: 'agent', tag: 'agents' }))).toEqual([
        'list-agents',
        'create-agent',
      ]);
    });

    test('an empty query lists the tools in order, up to the limit', async () => {
      expect(namesOf(await search({ query: '', limit: 2 }))).toEqual([
        'list-agents',
        'create-agent',
      ]);
    });

    test('defaults to `searchLimit` results', async () => {
      const app = buildApp({ defer: { searchLimit: 1 } });

      expect(namesOf(await search({ app, query: 'agent' }))).toEqual([
        'list-agents',
      ]);
    });

    test('returns the name, a one-line summary and the tags', async () => {
      const results = await search({ query: 'project' });

      expect(results[0]).toEqual({
        name: 'get-project',
        summary: 'Get a project by id.',
        tags: ['projects'],
      });
      expect(
        results.find((result) => {
          return result.name === 'delete-memory';
        })
      ).toBeUndefined();
      expect(await search({ query: 'memory' })).toEqual([
        { name: 'delete-memory', summary: 'DELETE /memories/{memory_id}' },
      ]);
    });

    test('cuts a long summary', async () => {
      const app = buildApp({
        tools: [tool({ name: 'long', description: 'word '.repeat(100) })],
      });

      const [result] = await search({ app, query: 'long' });

      expect(result.summary).toHaveLength(160);
      expect(result.summary.endsWith('…')).toBe(true);
    });

    test('rejects a limit above 50', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'search',
        args: { query: '', limit: 51 },
      });

      expect(result.isError).toBe(true);
    });

    test('`searchMaxLimit` sets the ceiling', async () => {
      const app = buildApp({ defer: { searchMaxLimit: 2 } });

      expect(namesOf(await search({ app, query: '', limit: 2 }))).toHaveLength(
        2
      );
      expect(
        (await callTool({ app, name: 'search', args: { query: '', limit: 3 } }))
          .isError
      ).toBe(true);
    });

    test('a higher `searchLimit` raises the default ceiling', async () => {
      const app = buildApp({ defer: { searchLimit: 80 } });

      expect(
        (
          await callTool({
            app,
            name: 'search',
            args: { query: '', limit: 80 },
          })
        ).isError
      ).toBeUndefined();
    });

    test('rejects a call without a query', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'search',
        args: {},
      });

      expect(result.isError).toBe(true);
    });

    test('a custom `search` replaces the ranking and is cut to the limit', async () => {
      const custom = jest.fn(({ tools }: { tools: Tool[] }) => {
        return [...tools].reverse();
      });
      const app = buildApp({ defer: { search: custom } });

      const results = await search({ app, query: 'anything', limit: 2 });

      expect(namesOf(results)).toEqual(['delete-memory', 'get-project']);
      expect(custom).toHaveBeenCalledWith({
        query: 'anything',
        tag: undefined,
        limit: 2,
        tools: TOOLS,
      });
    });
  });

  describe('describe', () => {
    test("returns each tool's definition with its input schema", async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'describe',
        args: { names: ['get-project', 'create-agent'] },
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent).toEqual({
        tools: [
          {
            name: 'get-project',
            title: 'Get Project',
            description: 'Get a project by id.\nSecond line of detail.',
            annotations: { readOnlyHint: true },
            inputSchema: {
              type: 'object',
              properties: { projectId: { type: 'string' } },
              required: ['projectId'],
            },
          },
          {
            name: 'create-agent',
            description: 'Create an agent.',
            inputSchema: expect.objectContaining({
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            }),
          },
        ],
      });
      expect(JSON.parse(result.content[0].text)).toEqual(
        JSON.parse(JSON.stringify(result.structuredContent))
      );
    });

    test('defaults a tool without inputSchema to an empty object schema', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'describe',
        args: { names: ['list-agents'] },
      });

      expect(result.structuredContent?.tools).toEqual([
        expect.objectContaining({
          inputSchema: { type: 'object', properties: {} },
        }),
      ]);
    });

    test('answers unknown names with the closest names', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'describe',
        args: { names: ['get-project', 'create-agents'] },
      });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent?.unknown).toEqual([
        {
          name: 'create-agents',
          suggestions: ['create-agent', 'list-agents', 'delete-memory'],
        },
      ]);
    });

    test('is an error when no name is known', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'describe',
        args: { names: ['nothing-like-it'] },
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent?.tools).toEqual([]);
    });
  });

  describe('call', () => {
    test('answers exactly what the tool answers', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'call',
        args: { name: 'get-project', arguments: { projectId: 'p1' } },
      });

      expect(result).toEqual(
        textResult(
          JSON.stringify({ tool: 'get-project', args: { projectId: 'p1' } })
        )
      );
    });

    test('defaults the arguments to an empty object', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'call',
        args: { name: 'list-agents' },
      });

      expect(JSON.parse(result.content[0].text).args).toEqual({});
    });

    test('answers an unknown name with suggestions', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'call',
        args: { name: 'get-projects' },
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toEqual({
        error: 'Unknown tool "get-projects".',
        // The near-miss first, then a tool whose description mentions projects.
        suggestions: ['get-project', 'list-agents'],
      });
    });

    test('validates against a Standard Schema and answers the issues with the schema', async () => {
      const result = await callTool({
        app: buildApp(),
        name: 'call',
        args: { name: 'create-agent', arguments: { name: 42 } },
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toEqual({
        error: 'Invalid arguments for "create-agent".',
        issues: [expect.stringMatching(/^name: /)],
        inputSchema: expect.objectContaining({ required: ['name'] }),
      });
    });

    test('formats the issue paths of any Standard Schema', async () => {
      const inputSchema = {
        '~standard': {
          version: 1 as const,
          vendor: 'custom',
          jsonSchema: {
            input: () => {
              return { type: 'object' };
            },
            output: () => {
              return { type: 'object' };
            },
          },
          validate: () => {
            return {
              issues: [{ message: 'Required', path: [{ key: 'items' }, 0] }],
            };
          },
        },
      };
      const app = buildApp({ tools: [tool({ name: 'custom', inputSchema })] });

      const result = await callTool({
        app,
        name: 'call',
        args: { name: 'custom', arguments: {} },
      });

      expect(result.structuredContent?.issues).toEqual(['items.0: Required']);
    });

    test('hands a Standard Schema tool its parsed output', async () => {
      const handler = jest.fn().mockResolvedValue(textResult('ok'));
      const app = buildApp({
        tools: [
          tool({
            name: 'paged',
            inputSchema: z.object({ limit: z.number().default(10) }),
            handler,
          }),
        ],
      });

      await callTool({ app, name: 'call', args: { name: 'paged' } });

      expect(handler).toHaveBeenCalledWith({ limit: 10 });
    });

    test('leaves a JSON Schema unenforced unless the tool validates arguments', async () => {
      const schema = {
        type: 'object' as const,
        properties: { id: { type: 'string' } },
        required: ['id'],
      };
      const app = buildApp({
        tools: [
          tool({ name: 'loose', inputSchema: schema }),
          tool({
            name: 'strict',
            inputSchema: schema,
            validateArguments: true,
          }),
        ],
      });

      const loose = await callTool({
        app,
        name: 'call',
        args: { name: 'loose', arguments: { id: 1 } },
      });
      const strict = await callTool({
        app,
        name: 'call',
        args: { name: 'strict', arguments: { id: 1 } },
      });

      expect(loose.isError).toBeUndefined();
      expect(strict.isError).toBe(true);
      expect(strict.structuredContent?.issues).toEqual([expect.any(String)]);
    });

    test("appends the schema to the tool's own error result", async () => {
      const app = buildApp({
        tools: [
          tool({
            name: 'refuses',
            handler: async () => {
              return { ...textResult('Bad request'), isError: true };
            },
          }),
        ],
      });

      const result = await callTool({
        app,
        name: 'call',
        args: { name: 'refuses', arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content).toEqual([
        { type: 'text', text: 'Bad request' },
        {
          type: 'text',
          text: JSON.stringify({
            inputSchema: { type: 'object', properties: {} },
          }),
        },
      ]);
    });

    test('turns a thrown error into an error result with the schema', async () => {
      const app = buildApp({
        tools: [
          tool({
            name: 'throws',
            handler: async () => {
              throw new Error('API is down');
            },
          }),
          tool({
            name: 'throws-value',
            handler: async () => {
              throw 'plain failure';
            },
          }),
        ],
      });

      const result = await callTool({
        app,
        name: 'call',
        args: { name: 'throws', arguments: {} },
      });
      const value = await callTool({
        app,
        name: 'call',
        args: { name: 'throws-value', arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]).toEqual({ type: 'text', text: 'API is down' });
      expect(JSON.parse(result.content[1].text)).toHaveProperty('inputSchema');
      expect(value.content[0].text).toBe('plain failure');
    });
  });

  describe('visible', () => {
    const app = () => {
      return buildApp({
        defer: {
          visible: ({ tool: candidate }) => {
            return !candidate.name.startsWith('delete-');
          },
        },
      });
    };

    test('hides a tool from search', async () => {
      expect(namesOf(await search({ app: app(), query: 'agent' }))).toEqual([
        'list-agents',
        'create-agent',
      ]);
    });

    test('answers a hidden tool as unknown in describe and call', async () => {
      const described = await callTool({
        app: app(),
        name: 'describe',
        args: { names: ['delete-memory'] },
      });
      const called = await callTool({
        app: app(),
        name: 'call',
        args: { name: 'delete-memory' },
      });

      expect(described.isError).toBe(true);
      expect(called.isError).toBe(true);
      expect(called.structuredContent?.error).toBe(
        'Unknown tool "delete-memory".'
      );
    });

    test('lets a visible tool run', async () => {
      const result = await callTool({
        app: app(),
        name: 'call',
        args: { name: 'list-agents' },
      });

      expect(result.isError).toBeUndefined();
    });
  });
});

describe('rankTools', () => {
  const rank = (query: string, tools: Tool[]) => {
    return namesOf(rankTools({ query, limit: 10, tools }));
  };

  test('folds -ies plurals and leaves -ss words alone', () => {
    const tools = [tool({ name: 'list-policy' }), tool({ name: 'get-access' })];

    expect(rank('policies', tools)).toEqual(['list-policy']);
    expect(rank('access', tools)).toEqual(['get-access']);
  });

  test('splits camelCase and keeps non-ASCII letters', () => {
    const tools = [
      tool({ name: 'getAgentVersion', description: 'Versão do agente.' }),
    ];

    expect(rank('version', tools)).toEqual(['getAgentVersion']);
    expect(rank('versão', tools)).toEqual(['getAgentVersion']);
  });

  test('breaks ties by the order of the tools', () => {
    const tools = [tool({ name: 'b-item' }), tool({ name: 'a-item' })];

    expect(rank('item', tools)).toEqual(['b-item', 'a-item']);
  });

  test('suggests the nearest names first', async () => {
    const app = buildApp({
      tools: [
        tool({ name: 'get-agents' }),
        tool({ name: 'get-agent' }),
        tool({ name: 'unrelated' }),
      ],
    });

    const result = await callTool({
      app,
      name: 'call',
      args: { name: 'get-agen' },
    });

    expect(result.structuredContent?.suggestions).toEqual([
      'get-agent',
      'get-agents',
    ]);
  });

  test('suggests no tool that only a prefix in its description matches', async () => {
    const app = buildApp({
      tools: [
        tool({
          name: 'request-sign-in-code',
          description: 'Does not reveal account existence.',
        }),
      ],
    });

    const result = await callTool({
      app,
      name: 'call',
      args: { name: 'nao-existe' },
    });

    expect(result.structuredContent?.suggestions).toEqual([]);
  });

  test('suggests nothing for a name without words', async () => {
    const result = await callTool({
      app: buildApp(),
      name: 'call',
      args: { name: '???' },
    });

    expect(result.structuredContent?.suggestions).toEqual([]);
  });

  test('ignores a prefix shorter than three letters', () => {
    expect(rank('pr', [tool({ name: 'get-project' })])).toEqual([]);
  });
});
