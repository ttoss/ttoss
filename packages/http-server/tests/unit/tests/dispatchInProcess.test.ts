import { Readable } from 'node:stream';

import { App, bodyParser, dispatchInProcess, Router } from 'src/index';

const buildApp = () => {
  const app = new App();
  const router = new Router();

  router.get('/items/:id', (ctx) => {
    ctx.body = {
      id: ctx.params.id,
      query: ctx.query,
      authorization: ctx.get('authorization'),
      host: ctx.get('host'),
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
    };
  });

  router.post('/items', (ctx) => {
    ctx.status = 201;
    ctx.set('x-item', 'created');
    ctx.body = {
      received: ctx.request.body,
      contentType: ctx.get('content-type'),
    };
  });

  router.get('/text', (ctx) => {
    ctx.body = 'plain';
  });

  router.get('/buffer', (ctx) => {
    ctx.body = Buffer.from('bytes', 'utf8');
  });

  router.get('/stream', (ctx) => {
    ctx.body = Readable.from(['chunk']);
  });

  router.delete('/items/:id', (ctx) => {
    ctx.body = null;
  });

  router.get('/teapot', () => {
    const error = new Error('short and stout') as Error & {
      status: number;
      expose: boolean;
    };

    error.status = 418;
    error.expose = true;
    throw error;
  });

  router.get('/status-code', () => {
    const error = new Error('hidden') as Error & { statusCode: number };

    error.statusCode = 503;
    throw error;
  });

  router.get('/crash', () => {
    throw new Error('internal detail');
  });

  router.get('/bad-status', () => {
    const error = new Error('not http') as Error & { status: number };

    error.status = 200;
    throw error;
  });

  app.use(bodyParser());
  app.use(router.routes());

  return app;
};

const app = buildApp();

test('runs the middleware chain and returns the wire body', async () => {
  const response = await dispatchInProcess({
    app,
    method: 'get',
    path: '/items/it_1?limit=10',
    headers: { Authorization: 'Bearer token', 'x-skipped': undefined },
  });

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    id: 'it_1',
    query: { limit: '10' },
    authorization: 'Bearer token',
    host: 'localhost',
    createdAt: '2026-01-02T03:04:05.000Z',
  });
  expect(response.headers['content-type']).toMatch(/application\/json/);
});

test('sends the body as JSON through the body parser', async () => {
  const response = await dispatchInProcess({
    app,
    method: 'POST',
    path: '/items',
    body: { name: 'ação', tags: ['a'] },
  });

  expect(response.status).toBe(201);
  expect(response.headers['x-item']).toBe('created');
  expect(response.body).toEqual({
    received: { name: 'ação', tags: ['a'] },
    contentType: 'application/json',
  });
});

test('keeps a content type the caller set', async () => {
  const response = await dispatchInProcess({
    app,
    method: 'POST',
    path: '/items',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: { name: 'x' },
  });

  expect(response.body).toMatchObject({
    contentType: 'application/json; charset=utf-8',
  });
});

test('answers 404 for a route nothing matches', async () => {
  const response = await dispatchInProcess({
    app,
    method: 'GET',
    path: '/missing',
  });

  expect(response.status).toBe(404);
  expect(response.body).toBe('Not Found');
});

test('answers the status when it has no message', async () => {
  const custom = new App();

  custom.use((ctx) => {
    ctx.status = 599;
  });

  await expect(
    dispatchInProcess({ app: custom, method: 'GET', path: '/' })
  ).resolves.toMatchObject({ status: 599, body: '599' });
});

test('returns text and buffer bodies as strings', async () => {
  await expect(
    dispatchInProcess({ app, method: 'GET', path: '/text' })
  ).resolves.toMatchObject({ status: 200, body: 'plain' });

  await expect(
    dispatchInProcess({ app, method: 'GET', path: '/buffer' })
  ).resolves.toMatchObject({ status: 200, body: 'bytes' });
});

test('returns no body for an empty response', async () => {
  const response = await dispatchInProcess({
    app,
    method: 'DELETE',
    path: '/items/it_1',
  });

  expect(response.status).toBe(204);
  expect(response.body).toBeUndefined();
});

test('refuses a streamed body', async () => {
  await expect(
    dispatchInProcess({ app, method: 'GET', path: '/stream' })
  ).rejects.toThrow('cannot read a streamed response body');
});

test('answers an escaped error the way Koa does', async () => {
  await expect(
    dispatchInProcess({ app, method: 'GET', path: '/teapot' })
  ).resolves.toEqual({ status: 418, headers: {}, body: 'short and stout' });

  await expect(
    dispatchInProcess({ app, method: 'GET', path: '/status-code' })
  ).resolves.toEqual({ status: 503, headers: {}, body: 'Service Unavailable' });

  await expect(
    dispatchInProcess({ app, method: 'GET', path: '/crash' })
  ).resolves.toEqual({
    status: 500,
    headers: {},
    body: 'Internal Server Error',
  });

  await expect(
    dispatchInProcess({ app, method: 'GET', path: '/bad-status' })
  ).resolves.toMatchObject({ status: 500 });
});

test('emits an escaped error on the app when it has a listener', async () => {
  const listening = buildApp();
  const onError = jest.fn();

  listening.on('error', onError);

  await dispatchInProcess({ app: listening, method: 'GET', path: '/crash' });

  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'internal detail' }),
    expect.anything()
  );
});
