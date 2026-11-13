import {
  buildOperationUrl,
  buildRequestBody,
  deriveColumns,
  detectServerPagination,
  extractItems,
  extractRecord,
  extractTotal,
  findOperation,
  findSiblingOperation,
  type FormField,
  getCellKind,
  getDetailFields,
  getFieldKind,
  getFormFields,
  getListItemSchema,
  getRecordSchema,
  getRequestBody,
  humanizeKey,
  initFormValues,
  matchesSearch,
  type OpenApiSpec,
  paginationParams,
  parseFieldValue,
  recordLabel,
  type ResolvedOperation,
  resolveSchema,
  statusTone,
  toFormData,
} from '../../../src/core';
import { spec } from '../fixtures';

const op = (operationId: string): ResolvedOperation => {
  const found = findOperation({ spec, operationId });
  if (!found) {
    throw new Error(operationId);
  }
  return found;
};

const field = (overrides: Partial<FormField>): FormField => {
  return {
    name: 'value',
    label: 'Value',
    schema: { type: 'string' },
    required: false,
    kind: 'text',
    ...overrides,
  };
};

describe('resolveSchema', () => {
  test('resolves $ref and keeps sibling keywords', () => {
    expect(
      resolveSchema({
        schema: {
          $ref: '#/components/schemas/ClientStatus',
          default: 'active',
        },
        spec,
      })
    ).toEqual({
      type: 'string',
      enum: ['active', 'pending', 'blocked'],
      default: 'active',
    });
  });

  test('merges allOf properties and required', () => {
    const schema = resolveSchema({
      schema: { $ref: '#/components/schemas/ClientInput' },
      spec,
    });
    expect(schema?.required).toEqual(['name', 'email']);
    expect(Object.keys(schema?.properties ?? {})).toContain('balance');
  });

  test('falls back to snake_cased keys and file-prefixed refs', () => {
    const snakeSpec: OpenApiSpec = {
      openapi: '3.0.0',
      paths: {},
      components: { schemas: { client_status: { type: 'string' } } },
    };
    expect(
      resolveSchema({
        schema: { $ref: './schemas.yaml#/components/schemas/clientStatus' },
        spec: snakeSpec,
      })
    ).toEqual({ type: 'string' });
    expect(
      resolveSchema({
        schema: { $ref: '#/components/schemas/Missing' },
        spec: snakeSpec,
      })
    ).toBeUndefined();
    expect(
      resolveSchema({ schema: { $ref: '#/info/title/x' }, spec: snakeSpec })
    ).toBeUndefined();
  });

  test('stops on self-referencing schemas', () => {
    const loop: OpenApiSpec = {
      openapi: '3.0.0',
      paths: {},
      components: { schemas: { A: { $ref: '#/components/schemas/A' } } },
    };
    expect(
      resolveSchema({ schema: { $ref: '#/components/schemas/A' }, spec: loop })
    ).toBeUndefined();
  });
});

describe('operations', () => {
  test('finds an operation and merges path-level params', () => {
    const getClient = op('getClient');
    expect(getClient.method).toBe('get');
    expect(getClient.pathTemplate).toBe('/clients/{client_id}');
    expect(
      getClient.operation.parameters?.map((p) => {
        return p.name;
      })
    ).toEqual(['client_id']);
    expect(findOperation({ spec, operationId: 'nope' })).toBeUndefined();
  });

  test('reads snake_cased operation keys', () => {
    const snake = {
      openapi: '3.0.0',
      paths: {
        '/x': {
          post: { operation_id: 'createX', request_body: { content: {} } },
        },
      },
    } as unknown as OpenApiSpec;
    expect(
      findOperation({ spec: snake, operationId: 'createX' })?.operation
        .requestBody
    ).toEqual({
      content: {},
    });
  });

  test('builds URLs with path and query params, ignoring unknown params', () => {
    expect(
      buildOperationUrl({
        operation: op('getClient'),
        params: { client_id: 'a b', extra: 1 },
      })
    ).toBe('/clients/a%20b');
    expect(
      buildOperationUrl({
        operation: op('listOrders'),
        params: { limit: 10, offset: 0, q: '' },
      })
    ).toBe('/orders?limit=10&offset=0');
    expect(buildOperationUrl({ operation: op('listClients') })).toBe(
      '/clients'
    );
    expect(() => {
      return buildOperationUrl({ operation: op('getClient'), params: {} });
    }).toThrow('Missing path parameter "client_id"');
  });
});

describe('table helpers', () => {
  test('gets the item schema of bare arrays and paginated wrappers', () => {
    const clientSchema = getListItemSchema({
      operation: op('listClients'),
      spec,
    });
    expect(clientSchema?.properties?.status.enum).toEqual([
      'active',
      'pending',
      'blocked',
    ]);
    const orderSchema = getListItemSchema({
      operation: op('listOrders'),
      spec,
    });
    expect(Object.keys(orderSchema?.properties ?? {})).toEqual([
      'id',
      'total',
      'status',
    ]);
    expect(
      getListItemSchema({ operation: op('deleteClient'), spec })
    ).toBeUndefined();
  });

  test('extracts items and totals', () => {
    expect(extractItems([{ a: 1 }, 2])).toEqual([{ a: 1 }]);
    expect(extractItems({ data: [{ a: 1 }], total: 1 })).toEqual([{ a: 1 }]);
    expect(extractItems('x')).toEqual([]);
    expect(extractItems({ a: 1 })).toEqual([]);
    expect(extractTotal({ total: 5 })).toBe(5);
    expect(extractTotal({ meta: { total_count: 7 } })).toBe(7);
    expect(extractTotal({ data: [] })).toBeUndefined();
    expect(extractTotal([])).toBeUndefined();
  });

  test('detects server pagination styles', () => {
    expect(detectServerPagination(op('listOrders'))).toEqual({
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
    });
    expect(detectServerPagination(op('listClients'))).toBeUndefined();
    const paged = (minimum?: number): ResolvedOperation => {
      return {
        method: 'get',
        pathTemplate: '/x',
        operation: {
          operationId: 'x',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', minimum } },
            { name: 'per_page', in: 'query' },
          ],
        },
      };
    };
    const pagination = detectServerPagination(paged(0));
    expect(pagination).toEqual({
      type: 'page',
      pageParam: 'page',
      sizeParam: 'per_page',
      firstPage: 0,
    });
    expect(detectServerPagination(paged())).toMatchObject({ firstPage: 1 });
    expect(
      paginationParams({ pagination: pagination!, pageIndex: 2, pageSize: 10 })
    ).toEqual({ per_page: 10, page: 2 });
    expect(
      paginationParams({
        pagination: {
          type: 'offset',
          limitParam: 'limit',
          offsetParam: 'offset',
        },
        pageIndex: 2,
        pageSize: 10,
      })
    ).toEqual({ limit: 10, offset: 20 });
  });

  test('derives columns from the schema or the data', () => {
    const itemSchema = getListItemSchema({
      operation: op('listClients'),
      spec,
    });
    expect(deriveColumns({ itemSchema })).toEqual([
      'id',
      'name',
      'email',
      'status',
      'balance',
      'vip',
    ]);
    expect(deriveColumns({ itemSchema, maxColumns: 20 })).toEqual([
      'id',
      'name',
      'email',
      'status',
      'balance',
      'vip',
      'birth_date',
      'created_at',
      'address',
      'tags',
    ]);
    expect(
      deriveColumns({
        items: [
          { id: 1, token: 'x' },
          { id: 2, label: 'y' },
        ],
      })
    ).toEqual(['id', 'label']);
  });

  test('classifies cells', () => {
    expect(getCellKind({ key: 'api_key', value: 'x' })).toBe('sensitive');
    expect(
      getCellKind({ key: 'a', value: 'x', schema: { 'x-sensitive': true } })
    ).toBe('sensitive');
    expect(getCellKind({ key: 'a', value: null })).toBe('empty');
    expect(getCellKind({ key: 'a', value: ['x', 1] })).toBe('list');
    expect(getCellKind({ key: 'a', value: [{ x: 1 }] })).toBe('json');
    expect(getCellKind({ key: 'a', value: { city: 'X' } })).toBe('record');
    expect(getCellKind({ key: 'a', value: { nested: { x: 1 } } })).toBe('json');
    expect(getCellKind({ key: 'a', value: true })).toBe('boolean');
    expect(getCellKind({ key: 'a', value: 3 })).toBe('number');
    expect(
      getCellKind({ key: 'a', value: '2026-01-01', schema: { format: 'date' } })
    ).toBe('date');
    expect(
      getCellKind({ key: 'created_at', value: '2026-01-01T00:00:00Z' })
    ).toBe('datetime');
    expect(getCellKind({ key: 'created_at', value: 'soon' })).toBe('text');
    expect(getCellKind({ key: 'status', value: 'ok' })).toBe('status');
    expect(
      getCellKind({ key: 'kind', value: 'a', schema: { enum: ['a'] } })
    ).toBe('status');
    expect(getCellKind({ key: 'name', value: 'Ana' })).toBe('text');
  });

  test('maps statuses to tones', () => {
    expect(statusTone('Active')).toBe('success');
    expect(statusTone('failed')).toBe('danger');
    expect(statusTone('in progress')).toBe('warning');
    expect(statusTone('draft')).toBe('info');
    expect(statusTone('whatever')).toBe('neutral');
  });

  test('humanizes keys and searches records', () => {
    expect(humanizeKey('created_at')).toBe('Created At');
    expect(humanizeKey('firstName')).toBe('First Name');
    expect(matchesSearch({ item: { name: 'Ana' }, query: ' an ' })).toBe(true);
    expect(matchesSearch({ item: { name: 'Ana' }, query: '' })).toBe(true);
    expect(matchesSearch({ item: { token: 'secret' }, query: 'sec' })).toBe(
      false
    );
    expect(matchesSearch({ item: { n: 15 }, query: '15' })).toBe(true);
  });
});

describe('form helpers', () => {
  test('reads JSON and multipart request bodies', () => {
    const json = getRequestBody({ operation: op('createClient'), spec });
    expect(json?.contentType).toBe('json');
    expect(json?.schema.required).toEqual(['name', 'email']);
    expect(json?.schema.properties?.status.default).toBe('active');
    const multipart = getRequestBody({ operation: op('uploadDocument'), spec });
    expect(multipart?.contentType).toBe('multipart');
    expect(
      getRequestBody({ operation: op('deleteClient'), spec })
    ).toBeUndefined();
  });

  test('resolves array item schemas of body properties', () => {
    const withArray: OpenApiSpec = {
      openapi: '3.1.0',
      paths: {
        '/x': {
          post: {
            operationId: 'x',
            requestBody: {
              content: {
                'application/vnd.api+json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tags: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Tag' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { Tag: { type: 'string', enum: ['a', 'b'] } } },
    };
    const operation = findOperation({ spec: withArray, operationId: 'x' })!;
    const body = getRequestBody({ operation, spec: withArray });
    expect(body?.schema.properties?.tags.items?.enum).toEqual(['a', 'b']);
    expect(
      getFieldKind({ name: 'tags', schema: body!.schema.properties!.tags })
    ).toBe('multiEnum');
  });

  test('picks a widget per schema', () => {
    const kind = (name: string, schema: FormField['schema']) => {
      return getFieldKind({ name, schema });
    };
    expect(kind('a', { type: 'string', 'x-widget': 'textarea' })).toBe(
      'textarea'
    );
    expect(kind('a', { type: 'string', enum: ['x'] })).toBe('enum');
    expect(kind('a', { type: 'object' })).toBe('json');
    expect(kind('a', { type: 'array', items: { type: 'string' } })).toBe(
      'json'
    );
    expect(kind('a', { type: 'boolean' })).toBe('boolean');
    expect(kind('a', { type: 'integer' })).toBe('integer');
    expect(kind('a', { type: 'number' })).toBe('number');
    expect(kind('a', { type: 'string', format: 'binary' })).toBe('file');
    expect(kind('a', { type: 'string', format: 'date' })).toBe('date');
    expect(kind('a', { type: 'string', format: 'date-time' })).toBe('datetime');
    expect(kind('a', { type: 'string', format: 'email' })).toBe('email');
    expect(kind('a', { type: 'string', format: 'uri' })).toBe('url');
    expect(kind('a', { type: 'string', format: 'password' })).toBe('password');
    expect(kind('password', { type: 'string' })).toBe('password');
    expect(kind('a', { type: 'string', maxLength: 1000 })).toBe('textarea');
    expect(kind('notes', { type: 'string' })).toBe('textarea');
    expect(kind('a', { type: 'string' })).toBe('text');
  });

  test('lists writable fields, optionally chosen by name', () => {
    const schema = resolveSchema({
      schema: { $ref: '#/components/schemas/Client' },
      spec,
    })!;
    expect(
      getFormFields({ schema }).map((f) => {
        return f.name;
      })
    ).toEqual([
      'name',
      'email',
      'status',
      'balance',
      'vip',
      'address',
      'tags',
      'birth_date',
    ]);
    const [name] = getFormFields({ schema, names: ['name', 'missing'] });
    expect(name).toMatchObject({
      name: 'name',
      label: 'Full name',
      required: false,
    });
  });

  test('initializes values from a record or defaults', () => {
    const fields = [
      field({ name: 'vip', kind: 'boolean' }),
      field({ name: 'tags', kind: 'multiEnum' }),
      field({ name: 'doc', kind: 'file' }),
      field({ name: 'meta', kind: 'json' }),
      field({ name: 'empty', kind: 'json' }),
      field({ name: 'at', kind: 'datetime' }),
      field({ name: 'bad', kind: 'datetime' }),
      field({ name: 'day', kind: 'date' }),
      field({ name: 'count', kind: 'integer' }),
      field({ name: 'status', kind: 'text', schema: { default: 'active' } }),
      field({ name: 'nothing', kind: 'text' }),
    ];
    const values = initFormValues({
      fields,
      record: {
        vip: true,
        tags: ['a', 1],
        meta: { a: 1 },
        empty: null,
        at: '2026-01-02T03:04:00',
        bad: 'nope',
        day: '2026-01-02T00:00:00Z',
        count: 3,
      },
    });
    expect(values).toEqual({
      vip: true,
      tags: ['a', '1'],
      doc: null,
      meta: '{\n  "a": 1\n}',
      empty: '',
      at: '2026-01-02T03:04',
      bad: '',
      day: '2026-01-02',
      count: '3',
      status: 'active',
      nothing: '',
    });
    expect(
      initFormValues({ fields: [field({ name: 'tags', kind: 'multiEnum' })] })
    ).toEqual({
      tags: [],
    });
  });

  test('validates values', () => {
    const parse = (
      f: Partial<FormField>,
      value: Parameters<typeof parseFieldValue>[0]['value']
    ) => {
      return parseFieldValue({ field: field(f), value });
    };
    expect(parse({ kind: 'boolean' }, false)).toEqual({
      ok: true,
      empty: false,
      value: false,
    });
    expect(parse({ required: true }, '')).toEqual({
      ok: false,
      error: { code: 'required' },
    });
    expect(parse({}, [])).toEqual({ ok: true, empty: true });
    expect(parse({ kind: 'multiEnum' }, ['a'])).toEqual({
      ok: true,
      empty: false,
      value: ['a'],
    });
    expect(parse({ kind: 'number' }, 'x')).toMatchObject({
      error: { code: 'invalidNumber' },
    });
    expect(parse({ kind: 'integer' }, '1.5')).toMatchObject({
      error: { code: 'notInteger' },
    });
    expect(
      parse({ kind: 'number', schema: { minimum: 1 } }, '0')
    ).toMatchObject({
      error: { code: 'minimum', limit: 1 },
    });
    expect(
      parse({ kind: 'number', schema: { maximum: 1 } }, '2')
    ).toMatchObject({
      error: { code: 'maximum', limit: 1 },
    });
    expect(parse({ kind: 'number' }, ' 2.5 ')).toEqual({
      ok: true,
      empty: false,
      value: 2.5,
    });
    expect(
      parse({ kind: 'json', schema: { type: 'object' } }, '{')
    ).toMatchObject({
      error: { code: 'invalidJson' },
    });
    expect(
      parse({ kind: 'json', schema: { type: 'array' } }, '{}')
    ).toMatchObject({
      error: { code: 'jsonType', expected: 'array' },
    });
    expect(
      parse({ kind: 'json', schema: { type: 'object' } }, '[]')
    ).toMatchObject({
      error: { code: 'jsonType', expected: 'object' },
    });
    expect(parse({ kind: 'json', schema: { type: 'array' } }, '[1]')).toEqual({
      ok: true,
      empty: false,
      value: [1],
    });
    expect(parse({ schema: { minLength: 3 } }, 'ab')).toMatchObject({
      error: { code: 'minLength', limit: 3 },
    });
    expect(parse({ schema: { maxLength: 1 } }, 'ab')).toMatchObject({
      error: { code: 'maxLength', limit: 1 },
    });
    expect(parse({ schema: { pattern: '^\\d+$' } }, 'ab')).toMatchObject({
      error: { code: 'pattern' },
    });
    expect(parse({ schema: { pattern: '(' } }, 'ab')).toEqual({
      ok: true,
      empty: false,
      value: 'ab',
    });
    expect(parse({ kind: 'datetime' }, '2026-01-02T03:04')).toEqual({
      ok: true,
      empty: false,
      value: new Date('2026-01-02T03:04').toISOString(),
    });
    expect(parse({ kind: 'datetime' }, 'soon')).toEqual({
      ok: true,
      empty: false,
      value: 'soon',
    });
    const file = new File(['x'], 'a.txt');
    expect(parse({ kind: 'file' }, file)).toEqual({
      ok: true,
      empty: false,
      value: file,
    });
  });

  test('builds create and patch bodies', () => {
    const fields = [
      field({ name: 'name', required: true }),
      field({ name: 'notes' }),
      field({ name: 'balance', kind: 'number' }),
    ];
    expect(
      buildRequestBody({
        fields,
        values: { name: 'Ana', notes: '', balance: '10' },
      })
    ).toEqual({ ok: true, body: { name: 'Ana', balance: 10 } });
    expect(buildRequestBody({ fields, values: {} })).toEqual({
      ok: false,
      errors: { name: { code: 'required' } },
    });
    expect(
      buildRequestBody({
        fields,
        values: { name: 'Ana', notes: '', balance: '20' },
        initial: { name: 'Ana', notes: 'old', balance: '10' },
        patch: true,
      })
    ).toEqual({ ok: true, body: { notes: null, balance: 20 } });
  });

  test('converts bodies to FormData', () => {
    const file = new File(['x'], 'a.txt');
    const formData = toFormData({
      file,
      tags: ['a', 'b'],
      meta: { a: 1 },
      count: 2,
      none: null,
    });
    expect(formData.get('file')).toBeInstanceOf(File);
    expect(formData.getAll('tags')).toEqual(['a', 'b']);
    expect(formData.get('meta')).toBe('{"a":1}');
    expect(formData.get('count')).toBe('2');
    expect(formData.has('none')).toBe(false);
  });
});

describe('detail helpers', () => {
  test('unwraps single-record envelopes', () => {
    expect(extractRecord({ data: { id: 1 } })).toEqual({ id: 1 });
    expect(extractRecord({ id: 1, data: { x: 1 }, a: 1 })).toEqual({
      id: 1,
      data: { x: 1 },
      a: 1,
    });
    expect(extractRecord([1])).toBeUndefined();
  });

  test('gets the record schema, unwrapping envelopes', () => {
    expect(
      Object.keys(
        getRecordSchema({ operation: op('getClient'), spec })?.properties ?? {}
      )
    ).toContain('api_key');
    const wrapped: OpenApiSpec = {
      ...spec,
      paths: {
        '/x': {
          get: {
            operationId: 'getX',
            responses: {
              '200': {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Order' },
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
    const operation = findOperation({ spec: wrapped, operationId: 'getX' })!;
    expect(
      Object.keys(
        getRecordSchema({ operation, spec: wrapped })?.properties ?? {}
      )
    ).toEqual(['id', 'total', 'status']);
  });

  test('lists detail fields', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, title: 'Name' },
        password: { type: 'string' as const, writeOnly: true },
        api_key: { type: 'string' as const },
      },
    };
    expect(
      getDetailFields({ schema, record: { name: 'a', extra: 1 } }).map((f) => {
        return [f.key, f.label, f.sensitive];
      })
    ).toEqual([
      ['name', 'Name', false],
      ['api_key', 'Api Key', true],
      ['extra', 'Extra', false],
    ]);
    expect(getDetailFields({ keys: ['extra'] })).toEqual([
      { key: 'extra', label: 'Extra', schema: undefined, sensitive: false },
    ]);
  });

  test('labels records', () => {
    expect(recordLabel({ name: 'Ana', id: 1 })).toBe('Ana');
    expect(recordLabel({ id: 7 })).toBe('7');
    expect(recordLabel({ other: true })).toBeUndefined();
  });

  test('finds sibling operations', () => {
    const sibling = findSiblingOperation({
      spec,
      operation: op('updateClient'),
      method: 'get',
    });
    expect(sibling?.operation.operationId).toBe('getClient');
    expect(sibling?.operation.parameters?.[0].name).toBe('client_id');
    expect(
      findSiblingOperation({
        spec,
        operation: op('listClients'),
        method: 'delete',
      })
    ).toBeUndefined();
  });
});
