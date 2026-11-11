import {
  approveConsentRequest,
  CONSENT_REQUEST_PARAM,
  CONSENT_RESUME_PARAM,
  createMemoryAuthCodeStore,
  createMemoryClientStore,
  createMemoryPendingAuthorizationStore,
  createOAuthHandlers,
  createPendingConsentOnAuthorize,
  denyConsentRequest,
  getConsentRequest,
  type OAuthClient,
  type PendingAuthorization,
} from '../../../src/index';

const ISSUER = 'https://auth.example.com';
const AUTHORIZE_URL = `${ISSUER}/authorize`;
const CONSENT_URL = 'https://app.example.com/oauth/consent';

const trustedClient: OAuthClient = {
  client_id: 'trusted',
  client_name: 'Trusted App',
  logo_uri: 'https://trusted.example.com/logo.png',
  redirect_uris: ['https://trusted.example.com/callback'],
  token_endpoint_auth_method: 'none',
};

const attackerClient: OAuthClient = {
  client_id: 'attacker',
  client_name: 'Trusted App',
  redirect_uris: ['https://evil.example/cb'],
  token_endpoint_auth_method: 'none',
};

const setup = ({ resource }: { resource?: string } = {}) => {
  const store = createMemoryPendingAuthorizationStore();
  const clientStore = createMemoryClientStore([trustedClient, attackerClient]);
  const server = createOAuthHandlers({
    issuer: ISSUER,
    clientStore,
    authCodeStore: createMemoryAuthCodeStore(),
    resource,
    issueTokens: () => {
      return { accessToken: 'access', expiresIn: 3600 };
    },
    onAuthorize: createPendingConsentOnAuthorize({
      consentUrl: CONSENT_URL,
      store,
    }),
  });

  const authorize = (query: Record<string, string | undefined>) => {
    return server.authorize({ query, body: {}, headers: {} });
  };

  return { store, clientStore, authorize };
};

const trustedQuery = {
  response_type: 'code',
  client_id: 'trusted',
  redirect_uri: 'https://trusted.example.com/callback',
  code_challenge: 'challenge-C',
  code_challenge_method: 'S256',
  scope: 'read write',
  state: 'client-state',
};

const consentIdFrom = (redirect: string | undefined): string => {
  const url = new URL(redirect!);
  expect(url.origin + url.pathname).toBe(CONSENT_URL);
  return url.searchParams.get(CONSENT_REQUEST_PARAM)!;
};

const queryOf = (redirect: string): Record<string, string> => {
  return Object.fromEntries(new URL(redirect).searchParams);
};

describe('createPendingConsentOnAuthorize', () => {
  test('redirects to the consent URL with only an opaque id', async () => {
    const { authorize } = setup();

    const res = await authorize(trustedQuery);

    expect(res.status).toBe(302);
    const url = new URL(res.redirect!);
    expect([...url.searchParams.keys()]).toEqual([CONSENT_REQUEST_PARAM]);
    expect(consentIdFrom(res.redirect).length).toBeGreaterThanOrEqual(43);
  });

  test('stores the validated request with a ten-minute lifetime', async () => {
    const { authorize, store } = setup();
    const before = Date.now();

    const id = consentIdFrom((await authorize(trustedQuery)).redirect);

    expect(await store.get(id)).toEqual({
      id,
      clientId: 'trusted',
      redirectUri: 'https://trusted.example.com/callback',
      scopes: ['read', 'write'],
      state: 'client-state',
      codeChallenge: 'challenge-C',
      codeChallengeMethod: 'S256',
      resource: undefined,
      expiresAt: expect.any(Number),
    });
    const { expiresAt } = (await store.get(id))!;
    expect(expiresAt).toBeGreaterThanOrEqual(before + 600_000);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + 600_000);
  });

  test('honours ttlSeconds', async () => {
    const store = createMemoryPendingAuthorizationStore();
    const onAuthorize = createPendingConsentOnAuthorize({
      consentUrl: CONSENT_URL,
      store,
      ttlSeconds: 60,
    });

    const res = await onAuthorize({
      client: trustedClient,
      headers: {},
      request: {
        clientId: 'trusted',
        redirectUri: 'https://trusted.example.com/callback',
        scopes: [],
        codeChallenge: 'c',
        codeChallengeMethod: 'S256',
      },
    });

    if (res.approved) throw new Error('expected a redirect');
    const pending = await store.get(consentIdFrom(res.redirect));
    expect(pending!.expiresAt).toBeLessThanOrEqual(Date.now() + 60_000);
    expect(pending!.expiresAt).toBeGreaterThan(Date.now() + 50_000);
  });

  test('approve → resume issues a code to the redirect the user saw', async () => {
    const { authorize, store, clientStore } = setup();
    const id = consentIdFrom((await authorize(trustedQuery)).redirect);

    const view = await getConsentRequest({ store, id, clientStore });
    expect(view).toEqual({
      id,
      clientId: 'trusted',
      clientName: 'Trusted App',
      logoUri: 'https://trusted.example.com/logo.png',
      redirectUri: 'https://trusted.example.com/callback',
      scopes: ['read', 'write'],
      expiresAt: expect.any(Number),
    });

    const approved = await approveConsentRequest({
      store,
      id,
      subject: 'user-1',
      authorizeUrl: AUTHORIZE_URL,
    });
    expect(approved!.redirect.startsWith(`${AUTHORIZE_URL}?`)).toBe(true);
    expect(approved!.resumeParams).toEqual(queryOf(approved!.redirect));
    expect(queryOf(approved!.redirect)).toEqual({
      ...trustedQuery,
      [CONSENT_REQUEST_PARAM]: id,
      [CONSENT_RESUME_PARAM]: expect.stringMatching(/^[\w-]{43}$/),
    });

    const res = await authorize(queryOf(approved!.redirect));

    const callback = new URL(res.redirect!);
    expect(callback.origin + callback.pathname).toBe(
      'https://trusted.example.com/callback'
    );
    expect(callback.searchParams.get('code')).toBeTruthy();
    expect(callback.searchParams.get('state')).toBe('client-state');
    expect(await store.get(id)).toBeUndefined();
  });

  test('an approval is single-use', async () => {
    const { authorize, store } = setup();
    const id = consentIdFrom((await authorize(trustedQuery)).redirect);
    const approved = await approveConsentRequest({
      store,
      id,
      subject: 'user-1',
      authorizeUrl: AUTHORIZE_URL,
    });
    await authorize(queryOf(approved!.redirect));

    const replay = await authorize(queryOf(approved!.redirect));

    expect(consentIdFrom(replay.redirect)).not.toBe(id);
  });

  test('issues the code with the scopes the user granted', async () => {
    const issued: string[][] = [];
    const store = createMemoryPendingAuthorizationStore();
    const authCodeStore = createMemoryAuthCodeStore();
    const server = createOAuthHandlers({
      issuer: ISSUER,
      clientStore: createMemoryClientStore([trustedClient]),
      authCodeStore: {
        ...authCodeStore,
        save: (code) => {
          issued.push(code.scopes);
          return authCodeStore.save(code);
        },
      },
      issueTokens: () => {
        return { accessToken: 'a', expiresIn: 1 };
      },
      onAuthorize: createPendingConsentOnAuthorize({
        consentUrl: CONSENT_URL,
        store,
      }),
    });
    const first = await server.authorize({
      query: trustedQuery,
      body: {},
      headers: {},
    });
    const id = consentIdFrom(first.redirect);

    const approved = await approveConsentRequest({
      store,
      id,
      subject: 'user-1',
      scopes: ['read'],
      authorizeUrl: AUTHORIZE_URL,
    });
    await server.authorize({
      query: queryOf(approved!.redirect),
      body: {},
      headers: {},
    });

    expect(issued).toEqual([['read']]);
  });

  test('carries the RFC 8707 resource through the round trip', async () => {
    const resource = 'https://mcp.example.com';
    const { authorize, store } = setup({ resource });
    const id = consentIdFrom(
      (await authorize({ ...trustedQuery, resource })).redirect
    );
    expect((await store.get(id))!.resource).toBe(resource);

    const approved = await approveConsentRequest({
      store,
      id,
      subject: 'user-1',
      authorizeUrl: AUTHORIZE_URL,
    });
    expect(queryOf(approved!.redirect).resource).toBe(resource);

    const res = await authorize(queryOf(approved!.redirect));
    expect(new URL(res.redirect!).searchParams.get('code')).toBeTruthy();
  });

  describe('an approval is bound to the request the user saw', () => {
    const approveTrusted = async () => {
      const ctx = setup();
      const id = consentIdFrom((await ctx.authorize(trustedQuery)).redirect);
      const approved = await approveConsentRequest({
        store: ctx.store,
        id,
        subject: 'victim',
        authorizeUrl: AUTHORIZE_URL,
      });
      return { ...ctx, id, resume: queryOf(approved!.redirect) };
    };

    test('the holder of the request id cannot redeem it without the resume secret', async () => {
      const { authorize, store, id, resume } = await approveTrusted();
      const withoutSecret = { ...resume };
      delete withoutSecret[CONSENT_RESUME_PARAM];

      const polled = await authorize(withoutSecret);

      expect(polled.redirect).not.toContain('code=');
      expect(consentIdFrom(polled.redirect)).not.toBe(id);
      expect((await store.get(id))!.approval).toBeDefined();

      const res = await authorize(resume);
      expect(new URL(res.redirect!).searchParams.get('code')).toBeTruthy();
    });

    test('a wrong resume secret neither redeems nor burns the approval', async () => {
      const { authorize, store, id, resume } = await approveTrusted();

      const forged = await authorize({
        ...resume,
        [CONSENT_RESUME_PARAM]: 'x'.repeat(43),
      });

      expect(forged.redirect).not.toContain('code=');
      expect((await store.get(id))!.approval).toBeDefined();
    });

    test('two concurrent resumes issue one code', async () => {
      const { authorize, resume } = await approveTrusted();

      const results = await Promise.all([authorize(resume), authorize(resume)]);

      const codes = results.filter((res) => {
        return new URL(res.redirect!).searchParams.get('code');
      });
      expect(codes).toHaveLength(1);
    });

    test('another client with the same challenge cannot redeem it', async () => {
      const { authorize, store, id, resume } = await approveTrusted();

      const res = await authorize({
        ...resume,
        client_id: 'attacker',
        redirect_uri: 'https://evil.example/cb',
      });

      expect(new URL(res.redirect!).origin).toBe('https://app.example.com');
      expect(res.redirect).not.toContain('code=');
      expect((await store.get(id))!.approval).toMatchObject({
        subject: 'victim',
        scopes: ['read', 'write'],
      });
    });

    test.each([
      ['code_challenge', { code_challenge: 'other-challenge' }],
      ['scope', { scope: 'read write admin' }],
      ['state', { state: 'other-state' }],
      ['resource', { resource: 'https://other.example.com' }],
    ])('a different %s starts a fresh consent', async (_, override) => {
      const { authorize, id, resume } = await approveTrusted();

      const res = await authorize({ ...resume, ...override });

      expect(consentIdFrom(res.redirect)).not.toBe(id);
    });

    test('an unapproved request is not approved on resume', async () => {
      const { authorize } = setup();
      const id = consentIdFrom((await authorize(trustedQuery)).redirect);

      const res = await authorize({
        ...trustedQuery,
        [CONSENT_REQUEST_PARAM]: id,
      });

      expect(consentIdFrom(res.redirect)).not.toBe(id);
    });

    test('an unknown id starts a fresh consent', async () => {
      const { authorize } = setup();

      const res = await authorize({
        ...trustedQuery,
        [CONSENT_REQUEST_PARAM]: 'unknown',
      });

      expect(consentIdFrom(res.redirect)).not.toBe('unknown');
    });

    test('an expired approval is not honoured', async () => {
      const { authorize, store, id, resume } = await approveTrusted();
      const pending = (await store.get(id))!;
      await store.save({ ...pending, expiresAt: Date.now() - 1 });

      const res = await authorize(resume);

      expect(consentIdFrom(res.redirect)).not.toBe(id);
    });
  });
});

describe('getConsentRequest', () => {
  const pending = (
    overrides: Partial<PendingAuthorization> = {}
  ): PendingAuthorization => {
    return {
      id: 'p1',
      clientId: 'trusted',
      redirectUri: 'https://trusted.example.com/callback',
      scopes: ['read'],
      codeChallenge: 'c',
      codeChallengeMethod: 'S256',
      expiresAt: Date.now() + 60_000,
      ...overrides,
    };
  };

  test('returns undefined for an unknown id', async () => {
    const store = createMemoryPendingAuthorizationStore();

    expect(await getConsentRequest({ store, id: 'nope' })).toBeUndefined();
  });

  test('returns undefined for an expired request', async () => {
    const store = createMemoryPendingAuthorizationStore();
    await store.save(pending({ expiresAt: Date.now() - 1 }));

    expect(await getConsentRequest({ store, id: 'p1' })).toBeUndefined();
  });

  test('returns undefined once approved', async () => {
    const store = createMemoryPendingAuthorizationStore();
    await store.save(
      pending({
        approval: { subject: 'u', scopes: [], resumeSecretHash: 'h' },
      })
    );

    expect(await getConsentRequest({ store, id: 'p1' })).toBeUndefined();
  });

  test('fills display fields from the fallback', async () => {
    const store = createMemoryPendingAuthorizationStore();
    await store.save(pending({ clientId: 'unregistered' }));

    const view = await getConsentRequest({
      store,
      id: 'p1',
      getClientDisplayFallback: ({ clientId }) => {
        return { clientName: `Fallback ${clientId}` };
      },
    });

    expect(view).toMatchObject({
      clientName: 'Fallback unregistered',
      logoUri: undefined,
    });
  });
});

describe('approveConsentRequest', () => {
  const seed = async (overrides: Partial<PendingAuthorization> = {}) => {
    const store = createMemoryPendingAuthorizationStore();
    await store.save({
      id: 'p1',
      clientId: 'trusted',
      redirectUri: 'https://trusted.example.com/callback',
      scopes: ['read', 'write'],
      codeChallenge: 'c',
      codeChallengeMethod: 'S256',
      expiresAt: Date.now() + 60_000,
      ...overrides,
    });
    return store;
  };

  const approve = (
    store: ReturnType<typeof createMemoryPendingAuthorizationStore>,
    extra: { scopes?: string[]; subject?: string } = {}
  ) => {
    return approveConsentRequest({
      store,
      id: 'p1',
      subject: extra.subject ?? 'user-1',
      scopes: extra.scopes,
      authorizeUrl: AUTHORIZE_URL,
    });
  };

  test('refuses scopes beyond the requested ones', async () => {
    const store = await seed();

    expect(await approve(store, { scopes: ['read', 'admin'] })).toBeUndefined();
    expect((await store.get('p1'))!.approval).toBeUndefined();
  });

  test('refuses an expired request', async () => {
    const store = await seed({ expiresAt: Date.now() - 1 });

    expect(await approve(store)).toBeUndefined();
  });

  test('refuses an unknown id', async () => {
    const store = createMemoryPendingAuthorizationStore();

    expect(await approve(store)).toBeUndefined();
  });

  test('of two concurrent approvals, only one is recorded', async () => {
    const store = await seed();

    const results = await Promise.all([
      approve(store, { subject: 'first' }),
      approve(store, { subject: 'second' }),
    ]);

    expect(
      results.filter((result) => {
        return result !== undefined;
      })
    ).toHaveLength(1);
  });

  test('refuses a second approval, keeping the first subject', async () => {
    const store = await seed();
    await approve(store, { subject: 'first' });

    expect(await approve(store, { subject: 'second' })).toBeUndefined();
    expect((await store.get('p1'))!.approval!.subject).toBe('first');
  });

  test('without authorizeUrl, returns only the resume params', async () => {
    const store = await seed();

    const res = await approveConsentRequest({
      store,
      id: 'p1',
      subject: 'user-1',
    });

    expect(res).toEqual({ resumeParams: expect.any(Object) });
    expect(res!.resumeParams).toMatchObject({
      response_type: 'code',
      client_id: 'trusted',
      consent_request: 'p1',
      consent_resume: expect.stringMatching(/^[\w-]{43}$/),
    });
  });

  test('omits state and resource when the request had none', async () => {
    const store = await seed();

    const res = await approve(store);

    const params = new URL(res!.redirect).searchParams;
    expect(params.has('state')).toBe(false);
    expect(params.has('resource')).toBe(false);
  });
});

describe('denyConsentRequest', () => {
  const seed = async () => {
    const store = createMemoryPendingAuthorizationStore();
    await store.save({
      id: 'p1',
      clientId: 'trusted',
      redirectUri: 'https://trusted.example.com/callback',
      scopes: [],
      codeChallenge: 'c',
      codeChallengeMethod: 'S256',
      expiresAt: Date.now() + 60_000,
    });
    return store;
  };

  test('discards the pending request', async () => {
    const store = await seed();

    await denyConsentRequest({ store, id: 'p1' });

    expect(await store.get('p1')).toBeUndefined();
  });

  test('leaves an approved request alone', async () => {
    const store = await seed();
    await approveConsentRequest({
      store,
      id: 'p1',
      subject: 'u',
      authorizeUrl: AUTHORIZE_URL,
    });

    await denyConsentRequest({ store, id: 'p1' });

    expect((await store.get('p1'))!.approval).toBeDefined();
  });

  test('is a no-op for an unknown id', async () => {
    const store = createMemoryPendingAuthorizationStore();

    await expect(
      denyConsentRequest({ store, id: 'nope' })
    ).resolves.toBeUndefined();
  });
});
