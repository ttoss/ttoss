import type { OpenApiSpec } from '../../src/core/types';

/**
 * A small Clients API covering what the components derive from a spec:
 * `$ref`, `allOf`, readOnly fields, enums, path-level params, a paginated
 * wrapper with server query params, and a multipart upload.
 */
export const spec: OpenApiSpec = {
  openapi: '3.1.0',
  info: { title: 'Clients API', version: '1.0.0' },
  paths: {
    '/clients': {
      get: {
        operationId: 'listClients',
        summary: 'Clients',
        responses: {
          '200': {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Client' },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createClient',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClientInput' },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/clients/{client_id}': {
      parameters: [
        {
          name: 'client_id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      get: {
        operationId: 'getClient',
        responses: {
          '200': {
            description: 'ok',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Client' },
              },
            },
          },
        },
      },
      patch: {
        operationId: 'updateClient',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClientFields' },
            },
          },
        },
        responses: { '200': { description: 'ok' } },
      },
      put: {
        operationId: 'replaceClient',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClientInput' },
            },
          },
        },
        responses: { '200': { description: 'ok' } },
      },
      delete: {
        operationId: 'deleteClient',
        responses: { '204': { description: 'deleted' } },
      },
    },
    '/clients/{client_id}/documents': {
      post: {
        operationId: 'uploadDocument',
        parameters: [
          {
            name: 'client_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  label: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/orders': {
      get: {
        operationId: 'listOrders',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Page' },
                    {
                      type: 'object',
                      properties: {
                        data: { items: { $ref: '#/components/schemas/Order' } },
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
  components: {
    schemas: {
      ClientStatus: { type: 'string', enum: ['active', 'pending', 'blocked'] },
      Address: {
        type: 'object',
        properties: { city: { type: 'string' }, state: { type: 'string' } },
      },
      ClientFields: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          status: {
            $ref: '#/components/schemas/ClientStatus',
            default: 'active',
          },
          balance: { type: 'number', minimum: 0 },
          vip: { type: 'boolean' },
          notes: { type: 'string' },
        },
      },
      ClientInput: {
        allOf: [
          { $ref: '#/components/schemas/ClientFields' },
          { required: ['name', 'email'] },
        ],
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          name: { type: 'string', title: 'Full name' },
          email: { type: 'string', format: 'email' },
          status: { $ref: '#/components/schemas/ClientStatus' },
          balance: { type: 'number' },
          vip: { type: 'boolean' },
          api_key: { type: 'string', readOnly: true },
          address: { $ref: '#/components/schemas/Address' },
          tags: { type: 'array', items: { type: 'string' } },
          birth_date: { type: 'string', format: 'date' },
          created_at: { type: 'string', format: 'date-time', readOnly: true },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          total: { type: 'number' },
          status: { type: 'string', enum: ['paid', 'pending', 'failed'] },
        },
      },
      Page: {
        type: 'object',
        properties: {
          data: { type: 'array' },
          total: { type: 'integer' },
        },
      },
    },
  },
};

export const clients = [
  {
    id: 'c1',
    name: 'Ana Silva',
    email: 'ana@example.com',
    status: 'active',
    balance: 1500,
    vip: true,
    api_key: 'sk_live_123',
    address: { city: 'Recife', state: 'PE' },
    tags: ['gold'],
    created_at: '2026-01-02T10:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'Bruno Costa',
    email: 'bruno@example.com',
    status: 'pending',
    balance: 20,
    vip: false,
    api_key: 'sk_live_456',
    address: { city: 'Natal', state: 'RN' },
    tags: [],
    created_at: '2026-02-03T10:00:00.000Z',
  },
  {
    id: 'c3',
    name: 'Carla Rocha',
    email: 'carla@example.com',
    status: 'blocked',
    balance: 300,
    vip: false,
    api_key: 'sk_live_789',
    address: null,
    tags: ['silver', 'new'],
    created_at: '2026-03-04T10:00:00.000Z',
  },
];
