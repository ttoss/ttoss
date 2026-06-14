import { createHash } from 'node:crypto';

import { App, bodyParser } from '@ttoss/http-server';
import {
  type AuthCodeStore,
  type ClientStore,
  createMcpAuthServer,
  type McpAuthServerOptions,
  type OAuthClient,
  type StoredAuthorizationCode,
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

const createClientStore = (initial: OAuthClient[] = []): ClientStore => {
  const clients = new Map<string, OAuthClient>(
    initial.map((c) => {
      return [c.client_id, c];
    })
  );
  return {
    get: (clientId) => {
      return clients.get(clientId);
    },
    register: (client) => {
      clients.set(client.client_id, client);
    },
  };
};

const createAuthCodeStore = (): AuthCodeStore => {
  const codes = new Map<string, StoredAuthorizationCode>();
  return {
    save: (code) => {
      codes.set(code.code, code);
    },
    get: (code) => {
      return codes.get(code);
    },
    delete: (code) => {
      codes.delete(code);
    },
  };
};

const confidentialClient: OAuthClient = {
  client_id: 'client-abc',
  client_secret: 'secret-xyz',
  redirect_uris: ['https://app.example.com/callback'],
};

const publicClient: OAuthClient = {
  client_id: 'public-client',
  redirect_uris: ['https://app.example.com/callback'],
  token_endpoint_auth_method: 'none',
};

const buildApp = (options: Partial<McpAuthServerOptions> = {}) => {
  const authServer = createMcpAuthServer({
    issuer: 'https://api.example.com',
    clientStore: createClientStore([confidentialClient, publicClient]),
    authCodeStore: createAuthCodeStore(),
    issueTokens: () => {
      return {
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
        expiresIn: 3600,
      };
    },
    onAuthorize: () => {
      return { approved: true, subject: 'user-123' };
    },
    ...options,
  });

  const app = new App();
  app.use(bodyParser());
  app.use(authServer.routes());
  return app;
};

describe('createMcpAuthServer — discovery metadata', () => {
  test('serves RFC 8414 authorization server metadata', async () => {
    const res = await request(buildApp().callback()).get(
      '/.well-known/oauth-authorization-server'
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      issuer: 'https://api.example.com',
      authorization_endpoint: 'https://api.example.com/authorize',
      token_endpoint: 'https://api.example.com/token',
      registration_endpoint: 'https://api.example.com/register',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post',
        'none',
      ],
    });
  });

  test('includes scopes_supported when configured', async () => {
    const res = await request(
      buildApp({ scopesSupported: ['mcp:access'] }).callback()
    ).get('/.well-known/oauth-authorization-server');

    expect(res.body.scopes_supported).toEqual(['mcp:access']);
  });

  test('strips trailing slash from issuer when building endpoint URLs', async () => {
    const res = await request(
      buildApp({ issuer: 'https://api.example.com/' }).callback()
    ).get('/.well-known/oauth-authorization-server');

    expect(res.body.authorization_endpoint).toBe(
      'https://api.example.com/authorize'
    );
  });

  test('does not serve protected-resource metadata unless resource is set', async () => {
    const res = await request(buildApp().callback()).get(
      '/.well-known/oauth-protected-resource'
    );

    expect(res.status).toBe(404);
  });

  test('serves RFC 9728 protected-resource metadata when resource is set', async () => {
    const res = await request(
      buildApp({ resource: 'https://mcp.example.com' }).callback()
    ).get('/.well-known/oauth-protected-resource');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      resource: 'https://mcp.example.com',
      authorization_servers: ['https://api.example.com'],
    });
  });

  test('honours custom endpoint paths in metadata', async () => {
    const res = await request(
      buildApp({
        endpoints: {
          authorize: '/oauth/authorize',
          token: '/oauth/token',
          register: '/oauth/register',
        },
      }).callback()
    ).get('/.well-known/oauth-authorization-server');

    expect(res.body.authorization_endpoint).toBe(
      'https://api.example.com/oauth/authorize'
    );
    expect(res.body.token_endpoint).toBe('https://api.example.com/oauth/token');
    expect(res.body.registration_endpoint).toBe(
      'https://api.example.com/oauth/register'
    );
  });
});

describe('createMcpAuthServer — authorization endpoint', () => {
  const authorize = (
    app: ReturnType<typeof buildApp>,
    query: Record<string, string>
  ) => {
    return request(app.callback()).get('/authorize').query(query);
  };

  const validQuery = {
    response_type: 'code',
    client_id: 'client-abc',
    redirect_uri: 'https://app.example.com/callback',
    code_challenge: CODE_CHALLENGE,
    code_challenge_method: 'S256',
    state: 'state-value',
    scope: 'mcp:access',
  };

  test('returns 400 when client_id is missing', async () => {
    const res = await authorize(buildApp(), {
      response_type: 'code',
      redirect_uri: 'https://app.example.com/callback',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  test('returns 400 for an unknown client_id', async () => {
    const res = await authorize(buildApp(), {
      ...validQuery,
      client_id: 'nope',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_client');
  });

  test('returns 400 when redirect_uri is not registered', async () => {
    const res = await authorize(buildApp(), {
      ...validQuery,
      redirect_uri: 'https://evil.example.com/callback',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  test('redirects with error when response_type is not code', async () => {
    const res = await authorize(buildApp(), {
      ...validQuery,
      response_type: 'token',
    });

    expect(res.status).toBe(302);
    const location = new URL(res.headers.location);
    expect(location.searchParams.get('error')).toBe(
      'unsupported_response_type'
    );
    expect(location.searchParams.get('state')).toBe('state-value');
  });

  test('redirects with error when code_challenge is missing (PKCE required)', async () => {
    const { code_challenge: _omit, ...rest } = validQuery;
    const res = await authorize(buildApp(), rest);

    expect(res.status).toBe(302);
    expect(new URL(res.headers.location).searchParams.get('error')).toBe(
      'invalid_request'
    );
  });

  test('redirects with error when code_challenge_method is not S256', async () => {
    const res = await authorize(buildApp(), {
      ...validQuery,
      code_challenge_method: 'plain',
    });

    expect(res.status).toBe(302);
    expect(
      new URL(res.headers.location).searchParams.get('error_description')
    ).toContain('S256');
  });

  test('defaults missing code_challenge_method to plain and rejects it', async () => {
    const { code_challenge_method: _omit, ...rest } = validQuery;
    const res = await authorize(buildApp(), rest);

    expect(res.status).toBe(302);
    expect(new URL(res.headers.location).searchParams.get('error')).toBe(
      'invalid_request'
    );
  });

  test('redirects to redirect_uri with code and state when approved', async () => {
    const res = await authorize(buildApp(), validQuery);

    expect(res.status).toBe(302);
    const location = new URL(res.headers.location);
    expect(location.origin + location.pathname).toBe(
      'https://app.example.com/callback'
    );
    expect(location.searchParams.get('code')).toBeTruthy();
    expect(location.searchParams.get('state')).toBe('state-value');
  });

  test('omits state from redirect when not provided', async () => {
    const { state: _omit, ...rest } = validQuery;
    const res = await authorize(buildApp(), rest);

    expect(res.status).toBe(302);
    expect(new URL(res.headers.location).searchParams.has('state')).toBe(false);
  });

  test('does nothing further when the app handles the response (approved: false)', async () => {
    const onAuthorize = jest.fn(({ ctx }) => {
      ctx.status = 302;
      ctx.set('location', 'https://api.example.com/login');
      return { approved: false } as const;
    });

    const res = await authorize(buildApp({ onAuthorize }), validQuery);

    expect(onAuthorize).toHaveBeenCalled();
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://api.example.com/login');
  });

  test('passes the validated request to onAuthorize', async () => {
    const onAuthorize = jest.fn(() => {
      return { approved: true, subject: 'u' } as const;
    });

    await authorize(buildApp({ onAuthorize }), validQuery);

    expect(onAuthorize).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          clientId: 'client-abc',
          redirectUri: 'https://app.example.com/callback',
          scopes: ['mcp:access'],
          state: 'state-value',
          codeChallenge: CODE_CHALLENGE,
          codeChallengeMethod: 'S256',
        }),
      })
    );
  });
});

describe('createMcpAuthServer — token endpoint (authorization_code)', () => {
  // Runs the full authorize → token exchange against a single app instance so
  // the in-memory auth code store is shared between the two requests.
  const setup = (options: Partial<McpAuthServerOptions> = {}) => {
    const authCodeStore = createAuthCodeStore();
    const clientStore = createClientStore([confidentialClient, publicClient]);
    const authServer = createMcpAuthServer({
      issuer: 'https://api.example.com',
      clientStore,
      authCodeStore,
      issueTokens: () => {
        return {
          accessToken: 'access-token-value',
          refreshToken: 'refresh-token-value',
          expiresIn: 3600,
        };
      },
      onAuthorize: () => {
        return { approved: true, subject: 'user-123' };
      },
      ...options,
    });
    const app = new App();
    app.use(bodyParser());
    app.use(authServer.routes());
    return { app, authCodeStore };
  };

  const obtainCode = async (
    app: ReturnType<typeof setup>['app'],
    clientId = 'client-abc'
  ): Promise<string> => {
    const res = await request(app.callback()).get('/authorize').query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: 'https://app.example.com/callback',
      code_challenge: CODE_CHALLENGE,
      code_challenge_method: 'S256',
    });
    return new URL(res.headers.location).searchParams.get('code')!;
  };

  test('exchanges a valid code (with PKCE + secret) for tokens', async () => {
    const { app } = setup();
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      access_token: 'access-token-value',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'refresh-token-value',
      scope: '',
    });
  });

  test('authenticates a confidential client via Basic auth header', async () => {
    const { app } = setup();
    const code = await obtainCode(app);

    const basic = Buffer.from('client-abc:secret-xyz').toString('base64');
    const res = await request(app.callback())
      .post('/token')
      .set('Authorization', `Basic ${basic}`)
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://app.example.com/callback',
        code_verifier: CODE_VERIFIER,
      });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('access-token-value');
  });

  test('exchanges a code for a public client (no secret, PKCE only)', async () => {
    const { app } = setup();
    const code = await obtainCode(app, 'public-client');

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'public-client',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('access-token-value');
  });

  test('omits refresh_token and expires_in when issueTokens does not return them', async () => {
    const { app } = setup({
      issueTokens: () => {
        return { accessToken: 'only-access', scope: 'mcp:access' };
      },
    });
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.body).toEqual({
      access_token: 'only-access',
      token_type: 'Bearer',
      scope: 'mcp:access',
    });
  });

  test('returns 401 invalid_client when the secret is wrong', async () => {
    const { app } = setup();
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'wrong',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_client');
  });

  test('returns 401 invalid_client for an unknown client', async () => {
    const { app } = setup();

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code: 'whatever',
      client_id: 'ghost',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_client');
  });

  test('returns 401 invalid_client when no client_id is provided', async () => {
    const { app } = setup();

    const res = await request(app.callback())
      .post('/token')
      .type('form')
      .send({ grant_type: 'authorization_code', code: 'x' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_client');
  });

  test('returns 400 invalid_request when code is missing', async () => {
    const { app } = setup();

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  test('returns 400 invalid_grant for an unknown code', async () => {
    const { app } = setup();

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code: 'does-not-exist',
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_grant');
  });

  test('rejects a replayed (already used) code', async () => {
    const { app } = setup();
    const code = await obtainCode(app);

    const exchange = () => {
      return request(app.callback()).post('/token').type('form').send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://app.example.com/callback',
        client_id: 'client-abc',
        client_secret: 'secret-xyz',
        code_verifier: CODE_VERIFIER,
      });
    };

    expect((await exchange()).status).toBe(200);
    const second = await exchange();
    expect(second.status).toBe(400);
    expect(second.body.error).toBe('invalid_grant');
  });

  test('returns 400 invalid_grant for an expired code', async () => {
    const { app } = setup({ authorizationCodeTtl: -1 });
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_grant');
    expect(res.body.error_description).toContain('expired');
  });

  test('returns 400 invalid_grant when the code was issued to another client', async () => {
    const { app } = setup();
    const code = await obtainCode(app, 'public-client');

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_grant');
    expect(res.body.error_description).toContain('not issued to this client');
  });

  test('returns 400 invalid_grant on redirect_uri mismatch', async () => {
    const { app } = setup();
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/other',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });

    expect(res.status).toBe(400);
    expect(res.body.error_description).toContain('redirect_uri');
  });

  test('returns 400 invalid_request when code_verifier is missing', async () => {
    const { app } = setup();
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
    expect(res.body.error_description).toContain('code_verifier');
  });

  test('returns 400 invalid_grant when PKCE verification fails', async () => {
    const { app } = setup();
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: 'wrong-verifier',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_grant');
    expect(res.body.error_description).toContain('PKCE');
  });

  test('grants requested scopes through to issueTokens and the response', async () => {
    const issueTokens = jest.fn(() => {
      return { accessToken: 'a' };
    });
    const { app } = setup({
      onAuthorize: () => {
        return { approved: true, subject: 'u', scopes: ['mcp:access', 'read'] };
      },
      issueTokens,
    });
    const code = await obtainCode(app);

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });

    expect(issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'u',
        scopes: ['mcp:access', 'read'],
      })
    );
    expect(res.body.scope).toBe('mcp:access read');
  });
});

describe('createMcpAuthServer — token endpoint (refresh_token)', () => {
  test('issues new tokens for a valid refresh token', async () => {
    const onRefreshToken = jest.fn(() => {
      return { subject: 'user-123', scopes: ['mcp:access'] };
    });
    const app = buildApp({
      onRefreshToken,
      issueTokens: () => {
        return { accessToken: 'new-access', refreshToken: 'new-refresh' };
      },
    });

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'refresh_token',
      refresh_token: 'old-refresh',
      client_id: 'public-client',
    });

    expect(res.status).toBe(200);
    expect(onRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'old-refresh',
        scopes: [],
      })
    );
    expect(res.body.access_token).toBe('new-access');
    expect(res.body.scope).toBe('mcp:access');
  });

  test('forwards requested scopes to onRefreshToken', async () => {
    const onRefreshToken = jest.fn(() => {
      return { subject: 'u', scopes: ['read'] };
    });
    const app = buildApp({ onRefreshToken });

    await request(app.callback()).post('/token').type('form').send({
      grant_type: 'refresh_token',
      refresh_token: 'tok',
      client_id: 'public-client',
      scope: 'read write',
    });

    expect(onRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: ['read', 'write'] })
    );
  });

  test('returns unsupported_grant_type when onRefreshToken is not configured', async () => {
    const res = await request(buildApp().callback())
      .post('/token')
      .type('form')
      .send({
        grant_type: 'refresh_token',
        refresh_token: 'tok',
        client_id: 'public-client',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unsupported_grant_type');
  });

  test('returns 400 invalid_request when refresh_token is missing', async () => {
    const app = buildApp({
      onRefreshToken: () => {
        return { subject: 'u', scopes: [] };
      },
    });

    const res = await request(app.callback())
      .post('/token')
      .type('form')
      .send({ grant_type: 'refresh_token', client_id: 'public-client' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  test('returns 400 invalid_grant when the refresh token is rejected', async () => {
    const app = buildApp({
      onRefreshToken: () => {
        return undefined;
      },
    });

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'refresh_token',
      refresh_token: 'bad',
      client_id: 'public-client',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_grant');
  });

  test('returns 401 invalid_client before checking the grant', async () => {
    const app = buildApp({
      onRefreshToken: () => {
        return { subject: 'u', scopes: [] };
      },
    });

    const res = await request(app.callback()).post('/token').type('form').send({
      grant_type: 'refresh_token',
      refresh_token: 'tok',
      client_id: 'client-abc',
      client_secret: 'wrong',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_client');
  });
});

describe('createMcpAuthServer — token endpoint (grant types)', () => {
  test('returns unsupported_grant_type for an unknown grant', async () => {
    const res = await request(buildApp().callback())
      .post('/token')
      .type('form')
      .send({ grant_type: 'password' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unsupported_grant_type');
  });

  test('returns unsupported_grant_type when grant_type is missing', async () => {
    const res = await request(buildApp().callback())
      .post('/token')
      .type('form')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unsupported_grant_type');
  });

  test('handles a token request with no parsed body', async () => {
    const res = await request(buildApp().callback()).post('/token');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unsupported_grant_type');
  });

  test('ignores a malformed Basic auth header without a colon', async () => {
    const basic = Buffer.from('no-colon-here').toString('base64');
    const res = await request(buildApp().callback())
      .post('/token')
      .set('Authorization', `Basic ${basic}`)
      .type('form')
      .send({ grant_type: 'authorization_code', code: 'x' });

    // Falls back to body credentials, which are absent → invalid_client.
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_client');
  });
});

describe('createMcpAuthServer — dynamic client registration (RFC 7591)', () => {
  test('registers a confidential client and returns a secret', async () => {
    const clientStore = createClientStore();
    const authServer = createMcpAuthServer({
      issuer: 'https://api.example.com',
      clientStore,
      authCodeStore: createAuthCodeStore(),
      issueTokens: () => {
        return { accessToken: 'a' };
      },
      onAuthorize: () => {
        return { approved: true, subject: 'u' };
      },
    });
    const app = new App();
    app.use(bodyParser());
    app.use(authServer.routes());

    const res = await request(app.callback())
      .post('/register')
      .send({
        redirect_uris: ['https://client.example.com/cb'],
        client_name: 'My MCP Client',
      });

    expect(res.status).toBe(201);
    expect(res.body.client_id).toBeTruthy();
    expect(res.body.client_secret).toBeTruthy();
    expect(res.body.client_secret_expires_at).toBe(0);
    expect(res.body.redirect_uris).toEqual(['https://client.example.com/cb']);
    expect(res.body.grant_types).toEqual([
      'authorization_code',
      'refresh_token',
    ]);
    expect(res.body.response_types).toEqual(['code']);
    expect(res.body.client_name).toBe('My MCP Client');

    // The registered client is resolvable from the store and usable.
    const stored = await clientStore.get(res.body.client_id);
    expect(stored?.client_secret).toBe(res.body.client_secret);
  });

  test('registers a public client (token_endpoint_auth_method: none) without a secret', async () => {
    const res = await request(buildApp().callback())
      .post('/register')
      .send({
        redirect_uris: ['https://client.example.com/cb'],
        token_endpoint_auth_method: 'none',
      });

    expect(res.status).toBe(201);
    expect(res.body.client_secret).toBeUndefined();
    expect(res.body.token_endpoint_auth_method).toBe('none');
  });

  test('preserves explicitly requested grant and response types', async () => {
    const res = await request(buildApp().callback())
      .post('/register')
      .send({
        redirect_uris: ['https://client.example.com/cb'],
        grant_types: ['authorization_code'],
        response_types: ['code'],
      });

    expect(res.body.grant_types).toEqual(['authorization_code']);
  });

  test('returns 400 when redirect_uris is missing', async () => {
    const res = await request(buildApp().callback())
      .post('/register')
      .send({ client_name: 'No redirects' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_redirect_uri');
  });

  test('returns 400 when redirect_uris is empty', async () => {
    const res = await request(buildApp().callback())
      .post('/register')
      .send({ redirect_uris: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_redirect_uri');
  });

  test('returns 400 when redirect_uris contains a non-string', async () => {
    const res = await request(buildApp().callback())
      .post('/register')
      .send({ redirect_uris: [42] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_redirect_uri');
  });

  test('returns 400 when the registration request has no body', async () => {
    const res = await request(buildApp().callback()).post('/register');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_redirect_uri');
  });
});

describe('createMcpAuthServer — end-to-end flow', () => {
  test('register → authorize → token round-trip', async () => {
    const clientStore = createClientStore();
    const authCodeStore = createAuthCodeStore();
    const authServer = createMcpAuthServer({
      issuer: 'https://api.example.com',
      clientStore,
      authCodeStore,
      issueTokens: ({ subject, scopes }) => {
        return {
          accessToken: `token-for-${subject}`,
          refreshToken: 'refresh',
          scope: scopes.join(' '),
        };
      },
      onAuthorize: () => {
        return { approved: true, subject: 'alice', scopes: ['mcp:access'] };
      },
    });
    const app = new App();
    app.use(bodyParser());
    app.use(authServer.routes());
    const callback = app.callback();

    // 1. Dynamic client registration
    const registration = await request(callback)
      .post('/register')
      .send({
        redirect_uris: ['https://client.example.com/cb'],
        token_endpoint_auth_method: 'none',
      });
    const clientId = registration.body.client_id;

    // 2. Authorization request
    const authRes = await request(callback).get('/authorize').query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: CODE_CHALLENGE,
      code_challenge_method: 'S256',
    });
    const code = new URL(authRes.headers.location).searchParams.get('code')!;

    // 3. Token exchange
    const tokenRes = await request(callback).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://client.example.com/cb',
      client_id: clientId,
      code_verifier: CODE_VERIFIER,
    });

    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.access_token).toBe('token-for-alice');
    expect(tokenRes.body.scope).toBe('mcp:access');
  });
});
