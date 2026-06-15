import type {
  AuthCodeStore,
  ClientStore,
  OAuthClient,
  RefreshTokenStore,
  StoredAuthorizationCode,
  StoredRefreshToken,
} from './oauthServerTypes';

/**
 * In-memory reference {@link ClientStore}. Backed by a `Map`, so state is lost
 * on restart — intended for tests, local development, and examples, not
 * production. Seed it with pre-registered clients via `initial`.
 */
export const createMemoryClientStore = (
  initial: OAuthClient[] = []
): ClientStore => {
  const clients = new Map<string, OAuthClient>(
    initial.map((client) => {
      return [client.client_id, client];
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

/**
 * In-memory reference {@link AuthCodeStore}. Backed by a `Map` keyed by the
 * authorization code; codes are removed on exchange (single use). For tests and
 * local development only.
 */
export const createMemoryAuthCodeStore = (): AuthCodeStore => {
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

/**
 * In-memory reference {@link RefreshTokenStore}. Backed by a `Map` keyed by the
 * token hash, with owner-scoped revocation for reuse detection. For tests and
 * local development only — production should persist tokens durably.
 */
export const createMemoryRefreshTokenStore = (): RefreshTokenStore => {
  const tokens = new Map<string, StoredRefreshToken>();
  return {
    save: (token) => {
      tokens.set(token.tokenHash, token);
    },
    get: (tokenHash) => {
      return tokens.get(tokenHash);
    },
    delete: (tokenHash) => {
      tokens.delete(tokenHash);
    },
    deleteByOwner: ({ clientId, subject }) => {
      for (const [tokenHash, token] of tokens) {
        if (token.clientId === clientId && token.subject === subject) {
          tokens.delete(tokenHash);
        }
      }
    },
  };
};
