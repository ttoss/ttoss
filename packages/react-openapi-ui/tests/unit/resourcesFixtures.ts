import type {
  Fetcher,
  FetcherRequest,
  JsonObject,
  OpenApiSpec,
} from '../../src';
import { OpenApiRequestError } from '../../src';

const json = (schema: object) => {
  return { content: { 'application/json': { schema } } };
};

const pathParam = (name: string) => {
  return { name, in: 'path', required: true, schema: { type: 'string' } };
};

/**
 * A "Shop API" exercising what `parseResources` reads: tags, a `/api/v1`
 * prefix, PUT and PATCH on one path, item and collection actions, a
 * sub-resource read, a path nested under a parent, an untagged operation, an
 * `x-ref` between resources and paths outside the prefix.
 */
export const shopSpec: OpenApiSpec = {
  openapi: '3.1.0',
  info: { title: 'Shop API', version: '1.0.0' },
  paths: {
    '/api/v1/clients': {
      get: {
        operationId: 'listClients',
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
        tags: ['Clients'],
        requestBody: json({
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' } },
        }),
        responses: { '201': json({ $ref: '#/components/schemas/Client' }) },
      },
    },
    '/api/v1/clients/import': {
      post: {
        operationId: 'importClients',
        tags: ['Clients'],
        requestBody: json({
          type: 'object',
          properties: { csv: { type: 'string' } },
        }),
        responses: { '202': json({ type: 'object' }) },
      },
    },
    '/api/v1/clients/{client_id}': {
      parameters: [pathParam('client_id')],
      get: {
        operationId: 'getClient',
        tags: ['Clients'],
        responses: { '200': json({ $ref: '#/components/schemas/Client' }) },
      },
      put: {
        operationId: 'replaceClient',
        tags: ['Clients'],
        requestBody: json({
          type: 'object',
          properties: { name: { type: 'string' } },
        }),
        responses: { '200': json({ $ref: '#/components/schemas/Client' }) },
      },
      patch: {
        operationId: 'updateClient',
        tags: ['Clients'],
        requestBody: json({
          type: 'object',
          properties: { name: { type: 'string' } },
        }),
        responses: { '200': json({ $ref: '#/components/schemas/Client' }) },
      },
      post: {
        operationId: 'touchClient',
        tags: ['Clients'],
        responses: { '200': json({ type: 'object' }) },
      },
      delete: {
        operationId: 'deleteClient',
        tags: ['Clients'],
        responses: { '204': {} },
      },
    },
    '/api/v1/clients/{client_id}/send-email': {
      parameters: [pathParam('client_id')],
      post: {
        operationId: 'sendClientEmail',
        tags: ['Clients'],
        requestBody: json({
          type: 'object',
          required: ['subject'],
          properties: { subject: { type: 'string' } },
        }),
        responses: { '202': json({ type: 'object' }) },
      },
    },
    '/api/v1/clients/{client_id}/orders': {
      parameters: [pathParam('client_id')],
      get: {
        operationId: 'listClientOrders',
        tags: ['Clients'],
        responses: { '200': json({ type: 'array' }) },
      },
    },
    '/api/v1/orders': {
      get: {
        operationId: 'listOrders',
        tags: ['Orders'],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': json({
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Order' },
              },
              total: { type: 'integer' },
            },
          }),
        },
      },
      post: {
        operationId: 'createOrder',
        tags: ['Orders'],
        requestBody: json({
          type: 'object',
          required: ['client_id'],
          properties: {
            client_id: { type: 'string', 'x-ref': 'clients' },
            total: { type: 'number' },
          },
        }),
        responses: { '201': json({ $ref: '#/components/schemas/Order' }) },
      },
    },
    '/api/v1/orders/{order_id}': {
      parameters: [pathParam('order_id')],
      get: {
        operationId: 'getOrder',
        tags: ['Orders'],
        responses: { '200': json({ $ref: '#/components/schemas/Order' }) },
      },
    },
    '/api/v1/projects/{project_id}/notes': {
      parameters: [pathParam('project_id')],
      get: {
        operationId: 'listNotes',
        tags: ['Notes'],
        responses: {
          '200': json({ type: 'array', items: { type: 'object' } }),
        },
      },
    },
    '/api/v1/health': {
      get: {
        operationId: 'getHealth',
        responses: { '200': json({ type: 'object' }) },
      },
    },
    '/api/v1/untracked': {
      get: { responses: { '200': {} } } as never,
    },
    '/oauth/token': {
      post: {
        operationId: 'issueToken',
        tags: ['Auth'],
        responses: { '200': json({ type: 'object' }) },
      },
    },
  },
  components: {
    schemas: {
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          name: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          client_id: { type: 'string', title: 'Client', 'x-ref': 'clients' },
          total: { type: 'number' },
        },
      },
    },
  },
};

type Db = { clients: JsonObject[]; orders: JsonObject[] };

const notFound = () => {
  return new OpenApiRequestError({
    status: 404,
    body: null,
    message: 'Not found',
  });
};

const findIn = ({ list, id }: { list: JsonObject[]; id: string }) => {
  const found = list.find((record) => {
    return record.id === id;
  });
  if (!found) {
    throw notFound();
  }
  return found;
};

type Handler = (args: {
  db: Db;
  request: FetcherRequest;
  match: RegExpMatchArray;
  query: URLSearchParams;
}) => unknown;

const ROUTES: Array<[string, RegExp, Handler]> = [
  [
    'get',
    /^\/api\/v1\/clients$/,
    ({ db }) => {
      return db.clients;
    },
  ],
  [
    'post',
    /^\/api\/v1\/clients$/,
    ({ db, request }) => {
      const created = {
        id: `cli_${db.clients.length + 1}`,
        ...(request.body as JsonObject),
      };
      db.clients.push(created);
      return created;
    },
  ],
  [
    'post',
    /^\/api\/v1\/clients\/import$/,
    () => {
      return { queued: true };
    },
  ],
  [
    'get',
    /^\/api\/v1\/clients\/([^/]+)$/,
    ({ db, match }) => {
      return findIn({ list: db.clients, id: match[1] });
    },
  ],
  [
    'patch',
    /^\/api\/v1\/clients\/([^/]+)$/,
    ({ db, match, request }) => {
      return Object.assign(
        findIn({ list: db.clients, id: match[1] }),
        request.body
      );
    },
  ],
  [
    'delete',
    /^\/api\/v1\/clients\/([^/]+)$/,
    ({ db, match }) => {
      findIn({ list: db.clients, id: match[1] });
      db.clients = db.clients.filter((client) => {
        return client.id !== match[1];
      });
      return undefined;
    },
  ],
  [
    'post',
    /^\/api\/v1\/clients\/([^/]+)\/send-email$/,
    () => {
      return { queued: true };
    },
  ],
  [
    'get',
    /^\/api\/v1\/orders$/,
    ({ db, query }) => {
      const limit = Number(query.get('limit') ?? 10);
      return { data: db.orders.slice(0, limit), total: db.orders.length };
    },
  ],
  [
    'post',
    /^\/api\/v1\/orders$/,
    ({ db, request }) => {
      const created = {
        id: `ord_${db.orders.length + 1}`,
        ...(request.body as JsonObject),
      };
      db.orders.push(created);
      // No id comes back on purpose: the screen falls back to the list.
      return { ok: true };
    },
  ],
  [
    'get',
    /^\/api\/v1\/orders\/([^/]+)$/,
    ({ db, match }) => {
      return findIn({ list: db.orders, id: match[1] });
    },
  ],
  [
    'get',
    /^\/api\/v1\/projects\/([^/]+)\/notes$/,
    ({ match }) => {
      return [{ id: 'n1', title: `Note of ${match[1]}` }];
    },
  ],
];

/** An in-memory implementation of `shopSpec`, recording every request. */
export const createShopApi = () => {
  const db: Db = {
    clients: [
      { id: 'cli_1', name: 'Ana Silva' },
      { id: 'cli_2', name: 'Bruno Costa' },
    ],
    orders: [
      { id: 'ord_1', client_id: 'cli_1', total: 120 },
      { id: 'ord_2', client_id: 'cli_9', total: 80 },
    ],
  };
  const requests: FetcherRequest[] = [];
  const fetcher = jest.fn<ReturnType<Fetcher>, Parameters<Fetcher>>(
    async (request) => {
      requests.push(request);
      const url = new URL(request.url, 'http://test');
      for (const [method, path, handle] of ROUTES) {
        const match = url.pathname.match(path);
        if (match && method === request.method) {
          return handle({ db, request, match, query: url.searchParams });
        }
      }
      throw new Error(`No route for ${request.method} ${url.pathname}`);
    }
  );
  return { db, fetcher, requests };
};
