import { createHash } from 'node:crypto';

import type { ClientStore } from '@ttoss/auth-core';
import { App, bodyParser, type Context } from '@ttoss/http-server';
import {
  createProtectedResourceMetadataMiddleware,
  oauthServer,
} from 'src/index';
import request from 'supertest';

const base64Url = (buffer: Buffer): string => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const CODE_VERIFIER = 'a-very-long-random-pkce-code-verifier-value-1234567890';
const CODE_CHALLENGE = base64Url(
  createHash('sha256').update(CODE_VERIFIER).digest()
);

const createClientStore = (): ClientStore => {
  const clients = new Map(
    [
      {
        client_id: 'client-abc',
        client_secret: 'secret-xyz',
        redirect_uris: ['https://app.example.com/callback'],
      },
    ].map((c) => {
      return [c.client_id, c] as const;
    })
  );
  return {
    get: (id) => {
      return clients.get(id);
    },
    register: (c) => {
      clients.set(c.client_id, c);
    },
  };
};

const createAuthCodeStore = () => {
  const codes = new Map();
  return {
    save: (c: { code: string }) => {
      codes.set(c.code, c);
    },
    get: (c: string) => {
      return codes.get(c);
    },
    delete: (c: string) => {
      codes.delete(c);
    },
  };
};

const buildApp = (overrides = {}) => {
  const app = new App();
  app.use(bodyParser());
  app.use(
    oauthServer({
      issuer: 'https://api.example.com',
      clientStore: createClientStore(),
      authCodeStore: createAuthCodeStore(),
      issueTokens: () => {
        return {
          accessToken: 'access',
          refreshToken: 'refresh',
          expiresIn: 3600,
        };
      },
      onAuthorize: () => {
        return { approved: true, subject: 'user-1' };
      },
      ...overrides,
    }).routes()
  );
  return app;
};

describe('oauthServer (Koa adapter)', () => {
  test('serves authorization server metadata', async () => {
    const res = await request(buildApp().callback()).get(
      '/.well-known/oauth-authorization-server'
    );
    expect(res.status).toBe(200);
    expect(res.body.token_endpoint).toBe('https://api.example.com/token');
  });

  test('does not serve protected-resource metadata unless resource is set', async () => {
    const res = await request(buildApp().callback()).get(
      '/.well-known/oauth-protected-resource'
    );
    expect(res.status).toBe(404);
  });

  test('serves protected-resource metadata when resource is set', async () => {
    const res = await request(
      buildApp({ resource: 'https://mcp.example.com' }).callback()
    ).get('/.well-known/oauth-protected-resource');
    expect(res.status).toBe(200);
    expect(res.body.resource).toBe('https://mcp.example.com');
  });

  test('authorize redirects with a code (normalizes array query params)', async () => {
    const res = await request(buildApp().callback())
      .get('/authorize')
      // Duplicate client_id exercises the array→string query normalization.
      .query(
        'response_type=code&client_id=client-abc&client_id=client-abc' +
          '&redirect_uri=https://app.example.com/callback' +
          `&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256&state=s`
      );
    expect(res.status).toBe(302);
    const url = new URL(res.headers.location);
    expect(url.searchParams.get('code')).toBeTruthy();
    expect(url.searchParams.get('state')).toBe('s');
  });

  test('full register → authorize → token round-trip', async () => {
    const app = buildApp();
    const callback = app.callback();

    const reg = await request(callback)
      .post('/register')
      .send({
        redirect_uris: ['https://app.example.com/callback'],
        token_endpoint_auth_method: 'none',
      });
    expect(reg.status).toBe(201);

    const authRes = await request(callback).get('/authorize').query({
      response_type: 'code',
      client_id: reg.body.client_id,
      redirect_uri: 'https://app.example.com/callback',
      code_challenge: CODE_CHALLENGE,
      code_challenge_method: 'S256',
    });
    const code = new URL(authRes.headers.location).searchParams.get('code')!;

    const tokenRes = await request(callback).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: reg.body.client_id,
      code_verifier: CODE_VERIFIER,
    });
    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.access_token).toBe('access');
  });
});

describe('createProtectedResourceMetadataMiddleware', () => {
  test('serves the metadata document', async () => {
    const app = new App();
    app.use(
      createProtectedResourceMetadataMiddleware({
        resource: 'https://mcp.example.com',
        authorizationServers: ['https://api.example.com'],
      })
    );
    const res = await request(app.callback()).get(
      '/.well-known/oauth-protected-resource'
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      resource: 'https://mcp.example.com',
      authorization_servers: ['https://api.example.com'],
    });
  });

  test('passes through non-matching requests', async () => {
    const app = new App();
    app.use(
      createProtectedResourceMetadataMiddleware({
        resource: 'https://mcp.example.com',
        authorizationServers: ['https://api.example.com'],
      })
    );
    app.use((ctx: Context) => {
      ctx.body = 'downstream';
    });
    const res = await request(app.callback()).get('/other');
    expect(res.status).toBe(200);
    expect(res.text).toBe('downstream');
  });
});
