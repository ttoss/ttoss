import {
  type ApiResource,
  type Fetcher,
  type FetcherRequest,
  type JsonObject,
  OpenApiRequestError,
  type OpenApiSpec,
  parseResources,
} from '@ttoss/react-openapi-ui';

import { ID_PREFIX, SEEDS } from './soatSeeds';
import rawSoatSpec from './soatSpec.json';

/**
 * A slice of the SOAT REST API spec, unchanged: the Projects, Policies,
 * Guardrails, Model Routes, AI Providers, Agents, Actors and Evaluations
 * operations of the bundle published at https://soat.ttoss.dev/docs/openapi-specs
 * (`openapi.json`, v0.114.0), with every component they reference. It keeps
 * the traits of the real spec: parameters declared by `$ref`
 * (`#/components/parameters/Limit`), cursor-paginated lists
 * (`allOf: [Page, { data }]` with `next_cursor`), `project_id` as a query
 * param, `x-soat-ref` on ids and on arrays of ids, and a tag holding two
 * collections (Evaluations: `/datasets` and `/evals`).
 */
export const soatSpec = rawSoatSpec as unknown as OpenApiSpec;

// ─── Fake API ────────────────────────────────────────────────────────────────

const soatError = ({
  status,
  code,
  message,
}: {
  status: number;
  code: string;
  message: string;
}) => {
  return new OpenApiRequestError({
    status,
    body: { error: { code, message } },
    message,
  });
};

const wait = (ms: number, signal?: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
};

/** `/api/v1/agents/{agent_id}` → a regex capturing the path params. */
const toMatcher = (pathTemplate: string): RegExp => {
  const pattern = pathTemplate
    .split('/')
    .map((segment) => {
      return segment.startsWith('{') ? '([^/]+)' : segment;
    })
    .join('/');
  return new RegExp(`^${pattern}$`);
};

type Table = { resource: ApiResource; rows: JsonObject[] };

/**
 * `{ data, next_cursor }`, the SOAT `Page`: `limit` rows after `cursor`
 * (here an opaque string holding the offset), filtered by `project_id`.
 */
const listPage = ({
  table,
  query,
}: {
  table: Table;
  query: URLSearchParams;
}): JsonObject => {
  const project = query.get('project_id');
  const rows = project
    ? table.rows.filter((row) => {
        return row.project_id === project;
      })
    : table.rows;
  const limit = Math.min(Number(query.get('limit') ?? 50), 100);
  const cursor = query.get('cursor');
  const offset = cursor ? Number(atob(cursor).replace('offset:', '')) : 0;
  const next = offset + limit;
  return {
    data: rows.slice(offset, next),
    next_cursor: next < rows.length ? btoa(`offset:${next}`) : null,
  };
};

const findRow = ({ table, id }: { table: Table; id: string }): JsonObject => {
  const row = table.rows.find((r) => {
    return r.id === id;
  });
  if (!row) {
    throw soatError({
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: `${table.resource.label} ${id} not found.`,
    });
  }
  return row;
};

const describeRequest = ({ method, url, body }: FetcherRequest): string => {
  const payload = body === undefined ? '' : `  ${JSON.stringify(body)}`;
  return `${method.toUpperCase()} ${url}${payload}`;
};

type Route = { match: RegExp; table: Table; kind: 'collection' | 'item' };

const buildRoutes = (tables: Table[]): Route[] => {
  return tables.flatMap((table) => {
    const { list, get } = table.resource;
    return [
      ...(list
        ? [
            {
              match: toMatcher(list.pathTemplate),
              table,
              kind: 'collection' as const,
            },
          ]
        : []),
      ...(get
        ? [{ match: toMatcher(get.pathTemplate), table, kind: 'item' as const }]
        : []),
    ];
  });
};

const handleCollection = ({
  table,
  request,
  query,
  nextId,
}: {
  table: Table;
  request: FetcherRequest;
  query: URLSearchParams;
  nextId: () => number;
}): unknown => {
  if (request.method === 'get') {
    return listPage({ table, query });
  }
  const input = (request.body ?? {}) as JsonObject;
  const now = new Date().toISOString();
  const created: JsonObject = {
    id: `${ID_PREFIX[table.resource.key] ?? 'rec'}_${nextId()}`,
    ...(table.resource.key === 'projects'
      ? {}
      : { project_id: query.get('project_id') ?? null }),
    ...input,
    created_at: now,
    updated_at: now,
  };
  table.rows = [created, ...table.rows];
  return created;
};

const handleItem = ({
  table,
  request,
  id,
}: {
  table: Table;
  request: FetcherRequest;
  id: string;
}): unknown => {
  const row = findRow({ table, id });
  if (request.method === 'get') {
    return row;
  }
  if (request.method === 'delete') {
    table.rows = table.rows.filter((r) => {
      return r !== row;
    });
    return undefined;
  }
  const updated = {
    ...row,
    ...(request.body as JsonObject),
    updated_at: new Date().toISOString(),
  };
  table.rows = table.rows.map((r) => {
    return r === row ? updated : r;
  });
  return updated;
};

/**
 * An in-memory SOAT API answering the operations of `soatSpec` the way the
 * real one does, each story with its own copy of the data. Writes the spec
 * has but this fake does not model (e.g. `POST /agents/{agent_id}/generate`)
 * answer `{ ok: true }`. `onRequest` receives a line per request.
 */
export const createSoatFakeApi = ({
  latency = 300,
  onRequest,
}: {
  latency?: number;
  onRequest?: (entry: string) => void;
} = {}): Fetcher => {
  const tables: Table[] = parseResources({
    spec: soatSpec,
    pathPrefix: '/api/v1',
  }).map((resource) => {
    return { resource, rows: SEEDS[resource.key]?.() ?? [] };
  });
  const routes = buildRoutes(tables);
  let counter = 9000;
  const nextId = () => {
    counter += 1;
    return counter;
  };

  return async (request) => {
    onRequest?.(describeRequest(request));
    await wait(latency, request.signal);
    const { pathname, searchParams } = new URL(
      request.url,
      'http://fake.local'
    );
    for (const route of routes) {
      const match = pathname.match(route.match);
      if (!match) {
        continue;
      }
      if (route.kind === 'collection') {
        return handleCollection({
          table: route.table,
          request,
          query: searchParams,
          nextId,
        });
      }
      return handleItem({
        table: route.table,
        request,
        id: decodeURIComponent(match[match.length - 1]),
      });
    }
    if (request.method !== 'get') {
      return { ok: true };
    }
    throw soatError({
      status: 501,
      code: 'NOT_IMPLEMENTED',
      message: `The story's fake API does not serve ${pathname}.`,
    });
  };
};
