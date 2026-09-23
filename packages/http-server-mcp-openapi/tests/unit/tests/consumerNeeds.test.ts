import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, McpServer } from '@ttoss/http-server-mcp';
import {
  dereferenceSchema,
  extractBodyProps,
  NO_CONTENT_TEXT,
  type OpenApiSpec,
  openApiToToolDefinitions,
  type OperationSpec,
  registerOpenApiTools,
  type RegisterOpenApiToolsArgs,
  type ResolvedRequest,
  resolveParameter,
  resolveSchema,
} from 'src/index';
import request from 'supertest';

const MCP_ACCEPT = 'application/json, text/event-stream';

const parseRpc = (res: request.Response): Record<string, unknown> => {
  if (typeof res.body === 'object' && res.body?.result) return res.body.result;
  const line = (res.text || '').split('\n').find((l) => {
    return l.startsWith('data:');
  });
  return JSON.parse((line ?? '').replace(/^data:\s*/, '')).result;
};

const buildApp = (
  args: Omit<RegisterOpenApiToolsArgs, 'server'>,
  getApiHeaders?: (ctx: {
    headers: Record<string, unknown>;
  }) => Record<string, string>
) => {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  registerOpenApiTools({ server, ...args });
  const app = new App();
  app.use(bodyParser());
  app.use(createMcpRouter(server, { getApiHeaders }).routes());
  return app.callback();
};

const callTool = async (args: {
  app: ReturnType<typeof buildApp>;
  name: string;
  arguments?: Record<string, unknown>;
  authorization?: string;
}) => {
  const req = request(args.app)
    .post('/mcp')
    .send({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: args.name, arguments: args.arguments ?? {} },
    })
    .set('Content-Type', 'application/json')
    .set('Accept', MCP_ACCEPT);
  if (args.authorization) req.set('Authorization', args.authorization);
  return parseRpc(await req);
};

const itemsSpec: OpenApiSpec = {
  paths: {
    '/projects/{project_id}/items/{item_id}': {
      delete: {
        operationId: 'deleteItem',
        parameters: [
          {
            name: 'project_id',
            in: 'path',
            required: true,
            'x-mcp-server-managed': true,
          },
          { name: 'item_id', in: 'path', required: true },
          {
            name: 'tenant',
            in: 'query',
            'x-mcp-server-managed': true,
          },
          { name: 'dry_run', in: 'query', schema: { type: 'boolean' } },
        ],
      },
      patch: {
        operationId: 'updateItem',
        parameters: [
          { name: 'project_id', in: 'path', required: true },
          { name: 'item_id', in: 'path', required: true },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['expected_version'],
                properties: {
                  expected_version: { type: 'integer' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
  },
};

describe('default toText on an empty body (#1254)', () => {
  test.each([undefined, ''])(
    'answers a non-empty text block when callApi resolves %j',
    async (data) => {
      const app = buildApp({
        spec: itemsSpec,
        callApi: () => {
          return data;
        },
      });
      const result = await callTool({
        app,
        name: 'update-item',
        arguments: { projectId: 'p', itemId: 'i' },
      });
      expect(result.isError).toBeFalsy();
      expect(result.content).toEqual([{ type: 'text', text: NO_CONTENT_TEXT }]);
    }
  );
});

describe('caller headers reach callApi', () => {
  test('passes the getApiHeaders result as request.headers', async () => {
    const calls: ResolvedRequest[] = [];
    const app = buildApp(
      {
        spec: itemsSpec,
        callApi: (req) => {
          calls.push(req);
          return {};
        },
      },
      (ctx) => {
        return { Authorization: String(ctx.headers.authorization) };
      }
    );
    await callTool({
      app,
      name: 'update-item',
      arguments: { projectId: 'p', itemId: 'i' },
      authorization: 'Bearer caller',
    });
    expect(calls[0].headers).toEqual({ Authorization: 'Bearer caller' });
  });

  test('passes an empty object when getApiHeaders is not configured', async () => {
    const calls: ResolvedRequest[] = [];
    const app = buildApp({
      spec: itemsSpec,
      callApi: (req) => {
        calls.push(req);
        return {};
      },
    });
    await callTool({
      app,
      name: 'update-item',
      arguments: { projectId: 'p', itemId: 'i' },
    });
    expect(calls[0].headers).toEqual({});
  });
});

describe('server-managed path and query parameters', () => {
  const [deleteItem] = openApiToToolDefinitions({ spec: itemsSpec });

  test('are removed from the input schema', () => {
    expect(deleteItem.inputSchema).toEqual({
      type: 'object',
      properties: {
        itemId: { type: 'string', description: '' },
        dryRun: { type: 'boolean', description: '' },
      },
      required: ['itemId'],
    });
  });

  test('are listed on the tool definition', () => {
    expect(deleteItem.serverManagedParameters).toEqual([
      { name: 'project_id', in: 'path', argName: 'projectId' },
      { name: 'tenant', in: 'query', argName: 'tenant' },
    ]);
  });

  test('are filled by serverParameters, overriding anything the model sent', async () => {
    const calls: ResolvedRequest[] = [];
    const serverParameters = jest.fn(
      ({ headers }: { headers: Record<string, string> }) => {
        return { project_id: `from-${headers.Authorization}`, tenant: 'acme' };
      }
    );
    const app = buildApp(
      {
        spec: itemsSpec,
        callApi: (req) => {
          calls.push(req);
          return undefined;
        },
        serverParameters,
      },
      (ctx) => {
        return { Authorization: String(ctx.headers.authorization) };
      }
    );
    await callTool({
      app,
      name: 'delete-item',
      arguments: {
        projectId: 'model-chosen',
        tenant: 'model-chosen',
        itemId: 'i1',
        dryRun: true,
      },
      authorization: 'token',
    });
    expect(calls[0].url).toBe(
      '/projects/from-token/items/i1?tenant=acme&dry_run=true'
    );
    expect(serverParameters).toHaveBeenCalledWith({
      tool: expect.objectContaining({ name: 'delete-item' }),
      headers: { Authorization: 'token' },
    });
  });

  test('drop the model value even when serverParameters is not configured', async () => {
    const calls: ResolvedRequest[] = [];
    const app = buildApp({
      spec: itemsSpec,
      callApi: (req) => {
        calls.push(req);
        return undefined;
      },
    });
    await callTool({
      app,
      name: 'delete-item',
      arguments: { projectId: 'model-chosen', tenant: 'x', itemId: 'i1' },
    });
    expect(calls[0].url).toBe('/projects/{project_id}/items/i1');
  });

  test('hide a required query parameter from `required`', () => {
    const [tool] = openApiToToolDefinitions({
      spec: {
        paths: {
          '/x': {
            get: {
              operationId: 'getX',
              parameters: [
                {
                  name: 'org',
                  in: 'query',
                  required: true,
                  'x-mcp-server-managed': true,
                },
              ],
            },
          },
        },
      },
    });
    expect(tool.inputSchema).toEqual({ type: 'object' });
    expect(tool.query?.({ org: 'o1' })).toBe('?org=o1');
  });

  test('honour a custom serverManagedExtension', () => {
    const [tool] = openApiToToolDefinitions({
      spec: {
        paths: {
          '/x/{org}': {
            get: {
              operationId: 'getX',
              parameters: [
                { name: 'org', in: 'path', required: true, 'x-pinned': true },
              ],
            },
          },
        },
      },
      options: { serverManagedExtension: 'x-pinned' },
    });
    expect(tool.serverManagedParameters).toEqual([
      { name: 'org', in: 'path', argName: 'org' },
    ]);
  });
});

describe('argumentNames: verbatim', () => {
  const tools = openApiToToolDefinitions({
    spec: itemsSpec,
    options: { argumentNames: 'verbatim' },
  });
  const updateItem = tools.find((t) => {
    return t.name === 'update-item';
  })!;

  test('uses the spec names in the input schema', () => {
    expect(Object.keys(updateItem.inputSchema.properties ?? {})).toEqual([
      'project_id',
      'item_id',
      'expected_version',
      'metadata',
    ]);
    expect(updateItem.inputSchema.required).toEqual([
      'project_id',
      'item_id',
      'expected_version',
    ]);
  });

  test('builds the request from the spec names', () => {
    const args = {
      project_id: 'p',
      item_id: 'i',
      expected_version: 3,
      metadata: { someKey: 1 },
    };
    expect(updateItem.path(args)).toBe('/projects/p/items/i');
    expect(updateItem.body?.(args)).toEqual({
      expected_version: 3,
      metadata: { someKey: 1 },
    });
  });

  test('extractBodyProps defaults to camelCase when no mapper is given', () => {
    const props = extractBodyProps({
      requestBody: (
        itemsSpec.paths!['/projects/{project_id}/items/{item_id}']
          .patch as OperationSpec
      ).requestBody,
      spec: itemsSpec,
      serverManagedExtension: 'x-mcp-server-managed',
    });
    expect(
      props.map((p) => {
        return p.argName;
      })
    ).toEqual(['expectedVersion', 'metadata']);
  });

  test('keeps camelCase as the default', () => {
    const [, defaultUpdate] = openApiToToolDefinitions({ spec: itemsSpec });
    expect(defaultUpdate.inputSchema.required).toEqual([
      'projectId',
      'itemId',
      'expectedVersion',
    ]);
  });
});

describe('$ref into sibling documents', () => {
  const tagsDocument: OpenApiSpec & Record<string, unknown> = {
    components: {
      schemas: {
        Tag: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            color: { $ref: '#/components/schemas/Color' },
          },
        },
        Color: { type: 'string', enum: ['red', 'blue'] },
        Loop: {
          type: 'object',
          properties: {
            next: { $ref: './main.yaml#/components/schemas/Node' },
          },
        },
      },
      parameters: {
        TagId: { name: 'tag_id', in: 'path', required: true },
      },
    },
    'a/b': { '~odd': { type: 'integer' } },
  };

  const mainSpec: OpenApiSpec = {
    paths: {
      '/tags/{tag_id}': {
        put: {
          operationId: 'putTag',
          parameters: [{ $ref: 'tags.yaml#/components/parameters/TagId' }],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: './tags.yaml#/components/schemas/Tag' },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Node: {
          type: 'object',
          properties: {
            loop: { $ref: './tags.yaml#/components/schemas/Loop' },
          },
        },
      },
    },
  };

  const documents = { './tags.yaml': tagsDocument, 'main.yaml': mainSpec };

  test('resolves schemas and parameters from the documents map', () => {
    const [tool] = openApiToToolDefinitions({
      spec: mainSpec,
      options: { documents },
    });
    expect(tool.inputSchema).toEqual({
      type: 'object',
      properties: {
        tagId: { type: 'string', description: '' },
        label: { type: 'string', description: '' },
        color: { type: 'string', description: '' },
      },
      required: ['tagId'],
    });
    expect(tool.acceptedBodyFields).toEqual(['label', 'color']);
  });

  test('resolves local refs inside a sibling against that sibling', () => {
    expect(
      dereferenceSchema(
        { $ref: './tags.yaml#/components/schemas/Tag' },
        mainSpec,
        documents
      )
    ).toEqual({
      type: 'object',
      properties: {
        label: { type: 'string' },
        color: { type: 'string', enum: ['red', 'blue'] },
      },
    });
  });

  test('stops at a cycle that crosses files', () => {
    expect(
      dereferenceSchema(
        { $ref: '#/components/schemas/Node' },
        mainSpec,
        documents
      )
    ).toEqual({
      type: 'object',
      properties: {
        loop: { type: 'object', properties: { next: {} } },
      },
    });
  });

  test('follows escaped JSON pointer tokens and whole-file refs', () => {
    expect(
      dereferenceSchema({ $ref: 'tags.yaml#/a~1b/~0odd' }, mainSpec, documents)
    ).toEqual({ type: 'integer' });
    expect(
      dereferenceSchema({ $ref: './tags.yaml' }, mainSpec, {
        './tags.yaml': { components: {} },
      })
    ).toEqual({ components: {} });
  });

  test('resolves to an empty schema when the file or pointer is missing', () => {
    expect(
      dereferenceSchema(
        { $ref: './tags.yaml#/components/schemas/Tag' },
        mainSpec
      )
    ).toEqual({});
    expect(
      dereferenceSchema({ $ref: './other.yaml#/x' }, mainSpec, documents)
    ).toEqual({});
    expect(
      dereferenceSchema(
        { $ref: './tags.yaml#/components/schemas/Color/enum/0/deeper' },
        mainSpec,
        documents
      )
    ).toEqual({});
  });

  test('resolveSchema follows a top-level sibling ref', () => {
    expect(
      resolveSchema(
        { $ref: './tags.yaml#/components/schemas/Color' },
        mainSpec,
        documents
      )
    ).toEqual({ type: 'string', enum: ['red', 'blue'] });
    expect(
      resolveSchema({ $ref: './missing.yaml#/x' }, mainSpec, documents)
    ).toEqual({});
  });

  test('resolveParameter returns {} when the target is not an object', () => {
    expect(
      resolveParameter(
        { $ref: './tags.yaml#/components/schemas/Color/type' },
        mainSpec,
        documents
      )
    ).toEqual({});
    expect(resolveParameter({ $ref: '#/nowhere' }, mainSpec)).toEqual({});
  });
});
