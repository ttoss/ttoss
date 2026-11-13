import {
  type Fetcher,
  type FetcherRequest,
  type HttpMethod,
  type JsonObject,
  OpenApiRequestError,
} from '@ttoss/react-openapi';

import { ORDER_STATUSES, spec, STATUSES, TAGS } from './fixtures';

/**
 * An in-memory fake of the "Clients API" in `fixtures.ts`. It is what an
 * app's `fetcher` would be: here it answers from memory instead of calling a
 * server.
 */

// ─── Seed data ───────────────────────────────────────────────────────────────

const FIRST = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elisa',
  'Fábio',
  'Gabi',
  'Hugo',
];
const LAST = ['Silva', 'Souza', 'Lima', 'Costa', 'Rocha', 'Alves'];
const CITIES = [
  ['São Paulo', 'SP'],
  ['Recife', 'PE'],
  ['Curitiba', 'PR'],
  ['Belém', 'PA'],
];

const seedClients = (): JsonObject[] => {
  return Array.from({ length: 37 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`;
    const [city, state] = CITIES[i % CITIES.length];
    return {
      id: `cli_${String(1000 + i)}`,
      name,
      email: `${name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z]+/g, '.')}${i}@example.com`,
      status: STATUSES[(i * 7) % STATUSES.length],
      balance: Math.round(((i * 7919) % 50000) * 1.37) / 100,
      vip: i % 4 === 0,
      birth_date: `19${70 + (i % 30)}-0${1 + (i % 9)}-1${i % 9}`,
      tags: [TAGS[i % TAGS.length]],
      notes:
        i % 3 === 0
          ? 'Prefers contact by email. Renewal negotiated for next quarter.'
          : null,
      address: { city, state },
      api_key: `sk_live_${i}f9a2c71e`,
      created_at: new Date(
        Date.UTC(2026, 0, 1 + i * 8, 9 + (i % 9))
      ).toISOString(),
    };
  });
};

const orders: JsonObject[] = Array.from({ length: 124 }, (_, i) => {
  return {
    id: `ord_${String(5000 + i)}`,
    customer: `${FIRST[(i * 3) % FIRST.length]} ${LAST[i % LAST.length]}`,
    status: ORDER_STATUSES[(i * 3 + (i % 5)) % ORDER_STATUSES.length],
    items: 1 + ((i * 13) % 9),
    total: Math.round(((i * 104729) % 90000) + 1500) / 100,
    due_date: new Date(Date.UTC(2026, 10, 1 + (i % 28)))
      .toISOString()
      .slice(0, 10),
  };
});

// ─── Fake API ────────────────────────────────────────────────────────────────

const wait = (ms: number, signal?: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
};

const notFound = () => {
  return new OpenApiRequestError({
    status: 404,
    body: { message: 'Client not found.' },
    message: 'Client not found.',
  });
};

export type FakeApiLog = (entry: string) => void;

type Db = { clients: JsonObject[]; nextId: number };

type Handler = (args: {
  db: Db;
  method: HttpMethod;
  body: unknown;
  id?: string;
  sub?: string;
  query: URLSearchParams;
}) => unknown;

const findClient = ({ db, id }: { db: Db; id?: string }): JsonObject => {
  const client = db.clients.find((c) => {
    return c.id === id;
  });
  if (!client) {
    throw notFound();
  }
  return client;
};

const createClient: Handler = ({ db, body }) => {
  const input = body as JsonObject;
  const taken = db.clients.some((c) => {
    return c.email === input.email;
  });
  if (taken) {
    throw new OpenApiRequestError({
      status: 422,
      body: { errors: [{ field: 'email', message: 'Email already in use.' }] },
      message: 'Validation failed.',
    });
  }
  db.nextId += 1;
  const created = {
    id: `cli_${db.nextId}`,
    ...input,
    api_key: `sk_live_${db.nextId}new`,
    created_at: new Date().toISOString(),
  };
  db.clients = [created, ...db.clients];
  return created;
};

const CLIENT_METHODS: Partial<Record<HttpMethod, Handler>> = {
  get: ({ db, id }) => {
    return findClient({ db, id });
  },
  patch: ({ db, id, body }) => {
    const updated = { ...findClient({ db, id }), ...(body as JsonObject) };
    db.clients = db.clients.map((c) => {
      return c.id === id ? updated : c;
    });
    return updated;
  },
  delete: ({ db, id }) => {
    findClient({ db, id });
    db.clients = db.clients.filter((c) => {
      return c.id !== id;
    });
    return undefined;
  },
};

const CLIENT_ACTIONS: Record<string, unknown> = {
  '/send-email': { queued: true },
  '/documents': { uploaded: true },
};

const clientRoute: Handler = (args) => {
  findClient(args);
  if (args.sub) {
    return CLIENT_ACTIONS[args.sub];
  }
  return CLIENT_METHODS[args.method]?.(args);
};

const matchesOrder = ({
  order,
  q,
  status,
}: {
  order: JsonObject;
  q: string;
  status: string | null;
}): boolean => {
  if (status && order.status !== status) {
    return false;
  }
  return (
    !q ||
    String(order.id).includes(q) ||
    String(order.customer).toLowerCase().includes(q)
  );
};

const listOrders: Handler = ({ query }) => {
  const q = (query.get('q') ?? '').toLowerCase();
  const status = query.get('status');
  const limit = Number(query.get('limit') ?? 20);
  const offset = Number(query.get('offset') ?? 0);
  const matching = orders.filter((order) => {
    return matchesOrder({ order, q, status });
  });
  return {
    data: matching.slice(offset, offset + limit),
    total: matching.length,
  };
};

const ROUTES: Record<string, Handler> = {
  'get /api/v1/openapi.json': () => {
    return spec;
  },
  'get /api/v1/clients': ({ db }) => {
    return db.clients;
  },
  'post /api/v1/clients': createClient,
  'get /api/v1/orders': listOrders,
};

const CLIENT_PATH = /^\/api\/v1\/clients\/([^/]+)(\/.*)?$/;

const describeRequest = ({ method, url, body }: FetcherRequest): string => {
  if (body instanceof FormData) {
    return `${method.toUpperCase()} ${url}  multipart: ${Array.from(body.keys()).join(', ')}`;
  }
  const payload = body === undefined ? '' : `  ${JSON.stringify(body)}`;
  return `${method.toUpperCase()} ${url}${payload}`;
};

const unavailable = () => {
  return new OpenApiRequestError({
    status: 503,
    body: null,
    message: 'Service temporarily unavailable (503).',
  });
};

/**
 * An in-memory implementation of the spec in `fixtures.ts`, with its own copy
 * of the data so each story starts fresh. `onRequest` receives a one-line
 * summary of every request, so stories can show what the components sent.
 */
export const createFakeApi = ({
  latency = 500,
  emptyClients = false,
  onRequest,
}: {
  latency?: number;
  emptyClients?: boolean;
  onRequest?: FakeApiLog;
} = {}): Fetcher => {
  const db: Db = { clients: emptyClients ? [] : seedClients(), nextId: 2000 };

  return async (request) => {
    onRequest?.(describeRequest(request));
    await wait(latency, request.signal);
    const { pathname, searchParams } = new URL(
      request.url,
      'http://fake.local'
    );
    const args = {
      db,
      method: request.method,
      body: request.body,
      query: searchParams,
    };
    const route = ROUTES[`${request.method} ${pathname}`];
    if (route) {
      return route(args);
    }
    const clientMatch = pathname.match(CLIENT_PATH);
    if (clientMatch) {
      return clientRoute({ ...args, id: clientMatch[1], sub: clientMatch[2] });
    }
    throw unavailable();
  };
};
