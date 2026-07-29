import { discoverOidcConfiguration } from 'src/Oidc/discovery';

const mockFetch = (
  response: Partial<Response> & { json: () => Promise<unknown> }
) => {
  global.fetch = jest.fn().mockResolvedValue(response) as never;
};

describe('discoverOidcConfiguration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetches the well-known discovery document and extracts jwks_uri', async () => {
    mockFetch({
      ok: true,
      json: () => {
        return Promise.resolve({
          issuer: 'https://login.microsoftonline.com/tenant/v2.0',
          jwks_uri:
            'https://login.microsoftonline.com/tenant/discovery/v2.0/keys',
          authorization_endpoint:
            'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize',
          token_endpoint:
            'https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
        });
      },
    });

    const doc = await discoverOidcConfiguration(
      'https://login.microsoftonline.com/tenant/v2.0'
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://login.microsoftonline.com/tenant/v2.0/.well-known/openid-configuration'
    );
    expect(doc).toEqual({
      issuer: 'https://login.microsoftonline.com/tenant/v2.0',
      jwksUri: 'https://login.microsoftonline.com/tenant/discovery/v2.0/keys',
      authorizationEndpoint:
        'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize',
      tokenEndpoint:
        'https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
    });
  });

  test('strips a trailing slash from the issuer before building the discovery URL', async () => {
    mockFetch({
      ok: true,
      json: () => {
        return Promise.resolve({
          jwks_uri: 'https://example.com/keys',
        });
      },
    });

    await discoverOidcConfiguration('https://example.okta.com/oauth2/default/');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.okta.com/oauth2/default/.well-known/openid-configuration'
    );
  });

  test('falls back to the issuer argument when the document omits issuer', async () => {
    mockFetch({
      ok: true,
      json: () => {
        return Promise.resolve({ jwks_uri: 'https://example.com/keys' });
      },
    });

    const doc = await discoverOidcConfiguration('https://example.com');

    expect(doc.issuer).toBe('https://example.com');
    expect(doc.authorizationEndpoint).toBeUndefined();
    expect(doc.tokenEndpoint).toBeUndefined();
  });

  test('throws when the discovery endpoint returns a non-2xx status', async () => {
    mockFetch({
      ok: false,
      status: 404,
      json: () => {
        return Promise.resolve({});
      },
    });

    await expect(
      discoverOidcConfiguration('https://example.com')
    ).rejects.toThrow('HTTP 404');
  });

  test('throws when the discovery document is missing jwks_uri', async () => {
    mockFetch({
      ok: true,
      json: () => {
        return Promise.resolve({});
      },
    });

    await expect(
      discoverOidcConfiguration('https://example.com')
    ).rejects.toThrow('missing "jwks_uri"');
  });
});
