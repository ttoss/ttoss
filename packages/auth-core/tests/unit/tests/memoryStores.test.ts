import { createHash } from 'node:crypto';

import {
  createMemoryAuthCodeStore,
  createMemoryClientStore,
  createMemoryRefreshTokenStore,
  createOAuthHandlers,
  createRefreshRotation,
  type OAuthClient,
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

const publicClient: OAuthClient = {
  client_id: 'public-client',
  redirect_uris: ['https://app.example.com/callback'],
  token_endpoint_auth_method: 'none',
};

describe('createMemoryClientStore', () => {
  test('seeds initial clients and registers new ones', async () => {
    const store = createMemoryClientStore([publicClient]);
    expect(await store.get('public-client')).toEqual(publicClient);
    expect(await store.get('missing')).toBeUndefined();

    const fresh: OAuthClient = {
      client_id: 'new-client',
      redirect_uris: ['https://new.example.com/cb'],
    };
    await store.register(fresh);
    expect(await store.get('new-client')).toEqual(fresh);
  });
});

describe('createMemoryAuthCodeStore', () => {
  test('saves, reads, and deletes codes', async () => {
    const store = createMemoryAuthCodeStore();
    const code = {
      code: 'abc',
      clientId: 'public-client',
      redirectUri: 'https://app.example.com/callback',
      codeChallenge: CODE_CHALLENGE,
      scopes: ['read'],
      subject: 'user-1',
      expiresAt: Date.now() + 1000,
    };
    await store.save(code);
    expect(await store.get('abc')).toEqual(code);
    await store.delete('abc');
    expect(await store.get('abc')).toBeUndefined();
  });
});

describe('createMemoryRefreshTokenStore', () => {
  test('saves, reads, deletes, and revokes by owner', async () => {
    const store = createMemoryRefreshTokenStore();
    const make = (tokenHash: string, subject: string) => {
      return {
        tokenHash,
        clientId: 'public-client',
        subject,
        scopes: ['read'],
        expiresAt: Date.now() + 1000,
      };
    };

    await store.save(make('h1', 'user-1'));
    await store.save(make('h2', 'user-1'));
    await store.save(make('h3', 'user-2'));

    expect(await store.get('h1')).toBeTruthy();
    await store.delete('h1');
    expect(await store.get('h1')).toBeUndefined();

    await store.deleteByOwner({ clientId: 'public-client', subject: 'user-1' });
    expect(await store.get('h2')).toBeUndefined();
    // A different owner is untouched.
    expect(await store.get('h3')).toBeTruthy();
  });
});

describe('memory stores — end-to-end auth-code + PKCE + refresh rotation', () => {
  test('register → authorize → token → refresh, all on memory stores', async () => {
    const clientStore = createMemoryClientStore();
    const refresh = createRefreshRotation({
      store: createMemoryRefreshTokenStore(),
    });

    let accessCounter = 0;
    const server = createOAuthHandlers({
      issuer: 'https://api.example.com',
      clientStore,
      authCodeStore: createMemoryAuthCodeStore(),
      issueTokens: async ({ subject, scopes, client }) => {
        accessCounter += 1;
        return {
          accessToken: `access-${accessCounter}`,
          refreshToken: await refresh.issue({ client, subject, scopes }),
          expiresIn: 3600,
        };
      },
      onAuthorize: () => {
        return { approved: true, subject: 'alice', scopes: ['mcp:access'] };
      },
      onRefreshToken: refresh.onRefreshToken,
    });

    const reg = await server.register({
      query: {},
      body: {
        redirect_uris: ['https://app.example.com/callback'],
        token_endpoint_auth_method: 'none',
      },
      headers: {},
    });
    const clientId = (reg.body as OAuthClient).client_id;

    const authRes = await server.authorize({
      query: {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://app.example.com/callback',
        code_challenge: CODE_CHALLENGE,
        code_challenge_method: 'S256',
        scope: 'mcp:access',
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
        redirect_uri: 'https://app.example.com/callback',
        client_id: clientId,
        code_verifier: CODE_VERIFIER,
      },
      headers: {},
    });
    expect(tokenRes.status).toBe(200);
    const firstRefresh = (tokenRes.body as { refresh_token: string })
      .refresh_token;
    expect(firstRefresh).toBeTruthy();

    // Exchange the refresh token: a new pair is issued and rotated.
    const refreshRes = await server.token({
      query: {},
      body: {
        grant_type: 'refresh_token',
        refresh_token: firstRefresh,
        client_id: clientId,
      },
      headers: {},
    });
    expect(refreshRes.status).toBe(200);
    const secondRefresh = (refreshRes.body as { refresh_token: string })
      .refresh_token;
    expect(secondRefresh).not.toBe(firstRefresh);

    // The original refresh token is now single-use — reuse fails and revokes.
    const reuse = await server.token({
      query: {},
      body: {
        grant_type: 'refresh_token',
        refresh_token: firstRefresh,
        client_id: clientId,
      },
      headers: {},
    });
    expect(reuse.status).toBe(400);
    expect((reuse.body as { error: string }).error).toBe('invalid_grant');

    // Reuse revoked the whole chain: the rotated token is dead too.
    const afterRevoke = await server.token({
      query: {},
      body: {
        grant_type: 'refresh_token',
        refresh_token: secondRefresh,
        client_id: clientId,
      },
      headers: {},
    });
    expect(afterRevoke.status).toBe(400);
  });
});
