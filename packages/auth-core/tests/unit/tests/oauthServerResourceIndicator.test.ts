import { createHash } from 'node:crypto';

import {
  type AuthCodeStore,
  type ClientStore,
  createOAuthHandlers,
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
  return createOAuthHandlers({
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

describe('createOAuthHandlers — resource indicators (RFC 8707)', () => {
  const RESOURCE = 'https://mcp.example.com/mcp';

  const authorize = (
    server: ReturnType<typeof build>,
    query: Record<string, string>
  ) => {
    return server.authorize({ query, body: {}, headers: {} });
  };

  const obtainCode = async (server: ReturnType<typeof build>) => {
    const res = await authorize(server, { ...validQuery, resource: RESOURCE });
    return locationParams(res.redirect).get('code')!;
  };

  const exchange = (
    server: ReturnType<typeof build>,
    body: Record<string, unknown>
  ) => {
    return server.token({
      query: {},
      body: {
        grant_type: 'authorization_code',
        redirect_uri: 'https://app.example.com/callback',
        client_id: 'client-abc',
        client_secret: 'secret-xyz',
        code_verifier: CODE_VERIFIER,
        ...body,
      },
      headers: {},
    });
  };

  test('authorize accepts the configured resource, ignoring a trailing slash', async () => {
    const res = await authorize(build({ resource: RESOURCE }), {
      ...validQuery,
      resource: `${RESOURCE}/`,
    });
    expect(locationParams(res.redirect).get('code')).toBeTruthy();
  });

  test('authorize redirects with invalid_target for another resource', async () => {
    const res = await authorize(build({ resource: RESOURCE }), {
      ...validQuery,
      resource: 'https://other.example.com',
    });
    expect(res.status).toBe(302);
    const params = locationParams(res.redirect);
    expect(params.get('error')).toBe('invalid_target');
    expect(params.get('state')).toBe('state-value');
    expect(params.get('code')).toBeNull();
  });

  test('ignores the resource parameter when no resource is configured', async () => {
    const issueTokens = jest.fn(() => {
      return { accessToken: 'access-token-value' };
    });
    const server = build({ issueTokens });
    const res = await authorize(server, {
      ...validQuery,
      resource: 'https://anything.example.com',
    });
    const code = locationParams(res.redirect).get('code')!;
    const tokenRes = await exchange(server, {
      code,
      resource: 'https://anything.example.com',
    });
    expect(tokenRes.status).toBe(200);
    expect(issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({ resource: undefined })
    );
  });

  test('passes the configured resource to issueTokens on code exchange', async () => {
    const issueTokens = jest.fn(() => {
      return { accessToken: 'access-token-value' };
    });
    const server = build({ resource: RESOURCE, issueTokens });
    const code = await obtainCode(server);
    const res = await exchange(server, { code, resource: RESOURCE });
    expect(res.status).toBe(200);
    expect(issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'user-123', resource: RESOURCE })
    );
  });

  test('binds the configured resource even when the client sends none', async () => {
    const issueTokens = jest.fn(() => {
      return { accessToken: 'access-token-value' };
    });
    const server = build({ resource: RESOURCE, issueTokens });
    const res = await authorize(server, validQuery);
    const code = locationParams(res.redirect).get('code')!;
    expect((await exchange(server, { code })).status).toBe(200);
    expect(issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({ resource: RESOURCE })
    );
  });

  test('token rejects a code exchange for another resource with invalid_target', async () => {
    const issueTokens = jest.fn(() => {
      return { accessToken: 'access-token-value' };
    });
    const server = build({ resource: RESOURCE, issueTokens });
    const code = await obtainCode(server);
    const res = await exchange(server, {
      code,
      resource: 'https://other.example.com',
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ error: 'invalid_target' })
    );
    expect(issueTokens).not.toHaveBeenCalled();
  });

  test('token rejects a repeated resource parameter naming another resource', async () => {
    const server = build({ resource: RESOURCE });
    const code = await obtainCode(server);
    const res = await exchange(server, {
      code,
      resource: [RESOURCE, 'https://other.example.com'],
    });
    expect(res.body).toEqual(
      expect.objectContaining({ error: 'invalid_target' })
    );
  });

  test('token accepts a repeated resource parameter naming only the configured one', async () => {
    const server = build({ resource: RESOURCE });
    const code = await obtainCode(server);
    const res = await exchange(server, {
      code,
      resource: [RESOURCE, RESOURCE],
    });
    expect(res.status).toBe(200);
  });

  test('refresh passes the configured resource to issueTokens', async () => {
    const issueTokens = jest.fn(() => {
      return { accessToken: 'new-access' };
    });
    const server = build({
      resource: RESOURCE,
      issueTokens,
      onRefreshToken: () => {
        return { subject: 'user-123', scopes: [] };
      },
    });
    const res = await server.token({
      query: {},
      body: {
        grant_type: 'refresh_token',
        refresh_token: 'old-refresh',
        client_id: 'public-client',
        resource: RESOURCE,
      },
      headers: {},
    });
    expect(res.status).toBe(200);
    expect(issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({ resource: RESOURCE })
    );
  });

  test('refresh rejects another resource before validating the token', async () => {
    const onRefreshToken = jest.fn(() => {
      return { subject: 'user-123', scopes: [] };
    });
    const server = build({ resource: RESOURCE, onRefreshToken });
    const res = await server.token({
      query: {},
      body: {
        grant_type: 'refresh_token',
        refresh_token: 'old-refresh',
        client_id: 'public-client',
        resource: 'https://other.example.com',
      },
      headers: {},
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ error: 'invalid_target' })
    );
    expect(onRefreshToken).not.toHaveBeenCalled();
  });
});
