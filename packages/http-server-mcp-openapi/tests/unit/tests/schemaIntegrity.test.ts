import { fromJsonSchema, McpServer } from '@modelcontextprotocol/server';
import { openApiToToolDefinitions } from 'src/index';

/**
 * Collects every path in `node` whose value is `undefined`.
 *
 * JSON has no `undefined`, so such a key is invisible once the schema is
 * serialised — which is what makes it dangerous. The value survives on the
 * in-memory object handed to the JSON Schema validator when a tool is
 * registered, and that validator throws while compiling `properties`.
 */
const findUndefinedPaths = (
  node: unknown,
  path: string,
  found: string[]
): void => {
  if (node === null || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (const [index, entry] of node.entries()) {
      if (entry === undefined) found.push(`${path}[${index}]`);
      findUndefinedPaths(entry, `${path}[${index}]`, found);
    }
    return;
  }

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (value === undefined) found.push(`${path}.${key}`);
    findUndefinedPaths(value, `${path}.${key}`, found);
  }
};

/**
 * A `$ref` this generator cannot resolve. Only same-document
 * `#/components/schemas/...` refs are followed, so a ref into another file has
 * no target here — the shape real multi-file OpenAPI documents produce.
 */
const specWithUnresolvableRef = {
  paths: {
    '/agents/{agent_id}': {
      patch: {
        operationId: 'patchAgent',
        parameters: [
          {
            name: 'agent_id',
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
                  tool_bindings: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        tool_id: { type: 'string' },
                        tool: {
                          $ref: './tools.yaml#/components/schemas/CreateTool',
                        },
                      },
                    },
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

describe('generated schema integrity', () => {
  const tools = openApiToToolDefinitions({ spec: specWithUnresolvableRef });

  test('an unresolvable $ref leaves no undefined value behind', () => {
    const found: string[] = [];
    for (const tool of tools) {
      findUndefinedPaths(tool.inputSchema, tool.name, found);
    }

    expect(found).toEqual([]);
  });

  test('the unresolvable ref becomes an empty schema, keeping the property visible', () => {
    // Resolved the same way as a circular ref: `{}` accepts any value, so the
    // property stays discoverable and no valid call is rejected. Dropping it
    // would hide a field the API does accept.
    const props = tools[0].inputSchema.properties as Record<string, never>;
    expect(props.toolBindings).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: { tool_id: { type: 'string' }, tool: {} },
      },
      description: '',
    });
  });

  test('every inputSchema survives a JSON round-trip unchanged', () => {
    for (const tool of tools) {
      expect(JSON.parse(JSON.stringify(tool.inputSchema))).toEqual(
        tool.inputSchema
      );
    }
  });

  test('every generated schema compiles in the real MCP SDK, on live objects', () => {
    // Deliberately not JSON round-tripped: serialising drops `undefined` and
    // would hide the very class of bug this suite exists to catch.
    const server = new McpServer({ name: 'integrity', version: '1.0.0' });

    for (const tool of tools) {
      expect(() => {
        server.registerTool(
          tool.name,
          {
            description: tool.description,
            inputSchema: fromJsonSchema(tool.inputSchema as never),
          },
          async () => {
            return { content: [{ type: 'text' as const, text: 'ok' }] };
          }
        );
      }).not.toThrow();
    }
  });

  test('a zero-parameter operation omits `required` rather than setting it undefined', () => {
    const [tool] = openApiToToolDefinitions({
      spec: { paths: { '/ping': { get: { operationId: 'ping' } } } },
    });
    expect('required' in tool.inputSchema).toBe(false);
  });

  test('an operation with only optional params omits `required`', () => {
    const [tool] = openApiToToolDefinitions({
      spec: {
        paths: {
          '/things': {
            get: {
              operationId: 'listThings',
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  required: false,
                  schema: { type: 'integer' },
                },
              ],
            },
          },
        },
      },
    });
    expect('required' in tool.inputSchema).toBe(false);
  });
});
