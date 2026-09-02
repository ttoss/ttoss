/**
 * Email verification, password reset, the lifecycle hooks and request rate
 * limiting.
 */

import type { EmailAuthOptions } from 'src/emailAuthTypes';
import { hashPassword } from 'src/hash';
import { createMemoryRequestRateLimitStore } from 'src/memoryStores';

import { BASE_URL, lastDelivery, request, setup } from './emailAuthTestUtils';

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

// ---------------------------------------------------------------------------
// request rate limiting
// ---------------------------------------------------------------------------

describe('request rate limiting', () => {
  const limited = (overrides: Partial<EmailAuthOptions> = {}) => {
    return setup({
      modes: ['emailCode'],
      requestRateLimit: {
        store: createMemoryRequestRateLimitStore(),
        cooldownSeconds: 60,
        maxPerWindow: 3,
      },
      ...overrides,
    });
  };

  test('it should refuse a second request inside the cooldown', async () => {
    const { handlers, sent } = limited();

    const first = await handlers.sendEmailCode?.(
      request({ email: 'user@example.com' })
    );
    const second = await handlers.sendEmailCode?.(
      request({ email: 'user@example.com' })
    );

    expect(first?.status).toBe(200);
    expect(second?.status).toBe(429);
    expect(second?.body).toMatchObject({
      error: { code: 'too_many_requests' },
    });
    // The refused request must not have sent anything.
    expect(sent).toHaveLength(1);
  });

  test('it should limit each address independently', async () => {
    const { handlers, sent } = limited();

    await handlers.sendEmailCode?.(request({ email: 'one@example.com' }));
    const other = await handlers.sendEmailCode?.(
      request({ email: 'two@example.com' })
    );

    expect(other?.status).toBe(200);
    expect(sent).toHaveLength(2);
  });

  test('it should allow another request once the cooldown has passed', async () => {
    const { handlers } = limited({
      requestRateLimit: {
        store: createMemoryRequestRateLimitStore(),
        cooldownSeconds: 0,
        maxPerWindow: 3,
      },
    });

    expect(
      await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
    ).toMatchObject({ status: 200 });
    expect(
      await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
    ).toMatchObject({ status: 200 });
  });

  test('it should enforce the window ceiling even with no cooldown', async () => {
    const { handlers, sent } = limited({
      requestRateLimit: {
        store: createMemoryRequestRateLimitStore(),
        cooldownSeconds: 0,
        maxPerWindow: 3,
      },
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(
        await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
      ).toMatchObject({ status: 200 });
    }

    expect(
      await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
    ).toMatchObject({ status: 429 });
    expect(sent).toHaveLength(3);
  });

  test('it should drop requests that fall outside the window', async () => {
    const store = createMemoryRequestRateLimitStore();

    await store.record({
      email: 'user@example.com',
      purpose: 'emailCode',
      // Older than the window below, so it must not count.
      requestedAt: new Date(Date.now() - 10_000),
    });

    const { handlers } = setup({
      modes: ['emailCode'],
      requestRateLimit: {
        store,
        cooldownSeconds: 0,
        maxPerWindow: 1,
        windowSeconds: 1,
      },
    });

    expect(
      await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
    ).toMatchObject({ status: 200 });
  });

  /**
   * The whole point of counting requests rather than sends: an unknown address
   * and a registered one must be rate-limited identically, or `429` becomes an
   * account-existence oracle.
   */
  test('it should limit an unknown address exactly like a registered one', async () => {
    const { handlers } = setup({
      modes: ['magicLink'],
      users: [{ email: 'known@example.com' }],
      requestRateLimit: {
        store: createMemoryRequestRateLimitStore(),
        cooldownSeconds: 60,
        maxPerWindow: 3,
      },
    });

    const knownFirst = await handlers.sendMagicLink?.(
      request({ email: 'known@example.com' })
    );
    const knownSecond = await handlers.sendMagicLink?.(
      request({ email: 'known@example.com' })
    );
    const unknownFirst = await handlers.sendMagicLink?.(
      request({ email: 'nobody@example.com' })
    );
    const unknownSecond = await handlers.sendMagicLink?.(
      request({ email: 'nobody@example.com' })
    );

    expect(knownFirst).toEqual(unknownFirst);
    expect(knownSecond).toEqual(unknownSecond);
    expect(knownSecond?.status).toBe(429);
  });

  test('it should apply sensible defaults when only a store is given', async () => {
    const { handlers, sent } = setup({
      modes: ['emailCode'],
      requestRateLimit: { store: createMemoryRequestRateLimitStore() },
    });

    expect(
      await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
    ).toMatchObject({ status: 200 });
    // The default cooldown is a minute, so an immediate retry is refused.
    expect(
      await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
    ).toMatchObject({ status: 429 });
    expect(sent).toHaveLength(1);
  });

  test('it should not limit anything when no limiter is configured', async () => {
    const { handlers, sent } = setup({ modes: ['emailCode'] });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(
        await handlers.sendEmailCode?.(request({ email: 'user@example.com' }))
      ).toMatchObject({ status: 200 });
    }

    expect(sent).toHaveLength(4);
  });
});
