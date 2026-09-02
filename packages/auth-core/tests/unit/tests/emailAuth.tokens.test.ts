/**
 * The token-delivery modes: magic links and emailed codes.
 */

import { createEmailAuthHandlers } from 'src/emailAuth';
import type { EmailAuthDelivery } from 'src/emailAuthTypes';
import {
  createMemoryOneTimeTokenStore,
  createMemoryUserStore,
} from 'src/memoryStores';

import { BASE_URL, lastDelivery, request, setup } from './emailAuthTestUtils';

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
