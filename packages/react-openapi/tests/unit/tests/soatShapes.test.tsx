import { render, screen, userEvent, within } from '@ttoss/test-utils/react';

import {
  detectServerPagination,
  extractNextCursor,
  type Fetcher,
  type FetcherRequest,
  getFieldKind,
  getFormFields,
  getRefName,
  initFormValues,
  isListable,
  type JsonObject,
  listOperations,
  OpenApiApp,
  OpenApiProvider,
  type OpenApiSpec,
  OpenApiTable,
  paginationParams,
  parseFieldValue,
  parseResources,
} from '../../../src';

/**
 * The shapes of the SOAT spec (https://soat.ttoss.dev/docs/openapi-specs):
 * parameters declared by `$ref`, cursor pages (`{ data, next_cursor }`),
 * `x-soat-ref` on ids and arrays of ids, a tag with two collections and a
 * resource nested under a parent.
 */

const json = (schema: object) => {
  return { content: { 'application/json': { schema } } };
};

const page = (item: string) => {
  return json({
    allOf: [
      { $ref: '#/components/schemas/Page' },
      {
        properties: {
          data: {
            type: 'array',
            items: { $ref: `#/components/schemas/${item}` },
          },
        },
      },
    ],
  });
};

// `$ref` parameters carry no name/in until resolved.
const PAGED = [
  { $ref: '#/components/parameters/Limit' },
  { $ref: '#/components/parameters/Cursor' },
] as never;

const labSpec: OpenApiSpec = {
  openapi: '3.0.3',
  info: { title: 'Lab API', version: '1.0.0' },
  paths: {
    '/api/v1/guardrails': {
      get: {
        operationId: 'listGuardrails',
        tags: ['Guardrails'],
        parameters: PAGED,
        responses: { '200': page('Guardrail') },
      },
    },
    '/api/v1/guardrails/{guardrail_id}': {
      parameters: [{ $ref: '#/components/parameters/GuardrailId' }] as never,
      get: {
        operationId: 'getGuardrail',
        tags: ['Guardrails'],
        responses: { '200': json({ $ref: '#/components/schemas/Guardrail' }) },
      },
    },
    '/api/v1/labels': {
      get: {
        operationId: 'listLabels',
        tags: ['Labels'],
        parameters: PAGED,
        responses: { '200': page('Guardrail') },
      },
    },
    '/api/v1/agents': {
      get: {
        operationId: 'listAgents',
        tags: ['Agents'],
        parameters: PAGED,
        responses: { '200': page('Agent') },
      },
      post: {
        operationId: 'createAgent',
        tags: ['Agents'],
        requestBody: json({ $ref: '#/components/schemas/Agent' }),
        responses: { '201': json({ $ref: '#/components/schemas/Agent' }) },
      },
    },
    '/api/v1/agents/{agent_id}': {
      get: {
        operationId: 'getAgent',
        tags: ['Agents'],
        parameters: [
          { $ref: '#/components/parameters/AgentId' },
          // Unresolvable: dropped.
          { $ref: '#/components/parameters/Missing' },
        ] as never,
        responses: { '200': json({ $ref: '#/components/schemas/Agent' }) },
      },
    },
    '/api/v1/agents/{agent_id}/versions': {
      get: {
        operationId: 'listAgentVersions',
        tags: ['Agent Versions'],
        parameters: [{ $ref: '#/components/parameters/AgentId' }] as never,
        responses: {
          '200': json({ type: 'array', items: { type: 'object' } }),
        },
      },
    },
    '/api/v1/datasets': {
      get: {
        operationId: 'listDatasets',
        tags: ['Evaluations'],
        responses: {
          '200': json({ type: 'array', items: { type: 'object' } }),
        },
      },
    },
    '/api/v1/evals': {
      get: {
        operationId: 'listEvals',
        tags: ['Evaluations'],
        responses: {
          '200': json({ type: 'array', items: { type: 'object' } }),
        },
      },
    },
    '/api/v1/evals/{eval_id}': {
      get: {
        operationId: 'getEval',
        tags: ['Evaluations'],
        parameters: [{ name: 'eval_id', in: 'path', required: true }],
      },
    },
    '/api/v1/eval-imports': {
      post: { operationId: 'importEvals', tags: ['Evaluations'] },
    },
    '/api/v1/usage/aggregate': {
      get: { operationId: 'aggregateUsage', tags: ['Usage'] },
    },
    '/api/v1/usage/thresholds': {
      get: { operationId: 'listThresholds', tags: ['Usage'] },
    },
    '/api/v1/usage/thresholds/{threshold_id}': {
      delete: {
        operationId: 'deleteThreshold',
        tags: ['Usage'],
        parameters: [{ name: 'threshold_id', in: 'path', required: true }],
      },
    },
  },
  components: {
    parameters: {
      Limit: { name: 'limit', in: 'query', schema: { type: 'integer' } },
      Cursor: { name: 'cursor', in: 'query', schema: { type: 'string' } },
      AgentId: { name: 'agent_id', in: 'path', required: true },
      GuardrailId: { name: 'guardrail_id', in: 'path', required: true },
    },
    schemas: {
      Page: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          next_cursor: { type: 'string', nullable: true },
        },
      },
      Guardrail: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          name: { type: 'string' },
        },
      },
      Agent: {
        type: 'object',
        properties: {
          id: { type: 'string', readOnly: true },
          name: { type: 'string' },
          guardrail_ids: {
            type: 'array',
            items: { type: 'string' },
            'x-soat-ref': 'guardrails',
          },
          tool_ids: {
            type: 'array',
            items: { type: 'string', 'x-soat-ref': 'tools' },
          },
          label_ids: {
            type: 'array',
            items: { type: 'string' },
            'x-soat-ref': 'labels',
          },
        },
      },
    },
  },
};

const GUARDRAILS = ['PII', 'Budget', 'Tone', 'Spam', 'Legal'].map((name, i) => {
  return { id: `g${i + 1}`, name };
});

/** `{ data, next_cursor }` pages over `rows`; the cursor is the offset. */
const cursorPage = ({
  rows,
  query,
}: {
  rows: JsonObject[];
  query: URLSearchParams;
}) => {
  const limit = Number(query.get('limit') ?? 50);
  const offset = Number(query.get('cursor')?.slice(1) ?? 0);
  const next = offset + limit;
  return {
    data: rows.slice(offset, next),
    next_cursor: next < rows.length ? `c${next}` : null,
  };
};

const createLabApi = () => {
  const agents: JsonObject[] = [
    { id: 'a1', name: 'Triage', guardrail_ids: ['g1', 'g3'], tool_ids: [] },
  ];
  const requests: FetcherRequest[] = [];
  const fetcher: Fetcher = async (request) => {
    requests.push(request);
    const { pathname, searchParams: query } = new URL(
      request.url,
      'http://test'
    );
    if (pathname === '/api/v1/guardrails') {
      return cursorPage({ rows: GUARDRAILS, query });
    }
    if (pathname === '/api/v1/labels') {
      return { data: [], next_cursor: null };
    }
    const guardrail = pathname.match(/^\/api\/v1\/guardrails\/(\w+)$/);
    if (guardrail) {
      return GUARDRAILS.find((g) => {
        return g.id === guardrail[1];
      });
    }
    if (pathname === '/api/v1/agents' && request.method === 'post') {
      const created = {
        id: `a${agents.length + 1}`,
        ...(request.body as JsonObject),
      };
      agents.push(created);
      return created;
    }
    if (pathname === '/api/v1/agents') {
      return cursorPage({ rows: agents, query });
    }
    const agent = pathname.match(/^\/api\/v1\/agents\/(\w+)$/);
    if (agent) {
      return agents.find((a) => {
        return a.id === agent[1];
      });
    }
    return [];
  };
  return { fetcher, requests };
};

describe('SOAT spec shapes in the core', () => {
  test('resolves parameters declared by $ref, dropping unresolvable ones', () => {
    const byId = Object.fromEntries(
      listOperations(labSpec).map((op) => {
        return [op.operation.operationId, op.operation.parameters];
      })
    );
    expect(byId.listGuardrails).toEqual([
      { name: 'limit', in: 'query', schema: { type: 'integer' } },
      { name: 'cursor', in: 'query', schema: { type: 'string' } },
    ]);
    expect(byId.getAgent).toEqual([
      { name: 'agent_id', in: 'path', required: true },
    ]);
    // Path-level `$ref` parameters are resolved too.
    expect(byId.getGuardrail).toEqual([
      { name: 'guardrail_id', in: 'path', required: true },
    ]);
  });

  test('detects cursor pagination and builds its params', () => {
    const [list] = listOperations(labSpec);
    const pagination = detectServerPagination(list);
    expect(pagination).toEqual({
      type: 'cursor',
      limitParam: 'limit',
      cursorParam: 'cursor',
    });
    expect(
      paginationParams({ pagination: pagination!, pageIndex: 0, pageSize: 10 })
    ).toEqual({ limit: 10 });
    expect(
      paginationParams({
        pagination: pagination!,
        pageIndex: 1,
        pageSize: 10,
        cursor: 'c10',
      })
    ).toEqual({ limit: 10, cursor: 'c10' });
  });

  test('reads the next cursor from the page or its meta', () => {
    expect(extractNextCursor({ data: [], next_cursor: 'abc' })).toBe('abc');
    expect(extractNextCursor({ data: [], meta: { nextCursor: 'm1' } })).toBe(
      'm1'
    );
    expect(extractNextCursor({ data: [], next_cursor: null })).toBeUndefined();
    expect(extractNextCursor([])).toBeUndefined();
  });

  test('reads x-soat-ref on ids and on arrays of ids', () => {
    expect(getRefName({ type: 'string', 'x-soat-ref': 'agents' })).toBe(
      'agents'
    );
    expect(
      getRefName({ type: 'string', 'x-ref': 'a', 'x-soat-ref': 'b' })
    ).toBe('a');
    expect(
      getRefName({
        type: 'array',
        items: { type: 'string', 'x-soat-ref': 't' },
      })
    ).toBe('t');
    expect(getRefName({ type: 'object', 'x-soat-ref': '' })).toBeUndefined();
    expect(
      getFieldKind({
        name: 'guardrail_ids',
        schema: { type: 'array', 'x-soat-ref': 'guardrails' },
      })
    ).toBe('refList');
  });

  test('splits a tag holding several collections and scopes nested ones', () => {
    const resources = parseResources({ spec: labSpec, pathPrefix: '/api/v1' });
    const byKey = Object.fromEntries(
      resources.map((resource) => {
        return [resource.key, resource];
      })
    );
    expect(Object.keys(byKey)).toEqual([
      'guardrails',
      'labels',
      'agents',
      'agent-versions',
      'datasets',
      'evals',
      'usage',
    ]);
    expect(byKey.datasets.label).toBe('Datasets');
    // The collection-less `/eval-imports` stays with the first group.
    expect(
      byKey.datasets.actions.map((action) => {
        return action.key;
      })
    ).toEqual(['importEvals']);
    expect(byKey.evals.get?.operation.operationId).toBe('getEval');
    // The collection with an item path wins over a shorter-sorted one.
    expect(byKey.usage.list?.operation.operationId).toBe('listThresholds');
    expect(byKey['agent-versions'].scopeParams).toEqual(['agent_id']);
    expect(isListable({ resource: byKey['agent-versions'] })).toBe(false);
    expect(
      isListable({
        resource: byKey['agent-versions'],
        params: { agent_id: 'a1' },
      })
    ).toBe(true);
    expect(isListable({ resource: byKey.agents })).toBe(true);
  });

  test('gives a unique key to groups whose names collide', () => {
    const resources = parseResources({
      spec: {
        paths: {
          '/a': { get: { operationId: 'listA', tags: ['Items'] } },
          '/b': { get: { operationId: 'listB', tags: ['items'] } },
        },
      },
    });
    expect(
      resources.map((resource) => {
        return resource.key;
      })
    ).toEqual(['items', 'items-2']);
  });

  test('id lists ignore blank entries', () => {
    const fields = getFormFields({
      schema: {
        type: 'object',
        required: ['tool_ids'],
        properties: {
          tool_ids: { type: 'array', items: { 'x-ref': 'tools' } },
        },
      },
    });
    expect(initFormValues({ fields, record: { tool_ids: ['t1'] } })).toEqual({
      tool_ids: ['t1'],
    });
    expect(initFormValues({ fields })).toEqual({ tool_ids: [] });
    expect(parseFieldValue({ field: fields[0], value: ['', ''] })).toEqual({
      ok: false,
      error: { code: 'required' },
    });
    expect(parseFieldValue({ field: fields[0], value: ['t1', ''] })).toEqual({
      ok: true,
      empty: false,
      value: ['t1'],
    });
  });
});

describe('SOAT spec shapes in the components', () => {
  test('pages a cursor list forward and back', async () => {
    const user = userEvent.setup();
    const { fetcher, requests } = createLabApi();
    render(
      <OpenApiProvider spec={labSpec} fetcher={fetcher}>
        <OpenApiTable operationId="listGuardrails" pageSize={2} />
      </OpenApiProvider>
    );
    expect(await screen.findByText('PII')).toBeInTheDocument();
    expect(requests.at(-1)?.url).toBe('/api/v1/guardrails?limit=2');
    expect(
      screen.getByRole('button', { name: 'Previous page' })
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Tone')).toBeInTheDocument();
    expect(requests.at(-1)?.url).toBe('/api/v1/guardrails?limit=2&cursor=c2');

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Legal')).toBeInTheDocument();
    expect(requests.at(-1)?.url).toBe('/api/v1/guardrails?limit=2&cursor=c4');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(await screen.findByText('Tone')).toBeInTheDocument();
    expect(requests.at(-1)?.url).toBe('/api/v1/guardrails?limit=2&cursor=c2');
  });

  test('picks and links arrays of ids, with fallbacks', async () => {
    const user = userEvent.setup();
    const { fetcher, requests } = createLabApi();
    render(
      <OpenApiProvider spec={labSpec} fetcher={fetcher}>
        <OpenApiApp
          pathPrefix="/api/v1"
          defaultLocation={{ resource: 'agents', view: 'create' }}
        />
      </OpenApiProvider>
    );
    const nav = screen.getByRole('navigation', { name: 'Resources' });
    expect(within(nav).queryByText('Agent Versions')).not.toBeInTheDocument();

    await user.type(await screen.findByLabelText('Name'), 'Billing');
    // Guardrails has a list: checkboxes of its records.
    await user.click(await screen.findByLabelText('PII'));
    await user.click(screen.getByLabelText('Spam'));
    await user.click(screen.getByLabelText('PII'));
    await user.click(screen.getByLabelText('Tone'));
    // Tools is not in the spec: one id per line.
    await user.type(screen.getByLabelText('Tool Ids'), 't1{enter}{enter}t2');
    // Labels has a list but no records.
    expect(
      await screen.findByText('No records to choose from.')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { name: 'Billing' })
    ).toBeInTheDocument();
    expect(
      requests.find((r) => {
        return r.method === 'post';
      })?.body
    ).toEqual({
      name: 'Billing',
      guardrail_ids: ['g4', 'g3'],
      tool_ids: ['t1', 't2'],
    });

    // The record links each referenced guardrail.
    await user.click(screen.getByRole('button', { name: 'g4' }));
    expect(
      await screen.findByRole('heading', { name: 'Spam' })
    ).toBeInTheDocument();
  });
});
