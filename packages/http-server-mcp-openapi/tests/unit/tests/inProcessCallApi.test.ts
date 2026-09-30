import { App, bodyParser, Router } from '@ttoss/http-server';
import { createMcpRouter, McpServer } from '@ttoss/http-server-mcp';
import {
  createInProcessCallApi,
  errorMessageOf,
  registerOpenApiTools,
  type ResolvedRequest,
  type ToolDefinition,
} from 'src/index';
import request from 'supertest';

const spec = {
  paths: {
    '/items/{item_id}': {
      get: {
        operationId: 'getItem',
        description: 'Reads one item.',
        parameters: [
          {
            name: 'item_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      },
    },
  },
};

const buildRestApp = () => {
  const app = new App();
  const router = new Router();

  router.get('/items/:id', (ctx) => {
    if (ctx.get('authorization') !== 'Bearer ok') {
      ctx.status = 401;
      ctx.body = { error: { code: 'unauthorized', message: 'No credential' } };
      return;
    }

    ctx.body = {
      id: ctx.params.id,
      viaTool: ctx.get('x-via-tool'),
    };
  });

  router.post('/items', (ctx) => {
    ctx.status = 201;
    ctx.body = { received: ctx.request.body };
  });

  app.use(bodyParser());
  app.use(router.routes());

  return app;
};

const resolved = (overrides: Partial<ResolvedRequest>): ResolvedRequest => {
  return {
    method: 'GET',
    url: '/items/it_1',
    tool: {} as ToolDefinition,
    headers: { authorization: 'Bearer ok' },
    ...overrides,
  };
};

describe('errorMessageOf', () => {
  test.each([
    ['a string body', 'Not found', 'Not found'],
    ['an empty string', '', null],
    ['an error string', { error: 'Bad input' }, 'Bad input'],
    [
      'an error with a code',
      { error: { code: 'invalid', message: 'Bad' } },
      'invalid: Bad',
    ],
    ['an error without a code', { error: { message: 'Bad' } }, 'Bad'],
    ['an error with no message', { error: { code: 'x' } }, null],
    ['a message', { message: 'Oops' }, 'Oops'],
    ['an unrelated object', { detail: 'x' }, null],
    ['no body', undefined, null],
    ['a number', 42, null],
  ])('reads %s', (_, body, expected) => {
    expect(errorMessageOf(body)).toBe(expected);
  });
});

describe('createInProcessCallApi', () => {
  test('dispatches against the app and answers the body', async () => {
    const callApi = createInProcessCallApi({ app: buildRestApp() });

    await expect(callApi(resolved({}))).resolves.toEqual({
      id: 'it_1',
      viaTool: '',
    });
  });

  test('sends the body and adds the configured headers', async () => {
    const app = buildRestApp();
    const headers = jest.fn(() => {
      return { 'x-via-tool': 'yes', skipped: undefined };
    });
    const callApi = createInProcessCallApi({ app, headers });

    await expect(
      callApi(resolved({ method: 'POST', url: '/items', body: { name: 'a' } }))
    ).resolves.toEqual({ received: { name: 'a' } });

    await expect(callApi(resolved({}))).resolves.toEqual({
      id: 'it_1',
      viaTool: 'yes',
    });
    expect(headers).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/items/it_1' })
    );
  });

  test('resolves an app given lazily', async () => {
    const app = buildRestApp();
    const callApi = createInProcessCallApi({
      app: async () => {
        return app;
      },
    });

    await expect(callApi(resolved({}))).resolves.toMatchObject({ id: 'it_1' });
  });

  test('throws the message of a non-2xx answer', async () => {
    const callApi = createInProcessCallApi({ app: buildRestApp() });

    await expect(callApi(resolved({ headers: {} }))).rejects.toThrow(
      'unauthorized: No credential'
    );
    await expect(callApi(resolved({ url: '/missing' }))).rejects.toThrow(
      'Not Found'
    );
  });

  test('falls back to the status when the body carries no message', async () => {
    const app = new App();

    app.use((ctx) => {
      ctx.status = 422;
      ctx.body = { detail: 'x' };
    });

    await expect(createInProcessCallApi({ app })(resolved({}))).rejects.toThrow(
      'HTTP 422'
    );
  });

  test('uses a custom toError', async () => {
    const toError = jest.fn(() => {
      return new Error('custom');
    });
    const callApi = createInProcessCallApi({ app: buildRestApp(), toError });

    await expect(callApi(resolved({ headers: {} }))).rejects.toThrow('custom');
    expect(toError).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401 }),
      expect.objectContaining({ url: '/items/it_1' })
    );
  });

  test('serves an MCP tool call through the REST route of the same app', async () => {
    const app = buildRestApp();
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    registerOpenApiTools({
      server,
      spec,
      callApi: createInProcessCallApi({ app }),
    });

    const router = createMcpRouter(server, {
      getApiHeaders: (ctx) => {
        return { authorization: ctx.headers.authorization ?? '' };
      },
    });

    app.use(router.routes());

    const res = await request(app.callback())
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .set('Authorization', 'Bearer ok')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'get-item', arguments: { itemId: 'it_9' } },
      });

    const text: string = res.text;
    const line = text.split('\n').find((l) => {
      return l.startsWith('data:');
    });
    const result = JSON.parse(line ? line.replace(/^data:\s*/, '') : text)
      .result as { content: { text: string }[]; isError?: boolean };

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(result.content[0].text)).toEqual({
      id: 'it_9',
      viaTool: '',
    });
  });
});
