import type {
  EmailAuthUser,
  EmailAuthUserStore,
  OneTimeTokenStore,
  StoredOneTimeToken,
} from './emailAuthTypes';
import type {
  AccessTokenStore,
  AuthCodeStore,
  ClientStore,
  OAuthClient,
  RefreshTokenStore,
  StoredAccessToken,
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

/**
 * In-memory reference {@link AccessTokenStore}. Backed by a `Map` keyed by the
 * token hash, with subject-scoped revocation. For tests and local development
 * only — production should persist tokens durably behind the same interface.
 */
export const createMemoryAccessTokenStore = (): AccessTokenStore => {
  const tokens = new Map<string, StoredAccessToken>();
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
    deleteBySubject: (subject) => {
      for (const [tokenHash, token] of tokens) {
        if (token.subject === subject) {
          tokens.delete(tokenHash);
        }
      }
    },
    touchLastUsed: ({ tokenHash, lastUsedAt }) => {
      const token = tokens.get(tokenHash);
      if (token) {
        tokens.set(tokenHash, { ...token, lastUsedAt });
      }
    },
    listBySubject: (subject) => {
      return [...tokens.values()].filter((token) => {
        return token.subject === subject;
      });
    },
  };
};

/**
 * In-memory reference {@link EmailAuthUserStore}, keyed by normalized email.
 * Ids are sequential, so they are stable within a run but meaningless across
 * runs. For tests, local development, and examples only.
 */
export const createMemoryUserStore = (
  initial: EmailAuthUser[] = []
): EmailAuthUserStore => {
  const users = new Map<string, EmailAuthUser>(
    initial.map((user) => {
      return [user.email, user];
    })
  );

  let nextId = initial.length + 1;

  const findById = (id: string): EmailAuthUser => {
    for (const user of users.values()) {
      if (user.id === id) {
        return user;
      }
    }

    throw new Error(`No user with id ${id}.`);
  };

  return {
    findByEmail: (email) => {
      return users.get(email) ?? null;
    },
    create: ({ email, passwordHash, emailVerified }) => {
      const user: EmailAuthUser = {
        id: `user_${nextId}`,
        email,
        passwordHash,
        emailVerified,
      };

      nextId += 1;
      users.set(email, user);

      return user;
    },
    update: ({ id, passwordHash, emailVerified }) => {
      const current = findById(id);

      const updated: EmailAuthUser = {
        ...current,
        ...(passwordHash === undefined ? {} : { passwordHash }),
        ...(emailVerified === undefined ? {} : { emailVerified }),
      };

      users.set(updated.email, updated);

      return updated;
    },
  };
};

/**
 * In-memory reference {@link OneTimeTokenStore}, keyed by `tokenHash` and
 * purpose. Implements the full surface, including the attempt counting the
 * `emailCode` mode requires. For tests and local development only.
 */
export const createMemoryOneTimeTokenStore = (): OneTimeTokenStore => {
  const tokens = new Map<string, StoredOneTimeToken>();

  const key = (args: { tokenHash: string; purpose: string }): string => {
    return `${args.purpose}:${args.tokenHash}`;
  };

  return {
    save: (token) => {
      tokens.set(key(token), token);
    },
    find: ({ tokenHash, purpose }) => {
      return tokens.get(key({ tokenHash, purpose })) ?? null;
    },
    findByEmail: ({ email, purpose }) => {
      for (const token of tokens.values()) {
        if (token.email === email && token.purpose === purpose) {
          return token;
        }
      }

      return null;
    },
    delete: ({ tokenHash, purpose }) => {
      tokens.delete(key({ tokenHash, purpose }));
    },
    deleteFor: ({ email, purpose }) => {
      for (const [entry, token] of tokens) {
        if (token.email === email && token.purpose === purpose) {
          tokens.delete(entry);
        }
      }
    },
    incrementAttempts: ({ tokenHash, purpose }) => {
      const entry = key({ tokenHash, purpose });
      const token = tokens.get(entry);

      if (token) {
        tokens.set(entry, { ...token, attempts: (token.attempts ?? 0) + 1 });
      }
    },
  };
};
