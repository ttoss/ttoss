/**
 * Email-auth configuration and the password mode. The link/code delivery modes
 * live in emailAuth.tokens.test.ts, and verification, reset, hooks and rate
 * limiting in emailAuth.flows.test.ts.
 */

import { normalizeEmail } from 'src/emailAuth';
import { hashPassword } from 'src/hash';
import { createMemoryOneTimeTokenStore } from 'src/memoryStores';

import { lastDelivery, request, setup } from './emailAuthTestUtils';

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
