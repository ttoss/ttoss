import type { Context } from 'koa';
import {
  App,
  applyHttpErrorHeaders,
  createRateLimiter,
  rateLimit,
  Router,
  toHttpError,
} from 'src/index';
import request from 'supertest';

describe('createRateLimiter', () => {
  test('allows up to the limit per window, then refuses until it ends', () => {
    let time = 1_000;
    const limiter = createRateLimiter({
      windowMs: 60_000,
      now: () => {
        return time;
      },
    });

    expect(limiter.consume({ key: 'a', limit: 2 })).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 61_000,
    });
    expect(limiter.consume({ key: 'a', limit: 2 })).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 61_000,
    });
    expect(limiter.consume({ key: 'a', limit: 2 })).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: 61_000,
    });

    // Keys are counted apart.
    expect(limiter.consume({ key: 'b', limit: 2 }).allowed).toBe(true);

    time = 61_000;

    expect(limiter.consume({ key: 'a', limit: 2 })).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 121_000,
    });
  });

  test('sweeps expired keys so a stale one starts a fresh window', () => {
    let time = 0;
    const limiter = createRateLimiter({
      windowMs: 1_000,
      now: () => {
        return time;
      },
    });

    limiter.consume({ key: 'old', limit: 1 });
    limiter.consume({ key: 'live', limit: 5 });

    time = 999;
    limiter.consume({ key: 'live', limit: 5 });

    // Past the sweep point: `old` expired and is dropped, `live` (window
    // started at 0) also expired, so both start over.
    time = 2_500;

    expect(limiter.consume({ key: 'old', limit: 1 })).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 3_500,
    });

    // A sweep keeps keys whose window is still open.
    time = 3_400;
    limiter.consume({ key: 'kept', limit: 2 });
    time = 3_600;

    expect(limiter.consume({ key: 'kept', limit: 2 })).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 4_400,
    });
  });

  test('defaults to the real clock', () => {
    const limiter = createRateLimiter({ windowMs: 60_000 });

    expect(limiter.consume({ key: 'a', limit: 1 }).allowed).toBe(true);
  });
});

describe('rateLimit middleware', () => {
  const build = (
    options: Partial<Parameters<typeof rateLimit>[0]> & { time?: number } = {}
  ) => {
    const app = new App();
    const router = new Router();

    app.use(async (ctx: Context, next) => {
      try {
        await next();
      } catch (error) {
        const httpError = toHttpError(error);

        if (!httpError) throw error;

        applyHttpErrorHeaders({ ctx, error });
        ctx.status = httpError.status;
        ctx.body = { message: httpError.message };
      }
    });

    router.get(
      '/limited',
      rateLimit({
        windowMs: 60_000,
        limit: 1,
        key: (ctx) => {
          return ctx.get('x-key') || undefined;
        },
        now: () => {
          return 0;
        },
        ...options,
      }),
      (ctx: Context) => {
        ctx.body = { ok: true };
      }
    );

    app.use(router.routes());

    return app.callback();
  };

  test('answers 429 with Retry-After once the key is over its limit', async () => {
    const app = build();

    const first = await request(app).get('/limited').set('x-key', 'a');

    expect(first.status).toBe(200);
    expect(first.headers['ratelimit-limit']).toBe('1');
    expect(first.headers['ratelimit-remaining']).toBe('0');
    expect(first.headers['ratelimit-reset']).toBe('60');

    const second = await request(app).get('/limited').set('x-key', 'a');

    expect(second.status).toBe(429);
    expect(second.body).toEqual({ message: 'Too many requests.' });
    expect(second.headers['retry-after']).toBe('60');
    expect(second.headers['ratelimit-remaining']).toBe('0');
  });

  test('skips the limit when the key is undefined', async () => {
    const app = build();

    await request(app).get('/limited').expect(200);
    await request(app).get('/limited').expect(200);
  });

  test('reads the limit and the message from options', async () => {
    const app = build({
      limit: (ctx) => {
        return ctx.get('x-key') === 'vip' ? 2 : 1;
      },
      message: 'Slow down.',
    });

    await request(app).get('/limited').set('x-key', 'vip').expect(200);
    await request(app).get('/limited').set('x-key', 'vip').expect(200);

    const third = await request(app).get('/limited').set('x-key', 'vip');

    expect(third.status).toBe(429);
    expect(third.body).toEqual({ message: 'Slow down.' });
  });

  test('defaults to the real clock', async () => {
    const app = build({ now: undefined });

    const response = await request(app).get('/limited').set('x-key', 'a');

    expect(response.status).toBe(200);
    expect(Number(response.headers['ratelimit-reset'])).toBeGreaterThan(0);
  });
});
