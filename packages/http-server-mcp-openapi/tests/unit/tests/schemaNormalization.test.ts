import { App, bodyParser } from '@ttoss/http-server';
import {
  createMcpRouter,
  McpServer,
  registerTools,
} from '@ttoss/http-server-mcp';
import {
  type OpenApiSpec,
  openApiToToolDefinitions,
  openApiToTools,
  type ResolvedRequest,
} from 'src/index';
import request from 'supertest';

/** A schema read by key at any depth; arrays are indexed by position. */
type SchemaNode = { [key: string]: SchemaNode };

const toolFor = (
  spec: OpenApiSpec,
  options: Parameters<typeof openApiToToolDefinitions>[0]['options'] = {
    argumentNames: 'verbatim',
  }
) => {
  const [tool] = openApiToToolDefinitions({ spec, options });
  return tool!;
};

describe('nullable inside nested schemas', () => {
  const spec: OpenApiSpec = {
    paths: {
      '/agents': {
        post: {
          operationId: 'createAgent',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    stop_conditions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          max: { type: 'integer', nullable: true },
                          tool_ids: {
                            type: 'array',
                            items: { type: 'string' },
                            nullable: true,
                          },
                          label: { nullable: true },
                          code: { type: ['string', 'null'], nullable: true },
                          done: { type: 'boolean', nullable: false },
                          nullable: { type: 'string' },
                        },
                      },
                    },
                    choice: {
                      oneOf: [
                        { type: 'string', nullable: true },
                        {
                          type: 'object',
                          additionalProperties: {
                            type: ['number'],
                            nullable: true,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const props = toolFor(spec).inputSchema.properties as unknown as SchemaNode;

  test('merges null into a sibling type at any depth', () => {
    const item = props.stop_conditions.items.properties;
    expect(item.max).toEqual({ type: ['integer', 'null'] });
    expect(item.tool_ids).toEqual({
      type: ['array', 'null'],
      items: { type: 'string' },
    });
  });

  test('drops nullable where there is no type to merge into', () => {
    expect(props.stop_conditions.items.properties.label).toEqual({});
  });

  test('adds null once, and not for nullable: false', () => {
    const item = props.stop_conditions.items.properties;
    expect(item.code).toEqual({ type: ['string', 'null'] });
    expect(item.done).toEqual({ type: 'boolean' });
  });

  test('keeps a property that is named nullable', () => {
    expect(props.stop_conditions.items.properties.nullable).toEqual({
      type: 'string',
    });
  });

  test('normalizes composed alternatives and additionalProperties', () => {
    expect(props.choice.oneOf[0]).toEqual({ type: ['string', 'null'] });
    expect(props.choice.oneOf[1].additionalProperties).toEqual({
      type: ['number', 'null'],
    });
  });

  test('leaves no nullable keyword anywhere in the schema', () => {
    expect(JSON.stringify(props)).not.toMatch(/"nullable":(true|false)/);
  });
});

describe('server-managed parameters pinned by the spec', () => {
  const spec: OpenApiSpec = {
    paths: {
      '/agents/{agent_id}/generations': {
        post: {
          operationId: 'createAgentGeneration',
          parameters: [
            { name: 'agent_id', in: 'path', required: true },
            {
              name: 'wait',
              in: 'query',
              schema: { type: 'boolean' },
              'x-mcp-server-managed': 'true',
            },
            { name: 'trace', in: 'query', 'x-mcp-server-managed': true },
          ],
        },
      },
    },
  };

  const tool = toolFor(spec, { argumentNames: 'verbatim' });

  test('are hidden from the input schema', () => {
    expect(Object.keys(tool.inputSchema.properties ?? {})).toEqual([
      'agent_id',
    ]);
  });

  test('carry the declared value on the tool definition', () => {
    expect(tool.serverManagedParameters).toEqual([
      { name: 'wait', in: 'query', argName: 'wait', value: 'true' },
      { name: 'trace', in: 'query', argName: 'trace' },
    ]);
  });

  test('are sent with the declared value by the query builder itself', () => {
    expect(tool.query!({ agent_id: 'a' })).toBe('?wait=true');
  });

  test('win over a value in the args', () => {
    expect(tool.query!({ agent_id: 'a', wait: 'false' })).toBe('?wait=true');
  });

  test('pin path parameters too', () => {
    const pinned = toolFor({
      paths: {
        '/v/{version}/items': {
          get: {
            operationId: 'listItems',
            parameters: [
              {
                name: 'version',
                in: 'path',
                'x-mcp-server-managed': 'v1',
              },
            ],
          },
        },
      },
    });
    expect(pinned.path({ version: 'v9' })).toBe('/v/v1/items');
  });

  test('reach callApi through openApiToTools without serverParameters', async () => {
    const calls: ResolvedRequest[] = [];
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec,
        options: { argumentNames: 'verbatim' },
        callApi: (req) => {
          calls.push(req);
          return { ok: true };
        },
      }),
    });
    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    await request(app.callback())
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'create-agent-generation',
          arguments: { agent_id: 'agt_1', wait: false },
        },
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream');

    expect(calls[0]!.url).toBe('/agents/agt_1/generations?wait=true');
  });
});

describe('server-managed body properties pinned by the spec', () => {
  const decisionsSpec = (wait: Record<string, unknown>): OpenApiSpec => {
    return {
      paths: {
        '/deciders/{decider_id}/decisions': {
          post: {
            operationId: 'createDecision',
            parameters: [{ name: 'decider_id', in: 'path', required: true }],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['state'],
                    properties: {
                      state: { type: 'string' },
                      wait: { 'x-mcp-server-managed': 'true', ...wait },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  };

  const tool = toolFor(decisionsSpec({ type: 'boolean' }));

  test('are hidden from the input schema', () => {
    expect(Object.keys(tool.inputSchema.properties ?? {})).toEqual([
      'decider_id',
      'state',
    ]);
  });

  test('are sent by the body builder, typed by their schema', () => {
    expect(tool.body!({ decider_id: 'd', state: 's' })).toEqual({
      state: 's',
      wait: true,
    });
  });

  test('win over a value in the args', () => {
    expect(tool.body!({ state: 's', wait: false })).toEqual({
      state: 's',
      wait: true,
    });
  });

  test.each([
    ['integer', '3', 3],
    ['number', '0.5', 0.5],
    ['string', 'fast', 'fast'],
    ['boolean', 'false', false],
  ])('read a %s pin as that type', (type, pinned, expected) => {
    const typed = toolFor(
      decisionsSpec({ type, 'x-mcp-server-managed': pinned })
    );
    expect(typed.body!({ state: 's' }).wait).toEqual(expected);
  });

  test('read the type through a single-entry allOf', () => {
    const wrapped = toolFor({
      paths: {
        '/x': {
          post: {
            operationId: 'createX',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      wait: {
                        'x-mcp-server-managed': 'true',
                        allOf: [{ $ref: '#/components/schemas/Flag' }],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { Flag: { type: 'boolean' } } },
    });
    expect(wrapped.body!({})).toEqual({ wait: true });
  });

  test('give a body builder to an operation whose only property is pinned', () => {
    const only = toolFor({
      paths: {
        '/x': {
          post: {
            operationId: 'createX',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      wait: { type: 'boolean', 'x-mcp-server-managed': 'true' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(only.inputSchema).toEqual({ type: 'object' });
    expect(only.body!({})).toEqual({ wait: true });
  });

  test.each([
    [
      'a boolean pin that is not true or false',
      { type: 'boolean', 'x-mcp-server-managed': 'yes' },
    ],
    [
      'a number pin that is not a number',
      { type: 'integer', 'x-mcp-server-managed': 'many' },
    ],
    [
      'an integer pin with a fraction',
      { type: 'integer', 'x-mcp-server-managed': '1.5' },
    ],
    ['a pin on an object property', { type: 'object' }],
    ['a pin on an untyped property', {}],
  ])('refuse %s, naming the operation and property', (_, wait) => {
    expect(() => {
      return toolFor(decisionsSpec(wait));
    }).toThrow(/createDecision.*wait/);
  });

  test('leave an unpinned server-managed body property unsent', () => {
    const hidden = toolFor(
      decisionsSpec({ type: 'boolean', 'x-mcp-server-managed': true })
    );
    expect(hidden.body!({ state: 's', wait: false })).toEqual({ state: 's' });
  });

  test('reach callApi through openApiToTools', async () => {
    const calls: ResolvedRequest[] = [];
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTools({
      server,
      tools: openApiToTools({
        spec: decisionsSpec({ type: 'boolean' }),
        options: { argumentNames: 'verbatim' },
        callApi: (req) => {
          calls.push(req);
          return { ok: true };
        },
      }),
    });
    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    await request(app.callback())
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'create-decision',
          arguments: { decider_id: 'dcd_1', state: 's' },
        },
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream');

    expect(calls[0]!.body).toEqual({ state: 's', wait: true });
  });
});

describe('several server-managed extensions', () => {
  const spec: OpenApiSpec = {
    paths: {
      '/agents/{agent_id}/generations': {
        post: {
          operationId: 'createAgentGeneration',
          parameters: [
            { name: 'agent_id', in: 'path', required: true },
            { name: 'wait', in: 'query', 'x-tool-forced': 'true' },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string' },
                    trace_id: { type: 'string', 'x-server-set': true },
                    stream: { type: 'boolean', 'x-tool-unsupported': true },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const tool = toolFor(spec, {
    argumentNames: 'verbatim',
    serverManagedExtension: [
      'x-server-set',
      'x-tool-unsupported',
      'x-tool-forced',
    ],
  });

  test('hide body properties flagged by any of them', () => {
    expect(Object.keys(tool.inputSchema.properties ?? {}).sort()).toEqual([
      'agent_id',
      'prompt',
    ]);
  });

  test('keep flagged body properties in acceptedBodyFields', () => {
    expect(tool.acceptedBodyFields.sort()).toEqual([
      'prompt',
      'stream',
      'trace_id',
    ]);
  });

  test('pin a parameter flagged by any of them', () => {
    expect(tool.query!({ agent_id: 'a' })).toBe('?wait=true');
  });

  test('never send a hidden body property', () => {
    expect(
      tool.body!({ agent_id: 'a', prompt: 'hi', stream: true, trace_id: 't' })
    ).toEqual({ prompt: 'hi' });
  });
});
