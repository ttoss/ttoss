import { createHash } from 'node:crypto';

import { createLocalJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';

import {
  createMemoryAuthCodeStore,
  createMemoryClientStore,
  createMemoryRefreshTokenStore,
  createOAuthHandlers,
  createRefreshRotation,
  createSigningKeySet,
  generateSigningKey,
  type JsonWebKeySet,
  type OAuthClient,
  type OAuthServerOptions,
  type SigningKey,
} from '../../../src/index';

const ISSUER = 'https://auth.example.com';
const RESOURCE = 'https://mcp.example.com/mcp';
const CODE_VERIFIER = 'a-very-long-random-pkce-code-verifier-value-1234567890';
const CODE_CHALLENGE = createHash('sha256')
  .update(CODE_VERIFIER)
  .digest('base64url');

const client: OAuthClient = {
  client_id: 'public-client',
  redirect_uris: ['https://app.example.com/callback'],
  token_endpoint_auth_method: 'none',
  grant_types: ['authorization_code', 'refresh_token'],
};

const build = (
  args: { keys?: SigningKey[] } & Partial<OAuthServerOptions> = {}
) => {
  const { keys = [generateSigningKey()], ...overrides } = args;
  const keySet = createSigningKeySet({ keys, retiredKeyTtl: 3600 });
  const refresh = createRefreshRotation({
    store: createMemoryRefreshTokenStore(),
  });

  const server = createOAuthHandlers({
    issuer: ISSUER,
    resource: RESOURCE,
    clientStore: createMemoryClientStore([client]),
    authCodeStore: createMemoryAuthCodeStore(),
    onAuthorize: () => {
      return { approved: true, subject: 'user-123', scopes: ['mcp:access'] };
    },
    onRefreshToken: refresh.onRefreshToken,
    signing: {
      keySet,
      claims: () => {
        return { tenant: 'acme', sub: 'attacker', aud: 'elsewhere' };
      },
      issueRefreshToken: refresh.issue,
    },
    ...overrides,
  });

  return { server, keySet };
};

const issueAccessToken = async (server: ReturnType<typeof build>['server']) => {
  const authorize = await server.authorize({
    query: {
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: client.redirect_uris[0],
      code_challenge: CODE_CHALLENGE,
      code_challenge_method: 'S256',
      scope: 'mcp:access',
      resource: RESOURCE,
    },
    body: {},
    headers: {},
  });
  const code = new URL(authorize.redirect as string).searchParams.get('code');

  const res = await server.token({
    query: {},
    body: {
      grant_type: 'authorization_code',
      code,
      redirect_uri: client.redirect_uris[0],
      client_id: client.client_id,
      code_verifier: CODE_VERIFIER,
      resource: RESOURCE,
    },
    headers: {},
  });

  expect(res.status).toBe(200);
  return res.body as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
};

/** A third party: knows only the jwks_uri document, verifies with jose. */
const verifyAsThirdParty = (args: { token: string; jwks: JsonWebKeySet }) => {
  return jwtVerify(args.token, createLocalJWKSet(args.jwks), {
    issuer: ISSUER,
    audience: RESOURCE,
    typ: 'at+jwt',
  });
};

afterEach(() => {
  jest.useRealTimers();
});

test('advertises jwks_uri and serves the public keys', () => {
  const { server, keySet } = build();

  expect(server.paths.jwks).toBe('/.well-known/jwks.json');
  expect(server.authorizationServerMetadata().body).toMatchObject({
    jwks_uri: `${ISSUER}/.well-known/jwks.json`,
  });
  expect(server.jwks()).toEqual({ status: 200, body: keySet.jwks() });
  expect(JSON.stringify(server.jwks()?.body)).not.toContain('"d"');
});

test('honours a custom JWKS path', () => {
  const { server } = build({ endpoints: { jwks: '/keys' } });
  expect(server.authorizationServerMetadata().body).toMatchObject({
    jwks_uri: `${ISSUER}/keys`,
  });
});

test('issues an access token a third party verifies through the JWKS alone', async () => {
  const { server, keySet } = build();
  const body = await issueAccessToken(server);

  expect(body.expires_in).toBe(3600);
  expect(body.refresh_token).toEqual(expect.any(String));

  const { payload, protectedHeader } = await verifyAsThirdParty({
    token: body.access_token,
    jwks: server.jwks()?.body as JsonWebKeySet,
  });

  expect(protectedHeader).toMatchObject({
    alg: 'EdDSA',
    typ: 'at+jwt',
    kid: keySet.signingKey.kid,
  });
  expect(payload).toMatchObject({
    iss: ISSUER,
    sub: 'user-123',
    aud: RESOURCE,
    client_id: client.client_id,
    scope: 'mcp:access',
    tenant: 'acme',
    jti: expect.any(String),
  });
  expect((payload.exp as number) - (payload.iat as number)).toBe(3600);
});

test('a refresh mints a new signed access token', async () => {
  const { server } = build();
  const first = await issueAccessToken(server);

  const res = await server.token({
    query: {},
    body: {
      grant_type: 'refresh_token',
      refresh_token: first.refresh_token,
      client_id: client.client_id,
    },
    headers: {},
  });
  const body = res.body as { access_token: string };

  await expect(
    verifyAsThirdParty({
      token: body.access_token,
      jwks: server.jwks()?.body as JsonWebKeySet,
    })
  ).resolves.toBeDefined();
});

test('rotating the signing key does not invalidate live tokens', async () => {
  jest.useFakeTimers({
    now: new Date('2026-11-13T12:00:00Z'),
    doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
  });

  const oldKey = generateSigningKey({ alg: 'ES256' });
  const before = build({ keys: [oldKey] });
  const live = await issueAccessToken(before.server);

  const newKey = generateSigningKey();
  const after = build({
    keys: [newKey, { ...oldKey, retiredAt: Date.now() }],
  });
  const fresh = await issueAccessToken(after.server);
  const jwks = after.server.jwks()?.body as JsonWebKeySet;

  expect(decodeProtectedHeader(fresh.access_token).kid).toBe(newKey.kid);
  await expect(
    verifyAsThirdParty({ token: live.access_token, jwks })
  ).resolves.toBeDefined();
  await expect(
    verifyAsThirdParty({ token: fresh.access_token, jwks })
  ).resolves.toBeDefined();
});

test('falls back to the issuer as audience and omits the refresh token when not configured', async () => {
  const keySet = createSigningKeySet({
    keys: [generateSigningKey()],
    retiredKeyTtl: 60,
  });
  const plain = createOAuthHandlers({
    issuer: ISSUER,
    clientStore: createMemoryClientStore([client]),
    authCodeStore: createMemoryAuthCodeStore(),
    onAuthorize: () => {
      return { approved: true, subject: 'user-9' };
    },
    signing: { keySet, accessTokenTtl: 60 },
  });

  const authorize = await plain.authorize({
    query: {
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: client.redirect_uris[0],
      code_challenge: CODE_CHALLENGE,
      code_challenge_method: 'S256',
    },
    body: {},
    headers: {},
  });
  const code = new URL(authorize.redirect as string).searchParams.get('code');
  const res = await plain.token({
    query: {},
    body: {
      grant_type: 'authorization_code',
      code,
      redirect_uri: client.redirect_uris[0],
      client_id: client.client_id,
      code_verifier: CODE_VERIFIER,
    },
    headers: {},
  });
  const body = res.body as Record<string, unknown>;

  expect(body).not.toHaveProperty('refresh_token');
  expect(body.expires_in).toBe(60);
  expect(keySet.verify(body.access_token as string)).toMatchObject({
    aud: ISSUER,
    sub: 'user-9',
    scope: '',
  });
});

test('an app issueTokens still mints, while the JWKS is published', async () => {
  const { server } = build({
    issueTokens: () => {
      return { accessToken: 'app-minted', expiresIn: 10 };
    },
  });
  const body = await issueAccessToken(server);

  expect(body.access_token).toBe('app-minted');
  expect(server.jwks()?.status).toBe(200);
});

test('without signing there is no JWKS and no jwks_uri', () => {
  const server = createOAuthHandlers({
    issuer: ISSUER,
    clientStore: createMemoryClientStore(),
    authCodeStore: createMemoryAuthCodeStore(),
    onAuthorize: () => {
      return { approved: false };
    },
    issueTokens: () => {
      return { accessToken: 'x' };
    },
  });

  expect(server.jwks()).toBeUndefined();
  expect(server.authorizationServerMetadata().body).not.toHaveProperty(
    'jwks_uri'
  );
});

test('refuses to build with neither issueTokens nor signing', () => {
  expect(() => {
    return createOAuthHandlers({
      issuer: ISSUER,
      clientStore: createMemoryClientStore(),
      authCodeStore: createMemoryAuthCodeStore(),
      onAuthorize: () => {
        return { approved: false };
      },
    });
  }).toThrow(/issueTokens or signing/);
});
