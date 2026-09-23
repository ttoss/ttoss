import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, McpServer } from '@ttoss/http-server-mcp';
import {
  type OpenApiSpec,
  openApiToToolDefinitions,
  registerOpenApiTools,
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

  test('reach callApi through registerOpenApiTools without serverParameters', async () => {
    const calls: ResolvedRequest[] = [];
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerOpenApiTools({
      server,
      spec,
      options: { argumentNames: 'verbatim' },
      callApi: (req) => {
        calls.push(req);
        return { ok: true };
      },
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
