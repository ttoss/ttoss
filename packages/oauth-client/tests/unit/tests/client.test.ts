import { createOAuthClient, type TokenResponse } from 'src/index';

const provider = {
  authorizationUrl: 'https://provider.example/authorize',
  tokenUrl: 'https://provider.example/token',
  clientId: 'my-client-id',
  clientSecret: 'my-client-secret',
};

const tokenJson = {
  access_token: 'new-access',
  refresh_token: 'new-refresh',
  expires_in: 3600,
  scope: 'read',
};

const mockFetchOnce = (body: unknown, init?: { ok?: boolean }) => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: init?.ok ?? true,
    status: init?.ok === false ? 400 : 200,
    statusText: init?.ok === false ? 'Bad Request' : 'OK',
    json: async () => {
      return body;
    },
    text: async () => {
      return JSON.stringify(body);
    },
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('buildAuthUrl', () => {
  test('builds a standard authorization URL', () => {
    const client = createOAuthClient(provider);
    const url = new URL(
      client.buildAuthUrl({
        redirectUri: 'https://app.example/callback',
        scope: 'read write',
        state: 'xyz',
      })
    );

    expect(url.origin + url.pathname).toBe(
      'https://provider.example/authorize'
    );
    expect(url.searchParams.get('client_id')).toBe('my-client-id');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://app.example/callback'
    );
    expect(url.searchParams.get('scope')).toBe('read write');
    expect(url.searchParams.get('state')).toBe('xyz');
  });

  test('joins array scopes with the configured separator and appends extra params', () => {
    const client = createOAuthClient({
      ...provider,
      params: { clientId: 'client_key', scopeSeparator: ',' },
    });
    const url = new URL(
      client.buildAuthUrl({
        redirectUri: 'https://app.example/callback',
        scope: ['user.info.basic', 'video.publish'],
        state: 'xyz',
        extraParams: { disable_auto_auth: '1' },
      })
    );

    expect(url.searchParams.get('client_key')).toBe('my-client-id');
    expect(url.searchParams.has('client_id')).toBe(false);
    expect(url.searchParams.get('scope')).toBe('user.info.basic,video.publish');
    expect(url.searchParams.get('disable_auto_auth')).toBe('1');
  });
});

describe('exchangeCode', () => {
  test('posts the authorization code and parses the response', async () => {
    const fetchMock = mockFetchOnce(tokenJson);
    const client = createOAuthClient(provider);

    const result = await client.exchangeCode({
      code: 'auth-code',
      redirectUri: 'https://app.example/callback',
    });

    expect(result).toEqual<TokenResponse>({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresIn: 3600,
      raw: tokenJson,
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = init.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('auth-code');
    expect(body.get('client_id')).toBe('my-client-id');
    expect(body.get('client_secret')).toBe('my-client-secret');
  });

  test('throws when the token endpoint returns a non-ok status', async () => {
    mockFetchOnce({ error: 'invalid_grant' }, { ok: false });
    const client = createOAuthClient(provider);

    await expect(
      client.exchangeCode({ code: 'bad', redirectUri: 'https://app/cb' })
    ).rejects.toThrow('OAuth token request failed: 400');
  });
});

describe('refreshAccessToken', () => {
  test('posts the refresh grant with the provider grant override', async () => {
    const fetchMock = mockFetchOnce(tokenJson);
    const client = createOAuthClient({
      ...provider,
      params: { refreshGrantType: 'refresh_token' },
    });

    await client.refreshAccessToken('stored-refresh');

    const [, init] = fetchMock.mock.calls[0];
    const body = init.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('stored-refresh');
  });
});

describe('getValidToken', () => {
  test('returns the stored token unchanged when it is outside the refresh window', async () => {
    const fetchMock = mockFetchOnce(tokenJson);
    const client = createOAuthClient(provider);
    const onRefresh = jest.fn();

    const token = await client.getValidToken(
      {
        accessToken: 'current-access',
        refreshToken: 'current-refresh',
        accessTokenExpiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
      },
      { onRefresh }
    );

    expect(token).toBe('current-access');
    expect(onRefresh).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('refreshes and persists when the token expires within the window', async () => {
    mockFetchOnce(tokenJson);
    const client = createOAuthClient(provider);
    const onRefresh = jest.fn().mockResolvedValue(undefined);

    const token = await client.getValidToken(
      {
        accessToken: 'current-access',
        refreshToken: 'current-refresh',
        accessTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      { onRefresh }
    );

    expect(token).toBe('new-access');
    expect(onRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'new-access' })
    );
  });

  test('honours a custom refresh window', async () => {
    const fetchMock = mockFetchOnce(tokenJson);
    const client = createOAuthClient(provider);
    const onRefresh = jest.fn().mockResolvedValue(undefined);

    const token = await client.getValidToken(
      {
        accessToken: 'current-access',
        refreshToken: 'current-refresh',
        accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      { onRefresh, refreshWindowMs: 30 * 60 * 1000 }
    );

    expect(token).toBe('current-access');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
