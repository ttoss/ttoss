import { openApiToToolDefinitions, toToolSchema } from 'src/index';

describe('toToolSchema', () => {
  test('keeps every constraint JSON Schema can express', () => {
    const schema = {
      type: 'integer',
      minimum: 1,
      maximum: 200,
      default: 50,
      description: "Line one\nit's line two",
    };

    expect(toToolSchema(schema)).toEqual(schema);
  });

  test('keeps enum, format and pattern', () => {
    expect(
      toToolSchema({ type: 'string', enum: ['a', 'b'], format: 'date-time' })
    ).toEqual({ type: 'string', enum: ['a', 'b'], format: 'date-time' });
    expect(toToolSchema({ type: 'string', pattern: '^x_' })).toEqual({
      type: 'string',
      pattern: '^x_',
    });
  });

  test('drops OpenAPI-only keywords and extensions at every depth', () => {
    expect(
      toToolSchema({
        type: 'object',
        example: { a: 1 },
        'x-internal': true,
        discriminator: { propertyName: 'kind' },
        xml: { name: 'x' },
        externalDocs: { url: 'https://example.com' },
        properties: {
          a: { type: 'string', example: 'x', 'x-mcp-server-managed': 1 },
        },
        items: { type: 'string', example: 'x' },
        oneOf: [{ type: 'string', example: 'x' }],
      })
    ).toEqual({
      type: 'object',
      properties: { a: { type: 'string' } },
      items: { type: 'string' },
      oneOf: [{ type: 'string' }],
    });
  });

  test('walks every keyword that holds schemas', () => {
    const nested = { type: 'string', example: 'x' };
    const clean = { type: 'string' };

    expect(
      toToolSchema({
        patternProperties: { '^a': nested },
        $defs: { A: nested },
        definitions: { A: nested },
        dependentSchemas: { a: nested },
        additionalProperties: nested,
        propertyNames: nested,
        contains: nested,
        not: nested,
        if: nested,
        then: nested,
        else: nested,
        unevaluatedItems: nested,
        unevaluatedProperties: nested,
        anyOf: [nested],
        prefixItems: [nested],
      })
    ).toEqual({
      patternProperties: { '^a': clean },
      $defs: { A: clean },
      definitions: { A: clean },
      dependentSchemas: { a: clean },
      additionalProperties: clean,
      propertyNames: clean,
      contains: clean,
      not: clean,
      if: clean,
      then: clean,
      else: clean,
      unevaluatedItems: clean,
      unevaluatedProperties: clean,
      anyOf: [clean],
      prefixItems: [clean],
    });
  });

  test('copies data keywords untouched, even when shaped like a schema', () => {
    const schema = {
      type: 'object',
      properties: {
        example: { type: 'string' },
        nullable: { type: 'boolean' },
      },
      enum: [{ example: 1, nullable: true }],
      default: { 'x-a': 1 },
      additionalProperties: true,
      items: false,
    };

    expect(toToolSchema(schema)).toEqual(schema);
  });

  test('turns nullable into a null type', () => {
    expect(toToolSchema({ type: 'string', nullable: true })).toEqual({
      type: ['string', 'null'],
    });
    expect(
      toToolSchema({ type: ['string', 'number'], nullable: true })
    ).toEqual({
      type: ['string', 'number', 'null'],
    });
    expect(toToolSchema({ type: ['string', 'null'], nullable: true })).toEqual({
      type: ['string', 'null'],
    });
    expect(toToolSchema({ description: 'any', nullable: true })).toEqual({
      description: 'any',
    });
    expect(toToolSchema({ type: 'string', nullable: false })).toEqual({
      type: 'string',
    });
  });

  test('adds null to the enum of a nullable property', () => {
    expect(
      toToolSchema({ type: 'string', enum: ['low', 'high'], nullable: true })
    ).toEqual({ type: ['string', 'null'], enum: ['low', 'high', null] });
    expect(
      toToolSchema({ type: 'string', enum: ['low', null], nullable: true })
    ).toEqual({ type: ['string', 'null'], enum: ['low', null] });
  });

  test('merges an allOf wrapping one scalar, siblings winning', () => {
    expect(
      toToolSchema({
        allOf: [{ type: 'string', enum: ['a'], description: 'Referenced.' }],
        description: 'Own.',
        nullable: true,
      })
    ).toEqual({
      type: ['string', 'null'],
      enum: ['a', null],
      description: 'Own.',
    });
  });

  test('merges an allOf of objects into one object', () => {
    expect(
      toToolSchema({
        description: 'A write.',
        allOf: [
          {
            type: 'object',
            required: ['a'],
            properties: { a: { type: 'string', example: 'x' } },
          },
          {
            type: 'object',
            required: ['a', 'b'],
            properties: { b: { allOf: [{ type: 'integer' }] } },
          },
          { description: 'No properties.' },
          'not a schema',
        ],
      })
    ).toEqual({
      description: 'A write.',
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'integer' } },
      required: ['a', 'b'],
    });
  });

  test('leaves required out of a merged object that has none', () => {
    expect(
      toToolSchema({ allOf: [{ properties: { a: { type: 'string' } } }] })
    ).toEqual({ type: 'object', properties: { a: { type: 'string' } } });
  });

  test('passes anything that is not a schema object through', () => {
    expect(toToolSchema(undefined)).toBeUndefined();
    expect(toToolSchema(true)).toBe(true);
    expect(toToolSchema(['a'])).toEqual(['a']);
  });
});

const spec = {
  paths: {
    '/items/{item_id}': {
      parameters: [
        {
          name: 'item_id',
          in: 'path',
          required: true,
          description: 'The item.',
          schema: { $ref: '#/components/schemas/ItemId' },
        },
      ],
      patch: {
        operationId: 'updateItem',
        summary: 'Update an item',
        description: "The item's fields.\nOnly what is sent changes.",
        parameters: [
          {
            name: 'dry_run',
            in: 'query',
            schema: { type: 'boolean', default: false },
          },
          { name: 'tenant', in: 'query', 'x-mcp-server-managed': true },
          { name: 'raw', in: 'query' },
          { $ref: '#/components/parameters/Status' },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ItemPatch' },
            },
          },
        },
      },
    },
    '/items': {
      get: { operationId: 'listItems' },
    },
  },
  components: {
    parameters: {
      Status: {
        name: 'state',
        in: 'query',
        schema: {
          type: 'array',
          items: { $ref: '#/components/schemas/Status' },
        },
      },
    },
    schemas: {
      ItemId: {
        type: 'string',
        pattern: '^it_[a-z0-9]{10}$',
        example: 'it_0123456789',
        description: 'An item id.',
      },
      Status: { type: 'string', enum: ['open', 'closed'] },
      ItemPatch: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            allOf: [{ $ref: '#/components/schemas/Status' }],
            description: 'Where it is.',
          },
          priority: {
            type: 'string',
            enum: ['low', 'high'],
            nullable: true,
          },
          wait: {
            type: 'object',
            required: ['kind'],
            properties: { kind: { type: 'string', enum: ['a', 'b'] } },
          },
          owner: { 'x-mcp-server-managed': true, type: 'string' },
        },
      },
    },
  },
};

describe("schemaDetail: 'full'", () => {
  const tools = openApiToToolDefinitions({
    spec,
    options: { schemaDetail: 'full', argumentNames: 'verbatim' },
  });

  const update = tools.find((tool) => {
    return tool.name === 'update-item';
  })!;

  test('carries the whole schema of every argument', () => {
    expect(update.inputSchema).toEqual({
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          pattern: '^it_[a-z0-9]{10}$',
          description: 'The item.',
        },
        dry_run: { type: 'boolean', default: false },
        raw: {},
        state: {
          type: 'array',
          items: { type: 'string', enum: ['open', 'closed'] },
        },
        status: {
          type: 'string',
          enum: ['open', 'closed'],
          description: 'Where it is.',
        },
        priority: { type: ['string', 'null'], enum: ['low', 'high', null] },
        wait: {
          type: 'object',
          required: ['kind'],
          properties: { kind: { type: 'string', enum: ['a', 'b'] } },
        },
      },
      required: ['item_id', 'status'],
    });
  });

  test('keeps a query array parameter with its item schema', () => {
    const list = openApiToToolDefinitions({
      spec,
      options: { schemaDetail: 'full' },
    }).find((tool) => {
      return tool.name === 'update-item';
    })!;

    expect(list.inputSchema.properties).toMatchObject({
      state: {
        type: 'array',
        items: { type: 'string', enum: ['open', 'closed'] },
      },
      itemId: { description: 'The item.' },
      dryRun: { default: false },
    });
  });

  test('gives an operation with no arguments an empty properties object', () => {
    expect(
      tools.find((tool) => {
        return tool.name === 'list-items';
      })!.inputSchema
    ).toEqual({ type: 'object', properties: {} });
  });

  test('still builds the request from the arguments', () => {
    const args = {
      item_id: 'it_1',
      dry_run: true,
      state: ['open', 'closed'],
      status: 'open',
      priority: null,
    };

    expect(update.path(args)).toBe('/items/it_1');
    expect(update.query?.(args)).toBe('?dry_run=true&state=open&state=closed');
    expect(update.body?.(args)).toEqual({ status: 'open', priority: null });
  });

  test('keeps the compact schema by default', () => {
    const compact = openApiToToolDefinitions({ spec }).find((tool) => {
      return tool.name === 'update-item';
    })!;

    expect(compact.inputSchema.properties).toMatchObject({
      priority: { type: ['string', 'null'] },
    });
    expect(
      (compact.inputSchema.properties as Record<string, object>).priority
    ).not.toHaveProperty('enum');
  });
});

describe('describe', () => {
  test('builds each tool description from its operation', () => {
    const describe = jest.fn(({ operation, method, pathTemplate }) => {
      return `${operation.summary ?? operation.operationId}\n\n(${method} ${pathTemplate})`;
    });

    const tools = openApiToToolDefinitions({ spec, options: { describe } });

    expect(
      tools.map((tool) => {
        return tool.description;
      })
    ).toEqual([
      'Update an item\n\n(PATCH /items/{item_id})',
      'listItems\n\n(GET /items)',
    ]);
    expect(describe).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        pathTemplate: '/items/{item_id}',
      })
    );
  });

  test('defaults to the sanitised operation description', () => {
    expect(openApiToToolDefinitions({ spec })[0].description).toBe(
      "The item\\'s fields. Only what is sent changes."
    );
  });
});
