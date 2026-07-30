import type { Context } from 'koa';
import { App, applyHttpErrorHeaders, Router, toHttpError } from 'src/index';
import request from 'supertest';

describe('toHttpError', () => {
  test('normalizes an exposable 4xx', () => {
    const error = {
      status: 401,
      expose: true,
      message: 'Unauthorized',
      headers: { 'WWW-Authenticate': 'Bearer' },
    };

    expect(toHttpError(error)).toEqual({
      status: 401,
      message: 'Unauthorized',
      headers: { 'WWW-Authenticate': 'Bearer' },
    });
  });

  test('reads statusCode when status is absent', () => {
    expect(
      toHttpError({ statusCode: 403, expose: true, message: 'Forbidden' })
    ).toEqual({ status: 403, message: 'Forbidden', headers: {} });
  });

  test('falls back to a generic message when the error has none', () => {
    expect(toHttpError({ status: 400, expose: true, message: '' })).toEqual({
      status: 400,
      message: 'The request could not be completed.',
      headers: {},
    });

    expect(toHttpError({ status: 400, expose: true, message: 42 })).toEqual({
      status: 400,
      message: 'The request could not be completed.',
      headers: {},
    });
  });

  test('drops non-string header values', () => {
    const error = {
      status: 401,
      expose: true,
      message: 'Unauthorized',
      headers: { 'WWW-Authenticate': 'Bearer', 'Retry-After': 30 },
    };

    expect(toHttpError(error)?.headers).toEqual({
      'WWW-Authenticate': 'Bearer',
    });
  });

  test.each([
    ['a non-object', 'boom'],
    ['null', null],
    ['a plain Error', new Error('boom')],
    ['a status that is not a number', { status: '401', expose: true }],
    ['a 5xx', { status: 500, expose: true }],
    ['a 3xx', { status: 302, expose: true }],
    ['an error that does not opt into exposure', { status: 401 }],
    ['an internal error with a 4xx status', { status: 401, expose: false }],
  ])('returns undefined for %s', (_, error) => {
    expect(toHttpError(error)).toBeUndefined();
  });

  test('ignores non-object headers', () => {
    expect(
      toHttpError({
        status: 401,
        expose: true,
        message: 'x',
        headers: 'Bearer',
      })?.headers
    ).toEqual({});
    expect(
      toHttpError({ status: 401, expose: true, message: 'x', headers: null })
        ?.headers
    ).toEqual({});
  });
});

describe('applyHttpErrorHeaders', () => {
  test('is a no-op for values that cannot carry headers', () => {
    const set = jest.fn();
    const ctx = { set } as unknown as Context;

    applyHttpErrorHeaders({ ctx, error: 'boom' });
    applyHttpErrorHeaders({ ctx, error: null });
    applyHttpErrorHeaders({ ctx, error: new Error('boom') });

    expect(set).not.toHaveBeenCalled();
  });

  test('preserves WWW-Authenticate through a catch-all error envelope', async () => {
    const app = new App();

    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        const httpError = toHttpError(error);

        if (httpError) {
          applyHttpErrorHeaders({ ctx, error });
          ctx.status = httpError.status;
          ctx.body = { error: httpError.message };
          return;
        }

        ctx.status = 500;
        ctx.body = { error: 'internal_error' };
      }
    });

    const router = new Router();

    router.get('/protected', (ctx) => {
      ctx.throw(401, 'Unauthorized', {
        headers: {
          'WWW-Authenticate':
            'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"',
        },
      });
    });

    router.get('/broken', () => {
      throw new Error('boom');
    });

    app.use(router.routes());

    const unauthorized = await request(app.callback()).get('/protected');

    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body).toEqual({ error: 'Unauthorized' });
    expect(unauthorized.headers['www-authenticate']).toBe(
      'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"'
    );

    const broken = await request(app.callback()).get('/broken');

    expect(broken.status).toBe(500);
    expect(broken.body).toEqual({ error: 'internal_error' });
    expect(broken.headers['www-authenticate']).toBeUndefined();
  });
});
