import {
  type ConsentStoreQuery,
  createPostgresConsentStore,
} from '../../../src/index';

const makeQuery = (
  rows: Record<string, unknown>[] = []
): jest.MockedFunction<ConsentStoreQuery> => {
  return jest.fn(async () => {
    return { rows };
  });
};

describe('createPostgresConsentStore', () => {
  const CODE_CHALLENGE = 'pkce-challenge-abc';

  describe('getConsentGrant', () => {
    test('returns undefined when no row is found', async () => {
      const query = makeQuery([]);
      const store = createPostgresConsentStore({ query });

      const result = await store.getConsentGrant({
        codeChallenge: CODE_CHALLENGE,
      });

      expect(result).toBeUndefined();
    });

    test('returns a parsed ConsentGrant when a row is found', async () => {
      const expiresAt = new Date('2099-01-01T00:00:00.000Z');
      const query = makeQuery([
        {
          subject: 'user-42',
          scopes: 'openid profile',
          expires_at: expiresAt.toISOString(),
        },
      ]);
      const store = createPostgresConsentStore({ query });

      const result = await store.getConsentGrant({
        codeChallenge: CODE_CHALLENGE,
      });

      expect(result).toEqual({
        subject: 'user-42',
        scopes: ['openid', 'profile'],
        expiresAt: expiresAt.getTime(),
      });
    });

    test('queries with the correct code_challenge parameter', async () => {
      const query = makeQuery([]);
      const store = createPostgresConsentStore({ query });

      await store.getConsentGrant({ codeChallenge: CODE_CHALLENGE });

      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ values: [CODE_CHALLENGE] })
      );
    });

    test('uses the default table name in the query', async () => {
      const query = makeQuery([]);
      const store = createPostgresConsentStore({ query });

      await store.getConsentGrant({ codeChallenge: CODE_CHALLENGE });

      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('oauth_consent_grants'),
        })
      );
    });

    test('uses a custom table name when provided', async () => {
      const query = makeQuery([]);
      const store = createPostgresConsentStore({
        query,
        tableName: 'my_consent_grants',
      });

      await store.getConsentGrant({ codeChallenge: CODE_CHALLENGE });

      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('my_consent_grants'),
        })
      );
    });
  });

  describe('deleteConsentGrant', () => {
    test('issues a DELETE query with the correct code_challenge', async () => {
      const query = makeQuery();
      const store = createPostgresConsentStore({ query });

      await store.deleteConsentGrant({ codeChallenge: CODE_CHALLENGE });

      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ values: [CODE_CHALLENGE] })
      );
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringMatching(/DELETE/i) })
      );
    });

    test('uses the default table name in the DELETE query', async () => {
      const query = makeQuery();
      const store = createPostgresConsentStore({ query });

      await store.deleteConsentGrant({ codeChallenge: CODE_CHALLENGE });

      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('oauth_consent_grants'),
        })
      );
    });
  });
});
