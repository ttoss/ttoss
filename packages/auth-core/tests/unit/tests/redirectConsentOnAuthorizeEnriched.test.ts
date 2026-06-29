import {
  type ClientStore,
  type ConsentGrant,
  type ConsentGrantStore,
  createRedirectConsentOnAuthorize,
  type OAuthClient,
  type OnAuthorizeArgs,
} from '../../../src/index';

const CONSENT_URL = 'https://app.example.com/oauth/consent';

const makeArgs = (
  overrides: Partial<OnAuthorizeArgs['request']> = {}
): OnAuthorizeArgs => {
  return {
    client: {
      client_id: 'client-abc',
      redirect_uris: ['https://app.example.com/callback'],
    },
    request: {
      clientId: 'client-abc',
      redirectUri: 'https://app.example.com/callback',
      scopes: ['openid'],
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
      state: 'state-xyz',
      ...overrides,
    },
    headers: {},
  };
};

const noGrantStore = (): ConsentGrantStore => {
  return {
    getConsentGrant: jest.fn().mockResolvedValue(undefined),
    deleteConsentGrant: jest.fn().mockResolvedValue(undefined),
  };
};

const makeClientStore = (client?: OAuthClient): ClientStore => {
  return {
    get: jest.fn().mockResolvedValue(client),
    register: jest.fn(),
  };
};

describe('createRedirectConsentOnAuthorize — client display enrichment', () => {
  describe('no enrichment options', () => {
    test('redirect contains no client_name or logo_uri params', async () => {
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...noGrantStore(),
      });

      const result = await onAuthorize(makeArgs());
      expect(result.approved).toBe(false);
      if (result.approved) throw new Error('unexpected');

      const url = new URL(result.redirect!);
      expect(url.searchParams.has('client_name')).toBe(false);
      expect(url.searchParams.has('logo_uri')).toBe(false);
    });
  });

  describe('clientStore enrichment', () => {
    test("appends registered client's client_name and logo_uri to the redirect", async () => {
      const registeredClient: OAuthClient = {
        client_id: 'client-abc',
        redirect_uris: [],
        client_name: 'Acme App',
        logo_uri: 'https://acme.example.com/logo.png',
      };

      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...noGrantStore(),
        clientStore: makeClientStore(registeredClient),
      });

      const result = await onAuthorize(makeArgs());
      expect(result.approved).toBe(false);
      if (result.approved) throw new Error('unexpected');

      const url = new URL(result.redirect!);
      expect(url.searchParams.get('client_name')).toBe('Acme App');
      expect(url.searchParams.get('logo_uri')).toBe(
        'https://acme.example.com/logo.png'
      );
    });

    test('omits params when registered client has no display fields', async () => {
      const registeredClient: OAuthClient = {
        client_id: 'client-abc',
        redirect_uris: [],
      };

      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...noGrantStore(),
        clientStore: makeClientStore(registeredClient),
      });

      const result = await onAuthorize(makeArgs());
      if (result.approved) throw new Error('unexpected');

      const url = new URL(result.redirect!);
      expect(url.searchParams.has('client_name')).toBe(false);
      expect(url.searchParams.has('logo_uri')).toBe(false);
    });
  });

  describe('getClientDisplayFallback', () => {
    test('fallback fills missing client_name and logo_uri', async () => {
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...noGrantStore(),
        getClientDisplayFallback: ({ clientId }) => {
          if (clientId === 'client-abc') {
            return {
              clientName: 'Fallback App',
              logoUri: 'https://fallback.example.com/logo.png',
            };
          }
        },
      });

      const result = await onAuthorize(makeArgs());
      if (result.approved) throw new Error('unexpected');

      const url = new URL(result.redirect!);
      expect(url.searchParams.get('client_name')).toBe('Fallback App');
      expect(url.searchParams.get('logo_uri')).toBe(
        'https://fallback.example.com/logo.png'
      );
    });

    test('registered client_name takes precedence over fallback', async () => {
      const registeredClient: OAuthClient = {
        client_id: 'client-abc',
        redirect_uris: [],
        client_name: 'Real Name',
      };

      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...noGrantStore(),
        clientStore: makeClientStore(registeredClient),
        getClientDisplayFallback: () => {
          return {
            clientName: 'Fallback Name',
            logoUri: 'https://fallback.example.com/logo.png',
          };
        },
      });

      const result = await onAuthorize(makeArgs());
      if (result.approved) throw new Error('unexpected');

      const url = new URL(result.redirect!);
      expect(url.searchParams.get('client_name')).toBe('Real Name');
      // logo_uri absent on registered client → fallback provides it
      expect(url.searchParams.get('logo_uri')).toBe(
        'https://fallback.example.com/logo.png'
      );
    });

    test('fallback receives the resolved client record', async () => {
      const registeredClient: OAuthClient = {
        client_id: 'client-abc',
        redirect_uris: [],
      };
      const fallback = jest.fn().mockReturnValue(undefined);

      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...noGrantStore(),
        clientStore: makeClientStore(registeredClient),
        getClientDisplayFallback: fallback,
      });

      await onAuthorize(makeArgs());
      expect(fallback).toHaveBeenCalledWith({
        clientId: 'client-abc',
        client: registeredClient,
      });
    });
  });

  describe('approved / no-redirect results pass through unchanged', () => {
    test('an approved result is unaffected by enrichment options', async () => {
      const grant: ConsentGrant = {
        subject: 'user-1',
        scopes: ['openid'],
        expiresAt: Date.now() + 60_000,
      };
      const store: ConsentGrantStore = {
        getConsentGrant: jest.fn().mockResolvedValue(grant),
        deleteConsentGrant: jest.fn().mockResolvedValue(undefined),
      };
      const registeredClient: OAuthClient = {
        client_id: 'client-abc',
        redirect_uris: [],
        client_name: 'Acme App',
      };

      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
        clientStore: makeClientStore(registeredClient),
      });

      const result = await onAuthorize(makeArgs());
      expect(result.approved).toBe(true);
      // approved results have no redirect URL; clientStore never queried for display
    });
  });
});
