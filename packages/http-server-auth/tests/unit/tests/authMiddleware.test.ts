import { hashApiToken, signJwt } from '@ttoss/auth-core';
import { App } from '@ttoss/http-server';
import { authMiddleware } from 'src/authMiddleware';
import type { AuthenticatedUser } from 'src/types';
import request from 'supertest';

const jwtSecret = 'test-jwt-secret';
const systemSecret = 'test-system-secret';
const systemUser: AuthenticatedUser = {
  id: 'system',
  email: 'system@internal',
};

const makeApp = (opts: Parameters<typeof authMiddleware>[0]) => {
  const app = new App();
  app.use(authMiddleware(opts));
  app.use((ctx) => {
    ctx.body = { user: ctx.state.user, strategy: ctx.state.authStrategy };
  });
  return app;
};

// JWT strategy
describe('jwt strategy', () => {
  const app = makeApp({ strategies: ['jwt'], jwt: { secret: jwtSecret } });

  test('authenticates a valid JWT', async () => {
    const token = signJwt({
      payload: { sub: 'user_1', email: 'user@example.com' },
      secret: jwtSecret,
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 'user_1',
      email: 'user@example.com',
    });
    expect(res.body.strategy).toBe('jwt');
  });

  test('rejects an invalid JWT', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('rejects a JWT signed with wrong secret', async () => {
    const token = signJwt({
      payload: { sub: 'user_1' },
      secret: 'wrong-secret',
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('uses custom mapPayload when provided', async () => {
    const appCustomMap = makeApp({
      strategies: ['jwt'],
      jwt: {
        secret: jwtSecret,
        mapPayload: (p) => {
          return { id: `mapped_${p.sub}` };
        },
      },
    });
    const token = signJwt({ payload: { sub: 'user_1' }, secret: jwtSecret });
    const res = await request(appCustomMap.callback())
      .get('/')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.user.id).toBe('mapped_user_1');
  });

  test('passes ctx to mapPayload', async () => {
    const mapPayload = jest.fn((p, ctx) => {
      return { id: String(p.sub), method: ctx.method };
    });
    const appCustomMap = makeApp({
      strategies: ['jwt'],
      jwt: { secret: jwtSecret, mapPayload },
    });
    const token = signJwt({ payload: { sub: 'user_1' }, secret: jwtSecret });
    const res = await request(appCustomMap.callback())
      .get('/')
      .set('Authorization', `Bearer ${token}`);
    expect(mapPayload).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user_1' }),
      expect.anything()
    );
    expect(res.body.user.method).toBe('GET');
  });
});

// apiToken strategy
describe('apiToken strategy', () => {
  const storedHash = hashApiToken('my-api-token');
  const lookup = jest.fn(async (tokenHash: string) => {
    if (tokenHash === storedHash)
      return { id: 'user_2', email: 'api@example.com' };
    return null;
  });
  const app = makeApp({ strategies: ['apiToken'], apiToken: { lookup } });

  beforeEach(() => {
    return lookup.mockClear();
  });

  test('authenticates a valid API token', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer my-api-token');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 'user_2' });
    expect(res.body.strategy).toBe('apiToken');
  });

  test('rejects an unknown API token', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer unknown-token');
    expect(res.status).toBe(401);
  });

  test('calls lookup with SHA-256 hash of the token and ctx', async () => {
    await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer my-api-token');
    expect(lookup).toHaveBeenCalledWith(storedHash, expect.anything());
  });

  test('passes ctx to lookup so it can do request-scoped work', async () => {
    const lastUsed: string[] = [];
    const lookupWithCtx = jest.fn(async (tokenHash: string, ctx) => {
      if (tokenHash !== storedHash) return null;
      // mutate request-scoped state via ctx, e.g. bumping lastUsedAt
      ctx.state.lastUsedAt = 'now';
      lastUsed.push(ctx.method);
      return { id: 'user_2' };
    });
    const appWithCtx = new App();
    appWithCtx.use(
      authMiddleware({
        strategies: ['apiToken'],
        apiToken: { lookup: lookupWithCtx },
      })
    );
    appWithCtx.use((ctx) => {
      ctx.body = { lastUsedAt: ctx.state.lastUsedAt };
    });

    const res = await request(appWithCtx.callback())
      .get('/')
      .set('Authorization', 'Bearer my-api-token');

    expect(res.status).toBe(200);
    expect(res.body.lastUsedAt).toBe('now');
    expect(lastUsed).toEqual(['GET']);
  });
});

// system strategy
describe('system strategy', () => {
  const app = makeApp({
    strategies: ['system'],
    system: { secret: systemSecret, user: systemUser },
  });

  test('authenticates with the correct system secret', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', `Bearer ${systemSecret}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject(systemUser);
    expect(res.body.strategy).toBe('system');
  });

  test('rejects a wrong system secret', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer wrong-system-secret');
    expect(res.status).toBe(401);
  });
});

// strategy ordering
describe('strategy ordering', () => {
  test('first matching strategy wins', async () => {
    const lookup = jest.fn(async () => {
      return { id: 'api_user' };
    });
    const app = makeApp({
      strategies: ['jwt', 'apiToken'],
      jwt: { secret: jwtSecret },
      apiToken: { lookup },
    });
    const token = signJwt({ payload: { sub: 'jwt_user' }, secret: jwtSecret });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.strategy).toBe('jwt');
    expect(lookup).not.toHaveBeenCalled();
  });
});

// required: false
describe('optional auth (required: false)', () => {
  const app = makeApp({
    strategies: ['jwt'],
    jwt: { secret: jwtSecret },
    required: false,
  });

  test('passes through without Authorization header', async () => {
    const res = await request(app.callback()).get('/');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeUndefined();
  });

  test('passes through with an invalid token', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer bad.token');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeUndefined();
  });

  test('still authenticates a valid token', async () => {
    const token = signJwt({ payload: { sub: 'user_1' }, secret: jwtSecret });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 'user_1' });
  });
});

// missing / malformed Authorization header
describe('missing or malformed Authorization header', () => {
  const app = makeApp({ strategies: ['jwt'], jwt: { secret: jwtSecret } });

  test('returns 401 when Authorization header is absent', async () => {
    const res = await request(app.callback()).get('/');
    expect(res.status).toBe(401);
  });

  test('returns 401 for non-Bearer scheme', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });

  test('401 response body does not reveal which strategy failed', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer bad.token');
    expect(res.status).toBe(401);
    expect(res.text).not.toMatch(/jwt|api|strategy/i);
  });
});

// origin allowlist
describe('allowedOrigins', () => {
  const app = makeApp({
    strategies: ['jwt'],
    jwt: { secret: jwtSecret },
    required: false,
    allowedOrigins: ['http://localhost:3000', /\.vercel\.app$/],
  });

  test('allows matching string origin', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Origin', 'http://localhost:3000');
    expect(res.status).toBe(200);
  });

  test('allows matching RegExp origin', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Origin', 'https://preview.vercel.app');
    expect(res.status).toBe(200);
  });

  test('rejects non-matching origin', async () => {
    const res = await request(app.callback())
      .get('/')
      .set('Origin', 'http://evil.com');
    expect(res.status).toBe(403);
  });

  test('allows requests without Origin header', async () => {
    const res = await request(app.callback()).get('/');
    expect(res.status).toBe(200);
  });
});

// OAuth strategy
describe('oauth strategy', () => {
  test('authenticates a verified token and exposes claims on ctx.state.user', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1', scope: 'read write', email: 'u@x.com' };
        },
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 'u1',
      scope: 'read write',
      email: 'u@x.com',
    });
    expect(res.body.strategy).toBe('oauth');
  });

  test('receives ctx in verify', async () => {
    const verify = jest.fn(() => {
      return { sub: 'u1' };
    });
    const app = makeApp({ strategies: ['oauth'], oauth: { verify } });
    await request(app.callback()).get('/').set('Authorization', 'Bearer tok');
    expect(verify).toHaveBeenCalledWith(
      'tok',
      expect.objectContaining({ request: expect.anything() })
    );
  });

  test('401 when verify throws', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return Promise.reject(new Error('bad'));
        },
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
  });

  test('401 when verify returns null', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return null;
        },
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(401);
  });

  test('401 carries RFC 9728 header when resourceMetadataUrl is set', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return null;
        },
      },
      resourceMetadataUrl:
        'https://mcp.example.com/.well-known/oauth-protected-resource',
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe(
      'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"'
    );
  });

  test('403 when a required scope is missing', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1', scope: 'read' };
        },
        requiredScopes: ['write'],
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(403);
  });

  test('403 when the token has no scope claim at all', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1' };
        },
        requiredScopes: ['write'],
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(403);
  });

  test('allows when all required scopes are present', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1', scope: 'read write' };
        },
        requiredScopes: ['write'],
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(200);
  });

  test('allows when scopes[] array satisfies requiredScopes', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1', scopes: ['read', 'write'] };
        },
        requiredScopes: ['write'],
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(200);
  });

  test('403 when scopes[] array is missing the required scope', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1', scopes: ['read'] };
        },
        requiredScopes: ['write'],
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(403);
  });

  test('403 with warning when neither scope nor scopes is present', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1' };
        },
        requiredScopes: ['write'],
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(403);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no scope/scopes claim')
    );
    warnSpy.mockRestore();
  });

  test('honours a custom mapPayload (null → 401)', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1' };
        },
        mapPayload: () => {
          return null;
        },
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(401);
  });

  test('honours a custom mapPayload (mapped user)', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { sub: 'u1', org: 'acme' };
        },
        mapPayload: (payload) => {
          return { id: String(payload.sub), org: String(payload.org) };
        },
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.body.user).toMatchObject({ id: 'u1', org: 'acme' });
  });
});

describe('oauth strategy — default id mapping', () => {
  test('defaults id to empty string when the payload has no sub', async () => {
    const app = makeApp({
      strategies: ['oauth'],
      oauth: {
        verify: () => {
          return { scope: 'read' };
        },
      },
    });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: '', scope: 'read' });
  });
});

describe('strategy without matching options', () => {
  test('401 when a listed strategy has no configuration', async () => {
    // 'oauth' is listed but no `oauth` option is provided → no strategy matches.
    const app = makeApp({ strategies: ['oauth'] });
    const res = await request(app.callback())
      .get('/')
      .set('Authorization', 'Bearer tok');
    expect(res.status).toBe(401);
  });
});
