import { App, bodyParser } from '@ttoss/http-server';
import { createMcpRouter, McpServer } from '@ttoss/http-server-mcp';
import {
  type OpenApiSpec,
  openApiToToolDefinitions,
  registerOpenApiTools,
  type ResolvedRequest,
} from 'src/index';
import request from 'supertest';

const spec: OpenApiSpec = {
  paths: {
    '/documents/{document_id}': {
      patch: {
        operationId: 'updateDocument',
        parameters: [
          {
            name: 'document_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  expected_version: {
                    description: 'Refuses the write unless at this version.',
                    allOf: [{ $ref: '#/components/schemas/ExpectedVersion' }],
                  },
                  metadata: {
                    description: 'Free-form metadata.',
                    allOf: [{ $ref: '#/components/schemas/MetadataBag' }],
                  },
                  tags: {
                    allOf: [{ $ref: '#/components/schemas/Tags' }],
                  },
                  template: {
                    description: 'Composed template.',
                    allOf: [
                      { $ref: '#/components/schemas/MetadataBag' },
                      { required: ['name'] },
                    ],
                  },
                  nested: {
                    allOf: [{ allOf: [{ type: 'boolean' }] }],
                  },
                  anything: { description: 'Any JSON value.' },
                  boolean_schema: { allOf: [true] },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ExpectedVersion: {
        type: 'integer',
        nullable: true,
        description: 'Referenced description (overridden).',
      },
      MetadataBag: {
        type: 'object',
        additionalProperties: true,
      },
      Tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags.',
      },
    },
  },
};

describe('body properties declared through allOf or with no type', () => {
  const [tool] = openApiToToolDefinitions({ spec });
  const props = tool.inputSchema.properties as Record<string, unknown>;

  test('single-entry allOf takes type and nullable from the referenced schema', () => {
    expect(props.expectedVersion).toEqual({
      type: ['number', 'null'],
      description: 'Refuses the write unless at this version.',
    });
  });

  test('single-entry allOf to an object schema is advertised as an object', () => {
    expect(props.metadata).toEqual({
      type: 'object',
      description: 'Free-form metadata.',
    });
  });

  test('single-entry allOf to an array keeps items and the referenced description', () => {
    expect(props.tags).toEqual({
      type: 'array',
      items: { type: 'string' },
      description: 'Tags.',
    });
  });

  test('nested single-entry allOf is folded recursively', () => {
    expect(props.nested).toEqual({ type: 'boolean', description: '' });
  });

  test('multi-entry allOf is forwarded verbatim', () => {
    expect(props.template).toEqual({
      allOf: [
        { type: 'object', additionalProperties: true },
        { required: ['name'] },
      ],
      description: 'Composed template.',
    });
  });

  test('a property with no declared type is untyped, not a string', () => {
    expect(props.anything).toEqual({ description: 'Any JSON value.' });
    expect(props.booleanSchema).toEqual({ description: '' });
  });

  test('forwards numbers and objects unchanged over the MCP wire', async () => {
    const calls: ResolvedRequest[] = [];
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerOpenApiTools({
      server,
      spec,
      callApi: (req) => {
        calls.push(req);
        return { ok: true };
      },
    });
    const app = new App();
    app.use(bodyParser());
    app.use(createMcpRouter(server).routes());

    const res = await request(app.callback())
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'update-document',
          arguments: {
            documentId: 'doc_1',
            expectedVersion: 1,
            metadata: { revision: 3 },
            anything: [1, 'two'],
          },
        },
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream');

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('isError');
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({
      expected_version: 1,
      metadata: { revision: 3 },
      anything: [1, 'two'],
    });
  });
});
