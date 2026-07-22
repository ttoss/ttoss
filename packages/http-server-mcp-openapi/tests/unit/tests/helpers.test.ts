import {
  buildInputSchema,
  buildPathFn,
  buildQueryFn,
  dereferenceSchema,
  extractPathParams,
  extractQueryParams,
  getJsonSchemaType,
  openApiToToolDefinitions,
  operationIdToToolName,
  resolveParameter,
  resolveSchema,
  snakeToCamel,
} from 'src/index';

describe('extract helpers with no parameters', () => {
  test('return empty arrays when parameters are omitted', () => {
    expect(extractPathParams({ spec: {} })).toEqual([]);
    expect(extractQueryParams({ spec: {} })).toEqual([]);
  });
});

describe('snakeToCamel', () => {
  test('folds underscores and hyphens', () => {
    expect(snakeToCamel('agent_id')).toBe('agentId');
    expect(snakeToCamel('list-tools')).toBe('listTools');
    expect(snakeToCamel('plain')).toBe('plain');
  });
});

describe('operationIdToToolName', () => {
  test('camelCase to kebab-case', () => {
    expect(operationIdToToolName('listAgents')).toBe('list-agents');
    expect(operationIdToToolName('GetAgent')).toBe('get-agent');
  });
});

describe('getJsonSchemaType', () => {
  test('maps every OpenAPI type', () => {
    expect(getJsonSchemaType('integer')).toBe('number');
    expect(getJsonSchemaType('number')).toBe('number');
    expect(getJsonSchemaType('boolean')).toBe('boolean');
    expect(getJsonSchemaType('array')).toBe('array');
    expect(getJsonSchemaType('object')).toBe('object');
    expect(getJsonSchemaType(undefined)).toBe('string');
    expect(getJsonSchemaType('anything-else')).toBe('string');
  });
});

describe('buildInputSchema', () => {
  test('defaults array items to string when none declared', () => {
    const schema = buildInputSchema(
      [],
      [],
      [
        {
          snakeName: 'ids',
          camelName: 'ids',
          description: 'the ids',
          required: false,
          type: 'array',
        },
      ]
    );
    const props = schema.properties as Record<string, unknown>;
    expect(props.ids).toEqual({
      type: 'array',
      items: { type: 'string' },
      description: 'the ids',
    });
    expect(schema.required).toBeUndefined();
  });

  test('maps a boolean body prop', () => {
    const schema = buildInputSchema(
      [],
      [],
      [
        {
          snakeName: 'enabled',
          camelName: 'enabled',
          description: '',
          required: true,
          type: 'boolean',
        },
      ]
    );
    const props = schema.properties as Record<string, unknown>;
    expect(props.enabled).toEqual({ type: 'boolean', description: '' });
    expect(schema.required).toEqual(['enabled']);
  });
});

describe('resolveParameter', () => {
  const spec = {
    components: { parameters: { Known: { name: 'known', in: 'query' } } },
  };

  test('returns {} for undefined', () => {
    expect(resolveParameter(undefined, spec)).toEqual({});
  });

  test('resolves a known $ref', () => {
    expect(
      resolveParameter({ $ref: '#/components/parameters/Known' }, spec)
    ).toEqual({ name: 'known', in: 'query' });
  });

  test('returns {} for an unresolvable $ref', () => {
    expect(
      resolveParameter({ $ref: '#/components/parameters/Missing' }, spec)
    ).toEqual({});
  });
});

describe('resolveSchema', () => {
  test('returns {} for undefined', () => {
    expect(resolveSchema(undefined, {})).toEqual({});
  });

  test('follows a top-level $ref into components.schemas', () => {
    const spec = {
      components: {
        schemas: {
          Widget: {
            type: 'object',
            properties: { size: {} },
            required: ['size'],
          },
        },
      },
    };
    const resolved = resolveSchema(
      { $ref: '#/components/schemas/Widget' },
      spec
    );
    expect(resolved.required).toEqual(['size']);
    expect(resolved.properties).toHaveProperty('size');
  });

  test('merges anyOf alternatives (union props, intersection required)', () => {
    const merged = resolveSchema(
      {
        anyOf: [
          { type: 'object', properties: { a: {}, b: {} }, required: ['a'] },
          {
            type: 'object',
            properties: { b: {}, c: {} },
            required: ['a', 'c'],
          },
        ],
      },
      {}
    );
    expect(Object.keys(merged.properties ?? {}).sort()).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(merged.required).toEqual(['a']);
  });

  test('collapses empty alternatives to undefined props/required', () => {
    const merged = resolveSchema(
      { oneOf: [{ type: 'object' }, { type: 'object' }] },
      {}
    );
    expect(merged.properties).toBeUndefined();
    expect(merged.required).toBeUndefined();
  });
});

describe('dereferenceSchema', () => {
  test('returns undefined when given no schema', () => {
    expect(dereferenceSchema(undefined, {})).toBeUndefined();
  });

  test('inlines nested refs and stops at circular ones', () => {
    const spec = {
      components: {
        schemas: {
          A: {
            type: 'object',
            properties: { b: { $ref: '#/components/schemas/B' } },
          },
          B: {
            type: 'object',
            properties: { a: { $ref: '#/components/schemas/A' } },
          },
        },
      },
    };
    const result = dereferenceSchema(
      { $ref: '#/components/schemas/A' },
      spec
    ) as Record<
      string,
      { properties: { b: { properties: { a: Record<string, unknown> } } } }
    >;
    // A.b.a resolves back to A → circular guard returns {}.
    expect(result.properties.b.properties.a).toEqual({});
  });
});

describe('buildPathFn', () => {
  test('leaves the placeholder when the arg is missing', () => {
    const fn = buildPathFn('/a/{id}', [{ name: 'id', camelName: 'id' }]);
    expect(fn({})).toBe('/a/{id}');
  });
});

describe('buildQueryFn', () => {
  test('returns an empty string when every value is absent', () => {
    const fn = buildQueryFn([{ name: 'a', camelName: 'a' }]);
    expect(fn?.({})).toBe('');
  });
});

describe('path param without a name', () => {
  test('defaults the name to an empty string', () => {
    const [tool] = openApiToToolDefinitions({
      spec: {
        paths: {
          '/x': {
            get: { operationId: 'getX', parameters: [{ in: 'path' }] },
          },
        },
      },
    });
    expect(tool.inputSchema.properties).toEqual({
      '': { type: 'string', description: '' },
    });
  });
});

describe('sparse parameters fall back to defaults', () => {
  test('unnamed / undescribed query param and typeless body prop', () => {
    const [tool] = openApiToToolDefinitions({
      spec: {
        paths: {
          '/x': {
            post: {
              operationId: 'postX',
              parameters: [
                // No name, no description, no schema — all defaulted.
                { in: 'query' },
              ],
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      // Property with neither type nor description.
                      properties: { bare: {} },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const props = tool.inputSchema.properties as Record<
      string,
      { type: string; description?: string }
    >;
    // Unnamed query param camelCases to '' and defaults to a string.
    expect(props['']).toEqual({ type: 'string', description: '' });
    // Typeless body prop defaults to string with an empty description.
    expect(props.bare).toEqual({ type: 'string', description: '' });
    expect(tool.inputSchema.required).toBeUndefined();
  });
});

describe('openApiToToolDefinitions with a custom server-managed extension', () => {
  test('hides fields flagged by the configured extension only', () => {
    const [tool] = openApiToToolDefinitions({
      spec: {
        paths: {
          '/x': {
            post: {
              operationId: 'postX',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        keep: { type: 'string' },
                        drop: { type: 'string', 'x-managed': true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      options: { serverManagedExtension: 'x-managed' },
    });
    const props = tool.inputSchema.properties as Record<string, unknown>;
    expect(Object.keys(props)).toEqual(['keep']);
    expect(tool.acceptedBodyFields.sort()).toEqual(['drop', 'keep']);
  });
});
