import type { Fetcher, FetcherRequest } from '../../../src';
import { OpenApiRequestError } from '../../../src';
import { clients as seed, spec } from '../fixtures';

type Client = (typeof seed)[number];

type Order = { id: string; total: number; status: string };

type Db = { clients: Client[]; orders: Order[] };

type Route = {
  method: FetcherRequest['method'];
  path: RegExp;
  handle: (args: {
    db: Db;
    request: FetcherRequest;
    match: RegExpMatchArray;
    query: URLSearchParams;
  }) => unknown;
};

const notFound = () => {
  return new OpenApiRequestError({
    status: 404,
    body: { message: 'Client not found' },
    message: 'Client not found',
  });
};

const findClient = ({ db, id }: { db: Db; id: string }): Client => {
  const client = db.clients.find((c) => {
    return c.id === id;
  });
  if (!client) {
    throw notFound();
  }
  return client;
};

const createClient = ({ db, request }: { db: Db; request: FetcherRequest }) => {
  const body = request.body as Partial<Client>;
  const taken = db.clients.some((c) => {
    return c.email === body.email;
  });
  if (taken) {
    throw new OpenApiRequestError({
      status: 422,
      body: { errors: [{ field: 'email', message: 'Email already in use.' }] },
      message: 'Validation failed',
    });
  }
  const created = {
    ...db.clients[0],
    ...body,
    id: `c${db.clients.length + 1}`,
  };
  db.clients.push(created);
  return created;
};

const listOrders = ({ db, query }: { db: Db; query: URLSearchParams }) => {
  const q = query.get('q') ?? '';
  const status = query.get('status');
  const filtered = db.orders.filter((o) => {
    return o.id.includes(q) && (!status || o.status === status);
  });
  const limit = Number(query.get('limit') ?? 10);
  const offset = Number(query.get('offset') ?? 0);
  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
};

const ROUTES: Route[] = [
  {
    method: 'get',
    path: /^\/openapi\.json$/,
    handle: () => {
      return spec;
    },
  },
  {
    method: 'get',
    path: /^\/clients$/,
    handle: ({ db }) => {
      return db.clients;
    },
  },
  { method: 'post', path: /^\/clients$/, handle: createClient },
  {
    method: 'get',
    path: /^\/clients\/([^/]+)$/,
    handle: ({ db, match }) => {
      return findClient({ db, id: match[1] });
    },
  },
  ...(['patch', 'put'] as const).map((method): Route => {
    return {
      method,
      path: /^\/clients\/([^/]+)$/,
      handle: ({ db, match, request }) => {
        return Object.assign(findClient({ db, id: match[1] }), request.body);
      },
    };
  }),
  {
    method: 'delete',
    path: /^\/clients\/([^/]+)$/,
    handle: ({ db, match }) => {
      const client = findClient({ db, id: match[1] });
      db.clients = db.clients.filter((c) => {
        return c !== client;
      });
      return undefined;
    },
  },
  {
    method: 'post',
    path: /^\/clients\/[^/]+\/documents$/,
    handle: () => {
      return { ok: true };
    },
  },
  { method: 'get', path: /^\/orders$/, handle: listOrders },
];

/**
 * An in-memory API for the fixture spec. Every request is recorded in
 * `requests` so tests can assert what the components sent.
 */
export const createFakeApi = () => {
  const db: Db = {
    clients: seed.map((c) => {
      return { ...c };
    }),
    orders: Array.from({ length: 25 }, (_, i) => {
      return {
        id: `o${i + 1}`,
        total: (i + 1) * 10,
        status: i % 2 === 0 ? 'paid' : 'pending',
      };
    }),
  };
  const requests: FetcherRequest[] = [];

  const fetcher = jest.fn<ReturnType<Fetcher>, Parameters<Fetcher>>(
    async (request) => {
      requests.push(request);
      const url = new URL(request.url, 'http://test');
      for (const route of ROUTES) {
        const match = url.pathname.match(route.path);
        if (match && route.method === request.method) {
          return route.handle({ db, request, match, query: url.searchParams });
        }
      }
      throw new Error('Service unavailable');
    }
  );

  return { fetcher, requests };
};
