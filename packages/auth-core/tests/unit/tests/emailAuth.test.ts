import { createEmailAuthHandlers, normalizeEmail } from 'src/emailAuth';
import type {
  EmailAuthDelivery,
  EmailAuthMode,
  EmailAuthOptions,
} from 'src/emailAuthTypes';
import { hashPassword } from 'src/hash';
import {
  createMemoryOneTimeTokenStore,
  createMemoryUserStore,
} from 'src/memoryStores';
import type { AuthHttpRequest } from 'src/oauthServerTypes';

const BASE_URL = 'https://app.example.com';

const request = (body: Record<string, unknown>): AuthHttpRequest => {
  return { body, query: {}, headers: {} };
};

/**
 * Builds an engine over the in-memory reference stores, capturing every
 * delivery so a test can read the token the user would have received.
 */
const setup = (
  args: {
    modes?: EmailAuthMode[];
    users?: Array<{
      email: string;
      passwordHash?: string | null;
      emailVerified?: boolean;
    }>;
  } & Partial<EmailAuthOptions> = {}
) => {
  const { modes = ['password'], users = [], ...overrides } = args;

  const sent: EmailAuthDelivery[] = [];

  const userStore = createMemoryUserStore(
    users.map((user, index) => {
      return {
        id: `user_${index + 1}`,
        email: user.email,
        passwordHash: user.passwordHash ?? null,
        emailVerified: user.emailVerified ?? false,
      };
    })
  );

  const oneTimeTokenStore = createMemoryOneTimeTokenStore();

  const handlers = createEmailAuthHandlers({
    modes,
    userStore,
    oneTimeTokenStore,
    baseUrl: BASE_URL,
    issueSession: (user) => {
      return { accessToken: `token-for-${user.id}`, userId: user.id };
    },
    sendEmail: (delivery) => {
      sent.push(delivery);
    },
    ...overrides,
  });

  return { handlers, userStore, oneTimeTokenStore, sent };
};

const lastDelivery = (sent: EmailAuthDelivery[]): EmailAuthDelivery => {
  const delivery = sent.at(-1);

  if (!delivery) {
    throw new Error('No email was sent.');
  }

  return delivery;
};

// ---------------------------------------------------------------------------
// configuration
// ---------------------------------------------------------------------------

test('it should normalize an email by trimming and lower-casing', () => {
  expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
});

test('it should only mount the handlers for the enabled modes', () => {
  const { handlers } = setup({ modes: ['magicLink'] });

  expect(handlers.sendMagicLink).toBeDefined();
  expect(handlers.verifyMagicLink).toBeDefined();
  expect(handlers.signUp).toBeUndefined();
  expect(handlers.signIn).toBeUndefined();
  expect(handlers.resetPassword).toBeUndefined();
  expect(handlers.modes).toEqual(['magicLink']);
});

test('it should expose resolved paths and allow overriding them', () => {
  const { handlers } = setup({
    modes: ['password'],
    paths: { signIn: '/v1/auth/sessions' },
  });

  expect(handlers.paths.signIn).toBe('/v1/auth/sessions');
  expect(handlers.paths.signUp).toBe('/auth/signup');
});

test('it should require at least one mode', () => {
  expect(() => {
    return setup({ modes: [] });
  }).toThrow('at least one mode');
});

test('it should require baseUrl when a mode sends a link', () => {
  expect(() => {
    return setup({ modes: ['magicLink'], baseUrl: undefined });
  }).toThrow('requires baseUrl');
});

test('it should not require baseUrl when only mailing codes', () => {
  expect(() => {
    return setup({ modes: ['emailCode'], baseUrl: undefined });
  }).not.toThrow();
});

/**
 * A short code without attempt counting is brute-forceable, so the engine
 * refuses to start rather than silently running unprotected.
 */
test('it should require attempt counting when the emailCode mode is enabled', () => {
  const store = createMemoryOneTimeTokenStore();

  expect(() => {
    return setup({
      modes: ['emailCode'],
      oneTimeTokenStore: { ...store, incrementAttempts: undefined },
    });
  }).toThrow('incrementAttempts');

  expect(() => {
    return setup({
      modes: ['emailCode'],
      oneTimeTokenStore: { ...store, findByEmail: undefined },
    });
  }).toThrow('findByEmail');
});

// ---------------------------------------------------------------------------
// password
// ---------------------------------------------------------------------------

test('it should sign a user up and issue a session', async () => {
  const { handlers, sent } = setup({ modes: ['password'] });

  const response = await handlers.signUp?.(
    request({ email: 'New@Example.com', password: 'a-good-password' })
  );

  expect(response?.status).toBe(201);
  expect(response?.body).toMatchObject({ accessToken: 'token-for-user_1' });
  // No emailVerification mode, so nothing to confirm and nothing to send.
  expect(sent).toHaveLength(0);
});

test('it should store the sign-up email normalized', async () => {
  const { handlers, userStore } = setup({ modes: ['password'] });

  await handlers.signUp?.(
    request({ email: '  Mixed@Example.COM ', password: 'a-good-password' })
  );

  expect(await userStore.findByEmail('mixed@example.com')).toMatchObject({
    email: 'mixed@example.com',
  });
});

test('it should never store the plain password', async () => {
  const { handlers, userStore } = setup({ modes: ['password'] });

  await handlers.signUp?.(
    request({ email: 'new@example.com', password: 'a-good-password' })
  );

  const user = await userStore.findByEmail('new@example.com');

  expect(user?.passwordHash).not.toContain('a-good-password');
  expect(user?.passwordHash).toMatch(/^pbkdf2-sha256\$/);
});

test('it should reject a sign-up for an existing email', async () => {
  const { handlers } = setup({
    modes: ['password'],
    users: [{ email: 'taken@example.com' }],
  });

  const response = await handlers.signUp?.(
    request({ email: 'taken@example.com', password: 'a-good-password' })
  );

  expect(response?.status).toBe(409);
  expect(response?.body).toMatchObject({ error: { code: 'email_exists' } });
});

test('it should reject a malformed email', async () => {
  const { handlers } = setup({ modes: ['password'] });

  const response = await handlers.signUp?.(
    request({ email: 'not-an-email', password: 'a-good-password' })
  );

  expect(response?.status).toBe(400);
  expect(response?.body).toMatchObject({ error: { code: 'invalid_request' } });
});

test('it should reject a password below the minimum length', async () => {
  const { handlers } = setup({
    modes: ['password'],
    password: { minLength: 10 },
  });

  const response = await handlers.signUp?.(
    request({ email: 'new@example.com', password: 'short' })
  );

  expect(response?.status).toBe(400);
  expect(response?.body).toMatchObject({
    error: {
      code: 'password_too_weak',
      message: 'password must be at least 10 characters.',
    },
  });
});

test('it should require a password on sign-up', async () => {
  const { handlers } = setup({ modes: ['password'] });

  const response = await handlers.signUp?.(
    request({ email: 'new@example.com' })
  );

  expect(response?.status).toBe(400);
});

test('it should sign an existing user in', async () => {
  const { handlers } = setup({
    modes: ['password'],
    users: [
      {
        email: 'user@example.com',
        passwordHash: await hashPassword('a-good-password'),
        emailVerified: true,
      },
    ],
  });

  const response = await handlers.signIn?.(
    request({ email: 'user@example.com', password: 'a-good-password' })
  );

  expect(response?.status).toBe(200);
  expect(response?.body).toMatchObject({ accessToken: 'token-for-user_1' });
});

test('it should reject a wrong password', async () => {
  const { handlers } = setup({
    modes: ['password'],
    users: [
      {
        email: 'user@example.com',
        passwordHash: await hashPassword('a-good-password'),
      },
    ],
  });

  const response = await handlers.signIn?.(
    request({ email: 'user@example.com', password: 'wrong-password' })
  );

  expect(response?.status).toBe(401);
  expect(response?.body).toMatchObject({
    error: { code: 'invalid_credentials' },
  });
});

/**
 * An unknown address and a user who has no password must be indistinguishable
 * from a wrong password, or the response becomes an account-enumeration oracle.
 */
test('it should not distinguish an unknown address from a wrong password', async () => {
  const { handlers } = setup({
    modes: ['password'],
    users: [{ email: 'codeonly@example.com', passwordHash: null }],
  });

  const unknown = await handlers.signIn?.(
    request({ email: 'nobody@example.com', password: 'a-good-password' })
  );
  const noPassword = await handlers.signIn?.(
    request({ email: 'codeonly@example.com', password: 'a-good-password' })
  );

  expect(unknown).toEqual(noPassword);
  expect(unknown?.status).toBe(401);
});

test('it should require both email and password to sign in', async () => {
  const { handlers } = setup({ modes: ['password'] });

  const response = await handlers.signIn?.(
    request({ email: 'user@example.com' })
  );

  expect(response?.status).toBe(400);
});

test('it should reject an unverified user when requireVerifiedEmail is set', async () => {
  const { handlers } = setup({
    modes: ['password'],
    password: { requireVerifiedEmail: true },
    users: [
      {
        email: 'user@example.com',
        passwordHash: await hashPassword('a-good-password'),
        emailVerified: false,
      },
    ],
  });

  const response = await handlers.signIn?.(
    request({ email: 'user@example.com', password: 'a-good-password' })
  );

  expect(response?.status).toBe(403);
  expect(response?.body).toMatchObject({
    error: { code: 'email_not_verified' },
  });
});

test('it should rehash a legacy password hash on a successful sign-in', async () => {
  const { handlers, userStore } = setup({
    modes: ['password'],
    users: [
      {
        email: 'user@example.com',
        passwordHash: await hashPassword('a-good-password', {
          iterations: 1000,
        }),
      },
    ],
  });

  await handlers.signIn?.(
    request({ email: 'user@example.com', password: 'a-good-password' })
  );

  const user = await userStore.findByEmail('user@example.com');

  expect(user?.passwordHash).toMatch(/^pbkdf2-sha256\$600000\$/);
});

test('it should withhold the session on sign-up when email verification is enabled', async () => {
  const { handlers, sent } = setup({
    modes: ['password', 'emailVerification'],
  });

  const response = await handlers.signUp?.(
    request({ email: 'new@example.com', password: 'a-good-password' })
  );

  expect(response?.status).toBe(201);
  expect(response?.body).not.toHaveProperty('accessToken');
  expect(lastDelivery(sent).purpose).toBe('emailVerification');
});

test('it should issue a session on sign-up when signInOnSignUp overrides verification', async () => {
  const { handlers } = setup({
    modes: ['password', 'emailVerification'],
    password: { signInOnSignUp: true },
  });

  const response = await handlers.signUp?.(
    request({ email: 'new@example.com', password: 'a-good-password' })
  );

  expect(response?.body).toMatchObject({ accessToken: 'token-for-user_1' });
});

// ---------------------------------------------------------------------------
// magicLink
// ---------------------------------------------------------------------------

test('it should mail a magic link and sign the user in when it is redeemed', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
  });

  const send = await handlers.sendMagicLink?.(
    request({ email: 'user@example.com' })
  );

  expect(send?.status).toBe(200);

  const delivery = lastDelivery(sent);

  expect(delivery.purpose).toBe('magicLink');
  expect(delivery.token).toHaveLength(64);
  expect(delivery.url).toBe(
    `${BASE_URL}/auth/callback?token=${delivery.token}`
  );

  const verify = await handlers.verifyMagicLink?.(
    request({ token: delivery.token })
  );

  expect(verify?.status).toBe(200);
  expect(verify?.body).toMatchObject({ accessToken: 'token-for-user_1' });
});

test('it should confirm the address when a magic link is redeemed', async () => {
  const { handlers, sent, userStore } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com', emailVerified: false }],
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));
  await handlers.verifyMagicLink?.(
    request({ token: lastDelivery(sent).token })
  );

  expect(await userStore.findByEmail('user@example.com')).toMatchObject({
    emailVerified: true,
  });
});

test('it should leave an already-confirmed address untouched on redemption', async () => {
  const { handlers, sent, userStore } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com', emailVerified: true }],
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));

  const response = await handlers.verifyMagicLink?.(
    request({ token: lastDelivery(sent).token })
  );

  expect(response?.status).toBe(200);
  expect(await userStore.findByEmail('user@example.com')).toMatchObject({
    emailVerified: true,
  });
});

test('it should accept a link token from the query string', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));

  const response = await handlers.verifyMagicLink?.({
    body: {},
    query: { token: lastDelivery(sent).token },
    headers: {},
  });

  expect(response?.status).toBe(200);
});

test('it should honour a custom link path', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
    linkPaths: { magicLink: '/enter' },
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));

  expect(lastDelivery(sent).url).toContain(`${BASE_URL}/enter?token=`);
});

test('it should let a magic link be redeemed only once', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));

  const { token } = lastDelivery(sent);

  await handlers.verifyMagicLink?.(request({ token }));
  const replay = await handlers.verifyMagicLink?.(request({ token }));

  expect(replay?.status).toBe(401);
  expect(replay?.body).toMatchObject({ error: { code: 'invalid_token' } });
});

test('it should invalidate the previous magic link when a new one is issued', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));
  const first = lastDelivery(sent).token;

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));
  const second = lastDelivery(sent).token;

  expect(
    await handlers.verifyMagicLink?.(request({ token: first }))
  ).toMatchObject({ status: 401 });
  expect(
    await handlers.verifyMagicLink?.(request({ token: second }))
  ).toMatchObject({ status: 200 });
});

test('it should reject an expired magic link', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
    ttl: { magicLink: -1 },
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));

  const response = await handlers.verifyMagicLink?.(
    request({ token: lastDelivery(sent).token })
  );

  expect(response?.status).toBe(401);
  expect(response?.body).toMatchObject({ error: { code: 'expired_token' } });
});

test('it should require a token to redeem a magic link', async () => {
  const { handlers } = setup({ modes: ['magicLink'] });

  const response = await handlers.verifyMagicLink?.(request({}));

  expect(response?.status).toBe(400);
});

/**
 * The acknowledgement must not reveal whether the address is on file, so an
 * unknown address gets the same body as a known one and no email at all.
 */
test('it should acknowledge a magic link for an unknown address without sending mail', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
  });

  const known = await handlers.sendMagicLink?.(
    request({ email: 'user@example.com' })
  );
  const unknown = await handlers.sendMagicLink?.(
    request({ email: 'nobody@example.com' })
  );

  expect(unknown).toEqual(known);
  expect(sent).toHaveLength(1);
});

test('it should reject a malformed address when mailing a magic link', async () => {
  const { handlers } = setup({ modes: ['magicLink'] });

  const response = await handlers.sendMagicLink?.(request({ email: 'nope' }));

  expect(response?.status).toBe(400);
});

test('it should reject a missing address when mailing a magic link', async () => {
  const { handlers } = setup({ modes: ['magicLink'] });

  const response = await handlers.sendMagicLink?.(request({}));

  expect(response?.status).toBe(400);
  expect(response?.body).toMatchObject({ error: { code: 'invalid_request' } });
});

/**
 * A token outlives the row it points at if the account is deleted mid-flight.
 * Redeeming it must fail rather than resolve to a missing user.
 */
test('it should refuse a link token whose user no longer exists', async () => {
  const users = createMemoryUserStore([
    { id: 'user_1', email: 'user@example.com', passwordHash: null },
  ]);

  const sent: EmailAuthDelivery[] = [];
  let deleted = false;

  const handlers = createEmailAuthHandlers({
    modes: ['magicLink'],
    baseUrl: BASE_URL,
    oneTimeTokenStore: createMemoryOneTimeTokenStore(),
    userStore: {
      ...users,
      findByEmail: (email) => {
        return deleted ? null : users.findByEmail(email);
      },
    },
    issueSession: (user) => {
      return { accessToken: `token-for-${user.id}` };
    },
    sendEmail: (delivery) => {
      sent.push(delivery);
    },
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));

  deleted = true;

  const response = await handlers.verifyMagicLink?.(
    request({ token: lastDelivery(sent).token })
  );

  expect(response?.status).toBe(401);
  expect(response?.body).toMatchObject({ error: { code: 'invalid_token' } });
});

// ---------------------------------------------------------------------------
// emailCode
// ---------------------------------------------------------------------------

test('it should mail a six-digit code carrying no link', async () => {
  const { handlers, sent } = setup({ modes: ['emailCode'] });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const delivery = lastDelivery(sent);

  expect(delivery.purpose).toBe('emailCode');
  expect(delivery.token).toMatch(/^\d{6}$/);
  expect(delivery.url).toBeUndefined();
});

test('it should honour the digits option', async () => {
  const { handlers, sent } = setup({
    modes: ['emailCode'],
    emailCode: { digits: 8 },
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  expect(lastDelivery(sent).token).toMatch(/^\d{8}$/);
});

test('it should create the user when an unknown address verifies a code', async () => {
  const { handlers, sent, userStore } = setup({ modes: ['emailCode'] });

  await handlers.sendEmailCode?.(request({ email: 'new@example.com' }));

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'new@example.com', code: lastDelivery(sent).token })
  );

  expect(response?.status).toBe(200);
  expect(response?.body).toMatchObject({ accessToken: 'token-for-user_1' });

  const user = await userStore.findByEmail('new@example.com');

  expect(user).toMatchObject({ emailVerified: true, passwordHash: null });
});

test('it should sign an existing user in with a code', async () => {
  const { handlers, sent } = setup({
    modes: ['emailCode'],
    users: [{ email: 'user@example.com', emailVerified: true }],
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: lastDelivery(sent).token })
  );

  expect(response?.body).toMatchObject({ accessToken: 'token-for-user_1' });
});

test('it should not send a code to an unknown address when createUserOnVerify is off', async () => {
  const { handlers, sent } = setup({
    modes: ['emailCode'],
    emailCode: { createUserOnVerify: false },
  });

  const response = await handlers.sendEmailCode?.(
    request({ email: 'nobody@example.com' })
  );

  expect(response?.status).toBe(200);
  expect(sent).toHaveLength(0);
});

test('it should reject a missing address when mailing a code', async () => {
  const { handlers } = setup({ modes: ['emailCode'] });

  const response = await handlers.sendEmailCode?.(request({}));

  expect(response?.status).toBe(400);
});

test('it should confirm an unverified address when a code is redeemed', async () => {
  const { handlers, sent, userStore } = setup({
    modes: ['emailCode'],
    users: [{ email: 'user@example.com', emailVerified: false }],
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));
  await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: lastDelivery(sent).token })
  );

  expect(await userStore.findByEmail('user@example.com')).toMatchObject({
    emailVerified: true,
  });
});

/**
 * With sign-up disabled, a code that outlived its user row must not quietly
 * recreate the account.
 */
test('it should refuse a code whose user disappeared when createUserOnVerify is off', async () => {
  const users = createMemoryUserStore([
    { id: 'user_1', email: 'user@example.com', passwordHash: null },
  ]);

  const sent: EmailAuthDelivery[] = [];
  let deleted = false;

  const handlers = createEmailAuthHandlers({
    modes: ['emailCode'],
    emailCode: { createUserOnVerify: false },
    oneTimeTokenStore: createMemoryOneTimeTokenStore(),
    userStore: {
      ...users,
      findByEmail: (email) => {
        return deleted ? null : users.findByEmail(email);
      },
    },
    issueSession: (user) => {
      return { accessToken: `token-for-${user.id}` };
    },
    sendEmail: (delivery) => {
      sent.push(delivery);
    },
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  deleted = true;

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: lastDelivery(sent).token })
  );

  expect(response?.status).toBe(401);
});

test('it should reject a wrong code', async () => {
  const { handlers, sent } = setup({ modes: ['emailCode'] });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const wrong = lastDelivery(sent).token === '000000' ? '111111' : '000000';

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: wrong })
  );

  expect(response?.status).toBe(401);
  expect(response?.body).toMatchObject({ error: { code: 'invalid_token' } });
});

test('it should require both email and code to verify', async () => {
  const { handlers } = setup({ modes: ['emailCode'] });

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com' })
  );

  expect(response?.status).toBe(400);
});

test('it should reject a code for an address with none outstanding', async () => {
  const { handlers } = setup({ modes: ['emailCode'] });

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: '123456' })
  );

  expect(response?.status).toBe(401);
  expect(response?.body).toMatchObject({ error: { code: 'invalid_token' } });
});

test('it should reject an expired code', async () => {
  const { handlers, sent } = setup({
    modes: ['emailCode'],
    ttl: { emailCode: -1 },
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: lastDelivery(sent).token })
  );

  expect(response?.status).toBe(401);
  expect(response?.body).toMatchObject({ error: { code: 'expired_token' } });
});

test('it should let a code be redeemed only once', async () => {
  const { handlers, sent } = setup({ modes: ['emailCode'] });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const { token } = lastDelivery(sent);

  await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: token })
  );

  const replay = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: token })
  );

  expect(replay?.status).toBe(401);
});

/**
 * A six-digit code is only ~20 bits, so the bounded attempt count is what makes
 * the flow safe. Once it is spent the code must be destroyed, not merely
 * refused, or an attacker can keep guessing until it expires.
 */
test('it should destroy a code after too many wrong attempts', async () => {
  const { handlers, sent } = setup({
    modes: ['emailCode'],
    emailCode: { maxAttempts: 3 },
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const { token } = lastDelivery(sent);
  const wrong = token === '000000' ? '111111' : '000000';

  const first = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: wrong })
  );
  const second = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: wrong })
  );
  const third = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: wrong })
  );

  expect(first?.status).toBe(401);
  expect(second?.status).toBe(401);
  expect(third?.status).toBe(429);
  expect(third?.body).toMatchObject({ error: { code: 'too_many_attempts' } });

  // The correct code is gone too, so the user has to request a new one.
  const afterLockout = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: token })
  );

  expect(afterLockout?.status).toBe(401);
});

/**
 * `attempts` is optional on the stored record, so a store that has never
 * written it must still charge the first wrong guess.
 */
test('it should charge an attempt against a record with no attempt count', async () => {
  const store = createMemoryOneTimeTokenStore();

  const { handlers, sent } = setup({
    modes: ['emailCode'],
    emailCode: { maxAttempts: 2 },
    oneTimeTokenStore: {
      ...store,
      save: (token) => {
        return store.save({ ...token, attempts: undefined });
      },
    },
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const wrong = lastDelivery(sent).token === '000000' ? '111111' : '000000';

  const first = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: wrong })
  );
  const second = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: wrong })
  );

  expect(first?.status).toBe(401);
  expect(second?.status).toBe(429);
});

test('it should reset the attempt count when a new code is issued', async () => {
  const { handlers, sent } = setup({
    modes: ['emailCode'],
    emailCode: { maxAttempts: 2 },
  });

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const wrong = lastDelivery(sent).token === '000000' ? '111111' : '000000';

  await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: wrong })
  );

  await handlers.sendEmailCode?.(request({ email: 'user@example.com' }));

  const response = await handlers.verifyEmailCode?.(
    request({ email: 'user@example.com', code: lastDelivery(sent).token })
  );

  expect(response?.status).toBe(200);
});

// ---------------------------------------------------------------------------
// emailVerification
// ---------------------------------------------------------------------------

test('it should confirm an address and sign the user in', async () => {
  const { handlers, sent, userStore } = setup({
    modes: ['password', 'emailVerification'],
  });

  await handlers.signUp?.(
    request({ email: 'new@example.com', password: 'a-good-password' })
  );

  const delivery = lastDelivery(sent);

  expect(delivery.url).toBe(
    `${BASE_URL}/auth/verify-email?token=${delivery.token}`
  );

  const response = await handlers.verifyEmail?.(
    request({ token: delivery.token })
  );

  expect(response?.status).toBe(200);
  expect(response?.body).toMatchObject({ accessToken: 'token-for-user_1' });
  expect(await userStore.findByEmail('new@example.com')).toMatchObject({
    emailVerified: true,
  });
});

/**
 * Purpose is stored with the token so one flow's token cannot be spent on
 * another's endpoint.
 */
test('it should refuse a token minted for a different purpose', async () => {
  const { handlers, sent } = setup({
    modes: ['magicLink', 'emailVerification', 'passwordReset'],
    users: [{ email: 'user@example.com' }],
  });

  await handlers.sendMagicLink?.(request({ email: 'user@example.com' }));

  const { token } = lastDelivery(sent);

  expect(await handlers.verifyEmail?.(request({ token }))).toMatchObject({
    status: 401,
  });
  expect(
    await handlers.resetPassword?.(
      request({ token, password: 'a-good-password' })
    )
  ).toMatchObject({ status: 401 });
});

// ---------------------------------------------------------------------------
// passwordReset
// ---------------------------------------------------------------------------

test('it should reset a password and let the new one sign in', async () => {
  const { handlers, sent } = setup({
    modes: ['password', 'passwordReset'],
    users: [
      {
        email: 'user@example.com',
        passwordHash: await hashPassword('old-password'),
        emailVerified: true,
      },
    ],
  });

  await handlers.requestPasswordReset?.(request({ email: 'user@example.com' }));

  const delivery = lastDelivery(sent);

  expect(delivery.purpose).toBe('passwordReset');
  expect(delivery.url).toBe(
    `${BASE_URL}/auth/reset-password?token=${delivery.token}`
  );

  const reset = await handlers.resetPassword?.(
    request({ token: delivery.token, password: 'new-password' })
  );

  expect(reset?.status).toBe(200);
  expect(reset?.body).toMatchObject({ message: 'Password has been reset.' });

  expect(
    await handlers.signIn?.(
      request({ email: 'user@example.com', password: 'new-password' })
    )
  ).toMatchObject({ status: 200 });

  expect(
    await handlers.signIn?.(
      request({ email: 'user@example.com', password: 'old-password' })
    )
  ).toMatchObject({ status: 401 });
});

test('it should confirm the address when a reset completes', async () => {
  const { handlers, sent, userStore } = setup({
    modes: ['passwordReset'],
    users: [{ email: 'user@example.com', emailVerified: false }],
  });

  await handlers.requestPasswordReset?.(request({ email: 'user@example.com' }));
  await handlers.resetPassword?.(
    request({ token: lastDelivery(sent).token, password: 'new-password' })
  );

  expect(await userStore.findByEmail('user@example.com')).toMatchObject({
    emailVerified: true,
  });
});

test('it should acknowledge a reset request for an unknown address without sending mail', async () => {
  const { handlers, sent } = setup({
    modes: ['passwordReset'],
    users: [{ email: 'user@example.com' }],
  });

  const known = await handlers.requestPasswordReset?.(
    request({ email: 'user@example.com' })
  );
  const unknown = await handlers.requestPasswordReset?.(
    request({ email: 'nobody@example.com' })
  );

  expect(unknown).toEqual(known);
  expect(sent).toHaveLength(1);
});

test('it should reject a malformed address on a reset request', async () => {
  const { handlers } = setup({ modes: ['passwordReset'] });

  const response = await handlers.requestPasswordReset?.(
    request({ email: 'nope' })
  );

  expect(response?.status).toBe(400);
});

test('it should validate the new password before spending the reset token', async () => {
  const { handlers, sent } = setup({
    modes: ['passwordReset'],
    users: [{ email: 'user@example.com' }],
  });

  await handlers.requestPasswordReset?.(request({ email: 'user@example.com' }));

  const { token } = lastDelivery(sent);

  expect(
    await handlers.resetPassword?.(request({ token, password: 'short' }))
  ).toMatchObject({ status: 400 });

  expect(
    await handlers.resetPassword?.(request({ password: 'a-good-password' }))
  ).toMatchObject({ status: 400 });

  expect(await handlers.resetPassword?.(request({ token }))).toMatchObject({
    status: 400,
  });

  // The token survived both rejections, so the user can still finish.
  expect(
    await handlers.resetPassword?.(
      request({ token, password: 'a-good-password' })
    )
  ).toMatchObject({ status: 200 });
});

test('it should let a reset token be spent only once', async () => {
  const { handlers, sent } = setup({
    modes: ['passwordReset'],
    users: [{ email: 'user@example.com' }],
  });

  await handlers.requestPasswordReset?.(request({ email: 'user@example.com' }));

  const { token } = lastDelivery(sent);

  await handlers.resetPassword?.(
    request({ token, password: 'a-good-password' })
  );

  expect(
    await handlers.resetPassword?.(
      request({ token, password: 'another-password' })
    )
  ).toMatchObject({ status: 401 });
});

test('it should reject an expired reset token', async () => {
  const { handlers, sent } = setup({
    modes: ['passwordReset'],
    users: [{ email: 'user@example.com' }],
    ttl: { passwordReset: -1 },
  });

  await handlers.requestPasswordReset?.(request({ email: 'user@example.com' }));

  const response = await handlers.resetPassword?.(
    request({ token: lastDelivery(sent).token, password: 'a-good-password' })
  );

  expect(response?.body).toMatchObject({ error: { code: 'expired_token' } });
});

// ---------------------------------------------------------------------------
// hooks
// ---------------------------------------------------------------------------

test('it should call onUserCreated for both sign-up and code-created users', async () => {
  const created: string[] = [];

  const password = setup({
    modes: ['password'],
    hooks: {
      onUserCreated: (user) => {
        created.push(user.email);
      },
    },
  });

  await password.handlers.signUp?.(
    request({ email: 'signup@example.com', password: 'a-good-password' })
  );

  const code = setup({
    modes: ['emailCode'],
    hooks: {
      onUserCreated: (user) => {
        created.push(user.email);
      },
    },
  });

  await code.handlers.sendEmailCode?.(request({ email: 'code@example.com' }));
  await code.handlers.verifyEmailCode?.(
    request({ email: 'code@example.com', code: lastDelivery(code.sent).token })
  );

  expect(created).toEqual(['signup@example.com', 'code@example.com']);
});

test('it should fold enrichSession into every issued session', async () => {
  const { handlers } = setup({
    modes: ['password'],
    users: [
      {
        email: 'user@example.com',
        passwordHash: await hashPassword('a-good-password'),
      },
    ],
    hooks: {
      enrichSession: ({ session, user }) => {
        return { ...session, plan: 'free', email: user.email };
      },
    },
  });

  const response = await handlers.signIn?.(
    request({ email: 'user@example.com', password: 'a-good-password' })
  );

  expect(response?.body).toMatchObject({
    accessToken: 'token-for-user_1',
    plan: 'free',
    email: 'user@example.com',
  });
});

test('it should propagate a delivery failure rather than swallowing it', async () => {
  const { handlers } = setup({
    modes: ['magicLink'],
    users: [{ email: 'user@example.com' }],
    sendEmail: () => {
      throw new Error('SES is down');
    },
  });

  await expect(
    handlers.sendMagicLink?.(request({ email: 'user@example.com' }))
  ).rejects.toThrow('SES is down');
});
