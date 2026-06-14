import { createHash } from 'node:crypto';

import {
  type AuthCodeStore,
  type ClientStore,
  createOAuthServer,
  getWwwAuthenticateHeader,
  type OAuthClient,
  type OAuthServerOptions,
  type StoredAuthorizationCode,
} from '../../../src/index';

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

const build = (options: Partial<OAuthServerOptions> = {}) => {
  return createOAuthServer({
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

const locationParams = (redirect: string | undefined) => {
  return new URL(redirect!).searchParams;
};

describe('createOAuthServer — discovery metadata', () => {
  test('builds RFC 8414 authorization server metadata', () => {
    const res = build().authorizationServerMetadata();

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

  test('includes scopes_supported when configured', () => {
    const res = build({
      scopesSupported: ['mcp:access'],
    }).authorizationServerMetadata();
    expect(
      (res.body as { scopes_supported: string[] }).scopes_supported
    ).toEqual(['mcp:access']);
  });

  test('strips trailing slash from issuer when building endpoint URLs', () => {
    const res = build({
      issuer: 'https://api.example.com/',
    }).authorizationServerMetadata();
    expect(
      (res.body as { authorization_endpoint: string }).authorization_endpoint
    ).toBe('https://api.example.com/authorize');
  });

  test('honours custom endpoint paths in metadata and paths', () => {
    const server = build({
      endpoints: {
        authorize: '/oauth/authorize',
        token: '/oauth/token',
        register: '/oauth/register',
      },
    });
    expect(server.paths).toEqual({
      authorize: '/oauth/authorize',
      token: '/oauth/token',
      register: '/oauth/register',
    });
    const body = server.authorizationServerMetadata().body as {
      authorization_endpoint: string;
      token_endpoint: string;
      registration_endpoint: string;
    };
    expect(body.authorization_endpoint).toBe(
      'https://api.example.com/oauth/authorize'
    );
    expect(body.token_endpoint).toBe('https://api.example.com/oauth/token');
    expect(body.registration_endpoint).toBe(
      'https://api.example.com/oauth/register'
    );
  });

  test('returns undefined protected-resource metadata unless resource is set', () => {
    expect(build().protectedResourceMetadata()).toBeUndefined();
  });

  test('builds RFC 9728 protected-resource metadata when resource is set', () => {
    const res = build({
      resource: 'https://mcp.example.com',
    }).protectedResourceMetadata();
    expect(res).toEqual({
      status: 200,
      body: {
        resource: 'https://mcp.example.com',
        authorization_servers: ['https://api.example.com'],
      },
    });
  });
});

describe('createOAuthServer — authorize', () => {
  const authorize = (
    server: ReturnType<typeof build>,
    query: Record<string, string>
  ) => {
    return server.authorize({ query, body: {}, headers: {} });
  };

  test('400 invalid_request when client_id is missing', async () => {
    const res = await authorize(build(), {
      response_type: 'code',
      redirect_uri: 'https://app.example.com/callback',
    });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe('invalid_request');
  });

  test('400 invalid_client for an unknown client_id', async () => {
    const res = await authorize(build(), { ...validQuery, client_id: 'nope' });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe('invalid_client');
  });

  test('400 invalid_request when redirect_uri is not registered', async () => {
    const res = await authorize(build(), {
      ...validQuery,
      redirect_uri: 'https://evil.example.com/callback',
    });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe('invalid_request');
  });

  test('redirects with error when response_type is not code', async () => {
    const res = await authorize(build(), {
      ...validQuery,
      response_type: 'token',
    });
    expect(res.status).toBe(302);
    expect(locationParams(res.redirect).get('error')).toBe(
      'unsupported_response_type'
    );
    expect(locationParams(res.redirect).get('state')).toBe('state-value');
  });

  test('redirects with error when code_challenge is missing', async () => {
    const { code_challenge: _omit, ...rest } = validQuery;
    const res = await authorize(build(), rest);
    expect(res.status).toBe(302);
    expect(locationParams(res.redirect).get('error')).toBe('invalid_request');
  });

  test('redirects with error when code_challenge_method is not S256', async () => {
    const res = await authorize(build(), {
      ...validQuery,
      code_challenge_method: 'plain',
    });
    expect(res.status).toBe(302);
    expect(locationParams(res.redirect).get('error_description')).toContain(
      'S256'
    );
  });

  test('defaults missing code_challenge_method to plain and rejects it', async () => {
    const { code_challenge_method: _omit, ...rest } = validQuery;
    const res = await authorize(build(), rest);
    expect(res.status).toBe(302);
    expect(locationParams(res.redirect).get('error')).toBe('invalid_request');
  });

  test('redirects with code and state when approved', async () => {
    const res = await authorize(build(), validQuery);
    expect(res.status).toBe(302);
    const url = new URL(res.redirect!);
    expect(url.origin + url.pathname).toBe('https://app.example.com/callback');
    expect(url.searchParams.get('code')).toBeTruthy();
    expect(url.searchParams.get('state')).toBe('state-value');
  });

  test('omits state from redirect when not provided', async () => {
    const { state: _omit, ...rest } = validQuery;
    const res = await authorize(build(), rest);
    expect(locationParams(res.redirect).has('state')).toBe(false);
  });

  test('returns a redirect when the app declines with one (approved: false)', async () => {
    const onAuthorize = jest.fn(() => {
      return {
        approved: false,
        redirect: 'https://api.example.com/login',
      } as const;
    });
    const res = await authorize(build({ onAuthorize }), validQuery);
    expect(onAuthorize).toHaveBeenCalled();
    expect(res.status).toBe(302);
    expect(res.redirect).toBe('https://api.example.com/login');
  });

  test('returns a status/body when the app declines without a redirect', async () => {
    const onAuthorize = jest.fn(() => {
      return {
        approved: false,
        status: 403,
        body: { error: 'denied' },
      } as const;
    });
    const res = await authorize(build({ onAuthorize }), validQuery);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'denied' });
  });

  test('defaults a bare decline to 401', async () => {
    const res = await authorize(
      build({
        onAuthorize: () => {
          return { approved: false };
        },
      }),
      validQuery
    );
    expect(res.status).toBe(401);
  });

  test('passes the validated request and headers to onAuthorize', async () => {
    const onAuthorize = jest.fn(() => {
      return { approved: true, subject: 'u' } as const;
    });
    await build({ onAuthorize }).authorize({
      query: validQuery,
      body: {},
      headers: { cookie: 'session=abc' },
    });
    expect(onAuthorize).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { cookie: 'session=abc' },
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

describe('createOAuthServer — token (authorization_code)', () => {
  const setup = (options: Partial<OAuthServerOptions> = {}) => {
    const server = build(options);
    return server;
  };

  const obtainCode = async (
    server: ReturnType<typeof build>,
    clientId = 'client-abc'
  ): Promise<string> => {
    const res = await server.authorize({
      query: {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://app.example.com/callback',
        code_challenge: CODE_CHALLENGE,
        code_challenge_method: 'S256',
      },
      body: {},
      headers: {},
    });
    return new URL(res.redirect!).searchParams.get('code')!;
  };

  const token = (
    server: ReturnType<typeof build>,
    body: Record<string, unknown>,
    headers: Record<string, string | undefined> = {}
  ) => {
    return server.token({ query: {}, body, headers });
  };

  test('exchanges a valid code (PKCE + secret) for tokens', async () => {
    const server = setup();
    const code = await obtainCode(server);
    const res = await token(server, {
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
    const server = setup();
    const code = await obtainCode(server);
    const basic = Buffer.from('client-abc:secret-xyz').toString('base64');
    const res = await token(
      server,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://app.example.com/callback',
        code_verifier: CODE_VERIFIER,
      },
      { authorization: `Basic ${basic}` }
    );
    expect(res.status).toBe(200);
    expect((res.body as { access_token: string }).access_token).toBe(
      'access-token-value'
    );
  });

  test('exchanges a code for a public client (no secret, PKCE only)', async () => {
    const server = setup();
    const code = await obtainCode(server, 'public-client');
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'public-client',
      code_verifier: CODE_VERIFIER,
    });
    expect(res.status).toBe(200);
  });

  test('omits refresh_token and expires_in when not returned', async () => {
    const server = setup({
      issueTokens: () => {
        return { accessToken: 'only-access', scope: 'mcp:access' };
      },
    });
    const code = await obtainCode(server);
    const res = await token(server, {
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

  test('401 invalid_client when the secret is wrong', async () => {
    const server = setup();
    const code = await obtainCode(server);
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'wrong',
      code_verifier: CODE_VERIFIER,
    });
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('invalid_client');
  });

  test('401 invalid_client for an unknown client', async () => {
    const res = await token(setup(), {
      grant_type: 'authorization_code',
      code: 'whatever',
      client_id: 'ghost',
    });
    expect(res.status).toBe(401);
  });

  test('401 invalid_client when no client_id is provided', async () => {
    const res = await token(setup(), {
      grant_type: 'authorization_code',
      code: 'x',
    });
    expect(res.status).toBe(401);
  });

  test('400 invalid_request when code is missing', async () => {
    const res = await token(setup(), {
      grant_type: 'authorization_code',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
    });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe('invalid_request');
  });

  test('400 invalid_grant for an unknown code', async () => {
    const res = await token(setup(), {
      grant_type: 'authorization_code',
      code: 'does-not-exist',
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe('invalid_grant');
  });

  test('rejects a replayed code', async () => {
    const server = setup();
    const code = await obtainCode(server);
    const body = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    };
    expect((await token(server, body)).status).toBe(200);
    const second = await token(server, body);
    expect(second.status).toBe(400);
    expect((second.body as { error: string }).error).toBe('invalid_grant');
  });

  test('400 invalid_grant for an expired code', async () => {
    const server = setup({ authorizationCodeTtl: -1 });
    const code = await obtainCode(server);
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });
    expect(res.status).toBe(400);
    expect(
      (res.body as { error_description: string }).error_description
    ).toContain('expired');
  });

  test('400 invalid_grant when the code was issued to another client', async () => {
    const server = setup();
    const code = await obtainCode(server, 'public-client');
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });
    expect(
      (res.body as { error_description: string }).error_description
    ).toContain('not issued to this client');
  });

  test('400 invalid_grant on redirect_uri mismatch', async () => {
    const server = setup();
    const code = await obtainCode(server);
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/other',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });
    expect(
      (res.body as { error_description: string }).error_description
    ).toContain('redirect_uri');
  });

  test('400 invalid_request when code_verifier is missing', async () => {
    const server = setup();
    const code = await obtainCode(server);
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
    });
    expect(
      (res.body as { error_description: string }).error_description
    ).toContain('code_verifier');
  });

  test('400 invalid_grant when PKCE verification fails', async () => {
    const server = setup();
    const code = await obtainCode(server);
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: 'wrong-verifier',
    });
    expect(
      (res.body as { error_description: string }).error_description
    ).toContain('PKCE');
  });

  test('grants requested scopes through to issueTokens and the response', async () => {
    const issueTokens = jest.fn(() => {
      return { accessToken: 'a' };
    });
    const server = setup({
      onAuthorize: () => {
        return { approved: true, subject: 'u', scopes: ['mcp:access', 'read'] };
      },
      issueTokens,
    });
    const code = await obtainCode(server);
    const res = await token(server, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'client-abc',
      client_secret: 'secret-xyz',
      code_verifier: CODE_VERIFIER,
    });
    expect(issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'u', scopes: ['mcp:access', 'read'] })
    );
    expect((res.body as { scope: string }).scope).toBe('mcp:access read');
  });

  test('ignores a malformed Basic auth header without a colon', async () => {
    const basic = Buffer.from('no-colon-here').toString('base64');
    const res = await token(
      setup(),
      { grant_type: 'authorization_code', code: 'x' },
      { authorization: `Basic ${basic}` }
    );
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('invalid_client');
  });
});

describe('createOAuthServer — token (refresh_token)', () => {
  const token = (
    server: ReturnType<typeof build>,
    body: Record<string, unknown>
  ) => {
    return server.token({ query: {}, body, headers: {} });
  };

  test('issues new tokens for a valid refresh token', async () => {
    const onRefreshToken = jest.fn(() => {
      return { subject: 'user-123', scopes: ['mcp:access'] };
    });
    const server = build({
      onRefreshToken,
      issueTokens: () => {
        return { accessToken: 'new-access', refreshToken: 'new-refresh' };
      },
    });
    const res = await token(server, {
      grant_type: 'refresh_token',
      refresh_token: 'old-refresh',
      client_id: 'public-client',
    });
    expect(res.status).toBe(200);
    expect(onRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: 'old-refresh', scopes: [] })
    );
    expect((res.body as { access_token: string }).access_token).toBe(
      'new-access'
    );
  });

  test('forwards requested scopes to onRefreshToken', async () => {
    const onRefreshToken = jest.fn(() => {
      return { subject: 'u', scopes: ['read'] };
    });
    await token(build({ onRefreshToken }), {
      grant_type: 'refresh_token',
      refresh_token: 'tok',
      client_id: 'public-client',
      scope: 'read write',
    });
    expect(onRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: ['read', 'write'] })
    );
  });

  test('unsupported_grant_type when onRefreshToken is not configured', async () => {
    const res = await token(build(), {
      grant_type: 'refresh_token',
      refresh_token: 'tok',
      client_id: 'public-client',
    });
    expect((res.body as { error: string }).error).toBe(
      'unsupported_grant_type'
    );
  });

  test('400 invalid_request when refresh_token is missing', async () => {
    const res = await token(
      build({
        onRefreshToken: () => {
          return { subject: 'u', scopes: [] };
        },
      }),
      { grant_type: 'refresh_token', client_id: 'public-client' }
    );
    expect((res.body as { error: string }).error).toBe('invalid_request');
  });

  test('400 invalid_grant when the refresh token is rejected', async () => {
    const res = await token(
      build({
        onRefreshToken: () => {
          return undefined;
        },
      }),
      {
        grant_type: 'refresh_token',
        refresh_token: 'bad',
        client_id: 'public-client',
      }
    );
    expect((res.body as { error: string }).error).toBe('invalid_grant');
  });

  test('401 invalid_client before checking the grant', async () => {
    const res = await token(
      build({
        onRefreshToken: () => {
          return { subject: 'u', scopes: [] };
        },
      }),
      {
        grant_type: 'refresh_token',
        refresh_token: 'tok',
        client_id: 'client-abc',
        client_secret: 'wrong',
      }
    );
    expect(res.status).toBe(401);
  });
});

describe('createOAuthServer — token (grant types)', () => {
  test('unsupported_grant_type for an unknown grant', async () => {
    const res = await build().token({
      query: {},
      body: { grant_type: 'password' },
      headers: {},
    });
    expect((res.body as { error: string }).error).toBe(
      'unsupported_grant_type'
    );
  });

  test('unsupported_grant_type when grant_type is missing', async () => {
    const res = await build().token({ query: {}, body: {}, headers: {} });
    expect((res.body as { error: string }).error).toBe(
      'unsupported_grant_type'
    );
  });
});

describe('createOAuthServer — register (RFC 7591)', () => {
  const register = (
    server: ReturnType<typeof build>,
    body: Record<string, unknown>
  ) => {
    return server.register({ query: {}, body, headers: {} });
  };

  test('registers a confidential client and returns a secret', async () => {
    const clientStore = createClientStore();
    const server = build({ clientStore });
    const res = await register(server, {
      redirect_uris: ['https://client.example.com/cb'],
      client_name: 'My Client',
    });
    expect(res.status).toBe(201);
    const body = res.body as OAuthClient & { client_secret_expires_at: number };
    expect(body.client_id).toBeTruthy();
    expect(body.client_secret).toBeTruthy();
    expect(body.client_secret_expires_at).toBe(0);
    expect(body.grant_types).toEqual(['authorization_code', 'refresh_token']);
    expect(body.response_types).toEqual(['code']);
    const stored = await clientStore.get(body.client_id);
    expect(stored?.client_secret).toBe(body.client_secret);
  });

  test('registers a public client without a secret', async () => {
    const res = await register(build(), {
      redirect_uris: ['https://client.example.com/cb'],
      token_endpoint_auth_method: 'none',
    });
    expect((res.body as OAuthClient).client_secret).toBeUndefined();
    expect((res.body as OAuthClient).token_endpoint_auth_method).toBe('none');
  });

  test('preserves explicitly requested grant types', async () => {
    const res = await register(build(), {
      redirect_uris: ['https://client.example.com/cb'],
      grant_types: ['authorization_code'],
    });
    expect((res.body as OAuthClient).grant_types).toEqual([
      'authorization_code',
    ]);
  });

  test('400 invalid_redirect_uri when redirect_uris is missing', async () => {
    const res = await register(build(), { client_name: 'No redirects' });
    expect((res.body as { error: string }).error).toBe('invalid_redirect_uri');
  });

  test('400 invalid_redirect_uri when redirect_uris is empty', async () => {
    const res = await register(build(), { redirect_uris: [] });
    expect((res.body as { error: string }).error).toBe('invalid_redirect_uri');
  });

  test('400 invalid_redirect_uri when redirect_uris contains a non-string', async () => {
    const res = await register(build(), { redirect_uris: [42] });
    expect((res.body as { error: string }).error).toBe('invalid_redirect_uri');
  });
});

describe('createOAuthServer — end-to-end', () => {
  test('register → authorize → token round-trip', async () => {
    const clientStore = createClientStore();
    const server = build({
      clientStore,
      issueTokens: ({ subject, scopes }) => {
        return { accessToken: `token-for-${subject}`, scope: scopes.join(' ') };
      },
      onAuthorize: () => {
        return { approved: true, subject: 'alice', scopes: ['mcp:access'] };
      },
    });

    const reg = await server.register({
      query: {},
      body: {
        redirect_uris: ['https://client.example.com/cb'],
        token_endpoint_auth_method: 'none',
      },
      headers: {},
    });
    const clientId = (reg.body as OAuthClient).client_id;

    const authRes = await server.authorize({
      query: {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://client.example.com/cb',
        code_challenge: CODE_CHALLENGE,
        code_challenge_method: 'S256',
      },
      body: {},
      headers: {},
    });
    const code = new URL(authRes.redirect!).searchParams.get('code')!;

    const tokenRes = await server.token({
      query: {},
      body: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://client.example.com/cb',
        client_id: clientId,
        code_verifier: CODE_VERIFIER,
      },
      headers: {},
    });
    expect(tokenRes.status).toBe(200);
    expect((tokenRes.body as { access_token: string }).access_token).toBe(
      'token-for-alice'
    );
    expect((tokenRes.body as { scope: string }).scope).toBe('mcp:access');
  });
});

describe('getWwwAuthenticateHeader', () => {
  test('returns Bearer header with resource_metadata URL', () => {
    expect(
      getWwwAuthenticateHeader({ resource: 'https://mcp.example.com' })
    ).toBe(
      'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"'
    );
  });

  test('strips a trailing slash from the resource', () => {
    expect(
      getWwwAuthenticateHeader({ resource: 'https://mcp.example.com/' })
    ).toBe(
      'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"'
    );
  });
});
