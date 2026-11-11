import type { OpenApiSpec } from '@ttoss/react-openapi';

/**
 * The "Clients API" spec shared by the `@ttoss/react-openapi` stories. Its
 * in-memory implementation is in `fakeApi.ts`.
 */

export const STATUSES = ['active', 'pending', 'inactive', 'cancelled'];
export const TAGS = ['enterprise', 'startup', 'government', 'nonprofit'];
export const ORDER_STATUSES = ['paid', 'processing', 'failed', 'refunded'];

const clientPathParam = {
  name: 'client_id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
};

const json = (schema: object) => {
  return { content: { 'application/json': { schema } } };
};

export const spec: OpenApiSpec = {
  openapi: '3.1.0',
  info: { title: 'Clients API', version: '1.0.0' },
  paths: {
    '/api/v1/clients': {
      get: {
        operationId: 'listClients',
        summary: 'List clients',
        tags: ['Clients'],
        responses: {
          '200': json({
            type: 'array',
            items: { $ref: '#/components/schemas/Client' },
          }),
        },
      },
      post: {
        operationId: 'createClient',
        summary: 'Create a client',
        tags: ['Clients'],
        requestBody: json({ $ref: '#/components/schemas/ClientInput' }),
        responses: { '201': json({ $ref: '#/components/schemas/Client' }) },
      },
    },
    '/api/v1/clients/{client_id}': {
      parameters: [clientPathParam],
      get: {
        operationId: 'getClient',
        summary: 'Get a client',
        tags: ['Clients'],
        responses: { '200': json({ $ref: '#/components/schemas/Client' }) },
      },
      patch: {
        operationId: 'updateClient',
        summary: 'Update a client',
        tags: ['Clients'],
        requestBody: json({ $ref: '#/components/schemas/ClientUpdate' }),
        responses: { '200': json({ $ref: '#/components/schemas/Client' }) },
      },
      delete: {
        operationId: 'deleteClient',
        summary: 'Delete a client',
        tags: ['Clients'],
        responses: { '204': {} },
      },
    },
    '/api/v1/clients/{client_id}/send-email': {
      parameters: [clientPathParam],
      post: {
        operationId: 'sendClientEmail',
        summary: 'Send an email to a client',
        tags: ['Clients'],
        requestBody: json({
          type: 'object',
          required: ['subject', 'message'],
          properties: {
            subject: { type: 'string', maxLength: 120 },
            message: { type: 'string' },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high'],
              default: 'normal',
            },
            send_at: {
              type: 'string',
              format: 'date-time',
              description: 'Leave empty to send now.',
            },
          },
        }),
        responses: { '202': json({ type: 'object' }) },
      },
    },
    '/api/v1/clients/{client_id}/documents': {
      parameters: [clientPathParam],
      post: {
        operationId: 'uploadClientDocument',
        summary: 'Upload a document',
        tags: ['Clients'],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', title: 'Document' },
                  kind: { type: 'string', enum: ['contract', 'invoice', 'id'] },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': json({ type: 'object' }) },
      },
    },
    '/api/v1/orders': {
      get: {
        operationId: 'listOrders',
        summary: 'List orders',
        tags: ['Orders'],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: { $ref: '#/components/schemas/OrderStatus' },
          },
        ],
        responses: {
          '200': json({
            allOf: [
              { $ref: '#/components/schemas/Page' },
              {
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            ],
          }),
        },
      },
    },
    '/api/v1/failing': {
      get: { operationId: 'listFailing', responses: { '200': {} } },
    },
  },
  components: {
    schemas: {
      Page: {
        type: 'object',
        properties: { data: { type: 'array' }, total: { type: 'integer' } },
      },
      ClientStatus: { type: 'string', enum: STATUSES },
      Address: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          state: { type: 'string' },
        },
      },
      Client: {
        type: 'object',
        required: ['id', 'name', 'email'],
        properties: {
          id: { type: 'string', title: 'ID', readOnly: true },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          status: { $ref: '#/components/schemas/ClientStatus' },
          balance: { type: 'number' },
          vip: { type: 'boolean', title: 'VIP' },
          birth_date: { type: 'string', format: 'date' },
          tags: {
            type: 'array',
            items: { type: 'string', enum: TAGS },
          },
          notes: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' },
          api_key: { type: 'string', readOnly: true },
          created_at: { type: 'string', format: 'date-time', readOnly: true },
        },
      },
      // Writable fields, shared by create (with `required`) and update.
      ClientFields: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, example: 'Ana Silva' },
          email: {
            type: 'string',
            format: 'email',
            description: 'Used for invoices. Must be unique.',
          },
          status: {
            $ref: '#/components/schemas/ClientStatus',
            default: 'pending',
          },
          balance: { type: 'number', minimum: 0 },
          vip: { type: 'boolean', title: 'VIP' },
          birth_date: { type: 'string', format: 'date' },
          tags: {
            type: 'array',
            items: { type: 'string', enum: TAGS },
          },
          notes: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' },
        },
      },
      ClientInput: {
        allOf: [
          { $ref: '#/components/schemas/ClientFields' },
          { required: ['name', 'email'] },
        ],
      },
      ClientUpdate: { $ref: '#/components/schemas/ClientFields' },
      OrderStatus: { type: 'string', enum: ORDER_STATUSES },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', title: 'Order' },
          customer: { type: 'string' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          items: { type: 'integer' },
          total: { type: 'number', title: 'Total (USD)' },
          due_date: { type: 'string', format: 'date' },
        },
      },
    },
  },
};
