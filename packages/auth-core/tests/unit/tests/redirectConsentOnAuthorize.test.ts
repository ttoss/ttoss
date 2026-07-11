import {
  type ConsentGrant,
  type ConsentGrantStore,
  createRedirectConsentOnAuthorize,
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
      scopes: ['openid', 'profile'],
      codeChallenge: 'test-code-challenge',
      codeChallengeMethod: 'S256',
      state: 'random-state',
      ...overrides,
    },
    headers: {},
  };
};

const makeStore = (
  grant?: ConsentGrant
): ConsentGrantStore & {
  deleted: string[];
} => {
  const deleted: string[] = [];
  return {
    deleted,
    getConsentGrant: jest.fn(async () => {
      return grant;
    }),
    deleteConsentGrant: jest.fn(async ({ codeChallenge }) => {
      deleted.push(codeChallenge);
    }),
  };
};

describe('createRedirectConsentOnAuthorize', () => {
  describe('when no consent grant exists', () => {
    test('redirects to the consent URL with OAuth parameters', async () => {
      const store = makeStore(undefined);
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
      });

      const result = await onAuthorize(makeArgs());

      expect(result).toMatchObject({ approved: false });
      if (result.approved) throw new Error('should be false');

      const redirectUrl = new URL(result.redirect!);
      expect(redirectUrl.origin + redirectUrl.pathname).toBe(CONSENT_URL);
      expect(redirectUrl.searchParams.get('client_id')).toBe('client-abc');
      expect(redirectUrl.searchParams.get('redirect_uri')).toBe(
        'https://app.example.com/callback'
      );
      expect(redirectUrl.searchParams.get('code_challenge')).toBe(
        'test-code-challenge'
      );
      expect(redirectUrl.searchParams.get('code_challenge_method')).toBe(
        'S256'
      );
      expect(redirectUrl.searchParams.get('scope')).toBe('openid profile');
      expect(redirectUrl.searchParams.get('state')).toBe('random-state');
    });

    test('does not include state param when state is undefined', async () => {
      const store = makeStore(undefined);
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
      });

      const result = await onAuthorize(makeArgs({ state: undefined }));

      expect(result.approved).toBe(false);
      if (result.approved) throw new Error('should be false');

      const redirectUrl = new URL(result.redirect!);
      expect(redirectUrl.searchParams.has('state')).toBe(false);
    });

    test('does not call deleteConsentGrant', async () => {
      const store = makeStore(undefined);
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
      });

      await onAuthorize(makeArgs());

      expect(store.deleteConsentGrant).not.toHaveBeenCalled();
    });
  });

  describe('when a valid (non-expired) consent grant exists', () => {
    test('returns approved: true with subject and scopes', async () => {
      const grant: ConsentGrant = {
        subject: 'user-123',
        scopes: ['openid', 'profile'],
        expiresAt: Date.now() + 60_000,
      };
      const store = makeStore(grant);
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
      });

      const result = await onAuthorize(makeArgs());

      expect(result).toEqual({
        approved: true,
        subject: 'user-123',
        scopes: ['openid', 'profile'],
      });
    });

    test('consumes (deletes) the grant to enforce single-use', async () => {
      const grant: ConsentGrant = {
        subject: 'user-123',
        scopes: ['openid'],
        expiresAt: Date.now() + 60_000,
      };
      const store = makeStore(grant);
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
      });

      await onAuthorize(makeArgs());

      expect(store.deleteConsentGrant).toHaveBeenCalledWith({
        codeChallenge: 'test-code-challenge',
      });
    });
  });

  describe('when a consent grant exists but is expired', () => {
    test('redirects to the consent URL instead of approving', async () => {
      const grant: ConsentGrant = {
        subject: 'user-123',
        scopes: ['openid'],
        expiresAt: Date.now() - 1, // already expired
      };
      const store = makeStore(grant);
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
      });

      const result = await onAuthorize(makeArgs());

      expect(result.approved).toBe(false);
    });

    test('does not call deleteConsentGrant for an expired grant', async () => {
      const grant: ConsentGrant = {
        subject: 'user-123',
        scopes: ['openid'],
        expiresAt: Date.now() - 1,
      };
      const store = makeStore(grant);
      const onAuthorize = createRedirectConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        ...store,
      });

      await onAuthorize(makeArgs());

      expect(store.deleteConsentGrant).not.toHaveBeenCalled();
    });
  });
});
