import {
  type ClientStore,
  createOAuthHandlers,
  type OAuthClient,
  type OAuthServerOptions,
} from '../../../src/index';

/**
 * The `refresh_token` grant only works when the app supplies `onRefreshToken`,
 * so discovery and Dynamic Client Registration must advertise it only then —
 * otherwise clients wait on a refresh token they can never use.
 */

const createClientStore = (): ClientStore => {
  const clients = new Map<string, OAuthClient>();
  return {
    get: (clientId) => {
      return clients.get(clientId);
    },
    register: (client) => {
      clients.set(client.client_id, client);
    },
  };
};

const build = (options: Partial<OAuthServerOptions> = {}) => {
  return createOAuthHandlers({
    issuer: 'https://api.example.com',
    clientStore: createClientStore(),
    authCodeStore: {
      save: () => {},
      get: () => {
        return undefined;
      },
      delete: () => {},
    },
    issueTokens: () => {
      return { accessToken: 'access-token-value' };
    },
    onAuthorize: () => {
      return { approved: true, subject: 'user-123' };
    },
    ...options,
  });
};

const onRefreshToken = () => {
  return { subject: 'user-123', scopes: [] };
};

const register = (
  server: ReturnType<typeof build>,
  body: Record<string, unknown>
) => {
  return server.register({
    query: {},
    body: { redirect_uris: ['https://client.example.com/cb'], ...body },
    headers: {},
  });
};

const grantTypesSupported = (server: ReturnType<typeof build>) => {
  return (
    server.authorizationServerMetadata().body as {
      grant_types_supported: string[];
    }
  ).grant_types_supported;
};

describe('createOAuthHandlers — without onRefreshToken', () => {
  test('discovery advertises only authorization_code', () => {
    expect(grantTypesSupported(build())).toEqual(['authorization_code']);
  });

  test('a client registered without grant_types gets only authorization_code', async () => {
    const clientStore = createClientStore();
    const res = await register(build({ clientStore }), {});
    expect(res.status).toBe(201);
    const client = res.body as OAuthClient;
    expect(client.grant_types).toEqual(['authorization_code']);
    expect((await clientStore.get(client.client_id))?.grant_types).toEqual([
      'authorization_code',
    ]);
  });

  test('a requested refresh_token grant is dropped and the rest kept', async () => {
    const clientStore = createClientStore();
    const res = await register(build({ clientStore }), {
      grant_types: ['authorization_code', 'refresh_token'],
    });
    expect(res.status).toBe(201);
    const client = res.body as OAuthClient;
    expect(client.grant_types).toEqual(['authorization_code']);
    expect((await clientStore.get(client.client_id))?.grant_types).toEqual([
      'authorization_code',
    ]);
  });

  test('a client asking only for refresh_token is refused', async () => {
    const res = await register(build(), { grant_types: ['refresh_token'] });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe(
      'invalid_client_metadata'
    );
  });
});

describe('createOAuthHandlers — with onRefreshToken', () => {
  test('discovery advertises authorization_code and refresh_token', () => {
    expect(grantTypesSupported(build({ onRefreshToken }))).toEqual([
      'authorization_code',
      'refresh_token',
    ]);
  });

  test('a client registered without grant_types gets both grants', async () => {
    const res = await register(build({ onRefreshToken }), {});
    expect((res.body as OAuthClient).grant_types).toEqual([
      'authorization_code',
      'refresh_token',
    ]);
  });

  test('a requested refresh_token grant is kept', async () => {
    const res = await register(build({ onRefreshToken }), {
      grant_types: ['refresh_token'],
    });
    expect(res.status).toBe(201);
    expect((res.body as OAuthClient).grant_types).toEqual(['refresh_token']);
  });
});

describe('createOAuthHandlers — register grant_types validation', () => {
  test('refuses grant_types that is not an array of strings', async () => {
    const res = await register(build(), { grant_types: 'authorization_code' });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe(
      'invalid_client_metadata'
    );
  });

  test('preserves an explicitly empty grant_types list', async () => {
    const res = await register(build(), { grant_types: [] });
    expect(res.status).toBe(201);
    expect((res.body as OAuthClient).grant_types).toEqual([]);
  });
});
