import {
  createMemoryOneTimeTokenStore,
  createMemoryUserStore,
  type EmailAuthDelivery,
  type EmailAuthMode,
} from '@ttoss/auth-core';
import { App, bodyParser } from '@ttoss/http-server';
import { emailAuth } from 'src/index';
import request from 'supertest';

const BASE_URL = 'https://app.example.com';

const createApp = (
  args: {
    modes?: EmailAuthMode[];
    prefix?: string;
  } = {}
) => {
  const { modes = ['emailCode'], prefix } = args;

  const sent: EmailAuthDelivery[] = [];

  const app = new App();
  app.use(bodyParser());
  app.use(
    emailAuth({
      modes,
      prefix,
      baseUrl: BASE_URL,
      userStore: createMemoryUserStore(),
      oneTimeTokenStore: createMemoryOneTimeTokenStore(),
      issueSession: (user) => {
        return { accessToken: `token-for-${user.id}` };
      },
      sendEmail: (delivery) => {
        sent.push(delivery);
      },
    }).routes()
  );

  return { app, sent };
};

test('it should sign a user in end to end with a mailed code', async () => {
  const { app, sent } = createApp({ modes: ['emailCode'] });

  const send = await request(app.callback())
    .post('/auth/code')
    .send({ email: 'user@example.com' });

  expect(send.status).toBe(200);
  expect(sent).toHaveLength(1);
  expect(sent[0].token).toMatch(/^\d{6}$/);

  const verify = await request(app.callback())
    .post('/auth/code/verify')
    .send({ email: 'user@example.com', code: sent[0].token });

  expect(verify.status).toBe(200);
  expect(verify.body).toMatchObject({ accessToken: 'token-for-user_1' });
});

test('it should sign a user up and in with a password end to end', async () => {
  const { app } = createApp({ modes: ['password'] });

  const signUp = await request(app.callback())
    .post('/auth/signup')
    .send({ email: 'user@example.com', password: 'a-good-password' });

  expect(signUp.status).toBe(201);

  const signIn = await request(app.callback())
    .post('/auth/login')
    .send({ email: 'user@example.com', password: 'a-good-password' });

  expect(signIn.status).toBe(200);
  expect(signIn.body).toMatchObject({ accessToken: 'token-for-user_1' });
});

test('it should redeem a magic link end to end', async () => {
  const { app, sent } = createApp({ modes: ['password', 'magicLink'] });

  await request(app.callback())
    .post('/auth/signup')
    .send({ email: 'user@example.com', password: 'a-good-password' });

  await request(app.callback())
    .post('/auth/magic-link')
    .send({ email: 'user@example.com' });

  expect(sent[0].url).toBe(`${BASE_URL}/auth/callback?token=${sent[0].token}`);

  const verify = await request(app.callback())
    .post('/auth/magic-link/verify')
    .send({ token: sent[0].token });

  expect(verify.status).toBe(200);
  expect(verify.body).toMatchObject({ accessToken: 'token-for-user_1' });
});

test('it should surface an engine error as its status and body', async () => {
  const { app } = createApp({ modes: ['password'] });

  const response = await request(app.callback())
    .post('/auth/login')
    .send({ email: 'nobody@example.com', password: 'a-good-password' });

  expect(response.status).toBe(401);
  expect(response.body).toMatchObject({
    error: { code: 'invalid_credentials' },
  });
});

test('it should read a token from the query string', async () => {
  const { app, sent } = createApp({ modes: ['password', 'magicLink'] });

  await request(app.callback())
    .post('/auth/signup')
    .send({ email: 'user@example.com', password: 'a-good-password' });

  await request(app.callback())
    .post('/auth/magic-link')
    .send({ email: 'user@example.com' });

  const verify = await request(app.callback()).post(
    `/auth/magic-link/verify?token=${sent[0].token}`
  );

  expect(verify.status).toBe(200);
});

test('it should not mount routes for disabled modes', async () => {
  const { app } = createApp({ modes: ['emailCode'] });

  const response = await request(app.callback())
    .post('/auth/login')
    .send({ email: 'user@example.com', password: 'a-good-password' });

  expect(response.status).toBe(404);
});

test('it should apply the prefix to every mounted path', async () => {
  const { app } = createApp({ modes: ['emailCode'], prefix: '/v1' });

  expect(
    (
      await request(app.callback())
        .post('/v1/auth/code')
        .send({ email: 'user@example.com' })
    ).status
  ).toBe(200);

  expect(
    (
      await request(app.callback())
        .post('/auth/code')
        .send({ email: 'user@example.com' })
    ).status
  ).toBe(404);
});

test('it should tolerate a request with no body', async () => {
  const { app } = createApp({ modes: ['emailCode'] });

  const response = await request(app.callback()).post('/auth/code');

  expect(response.status).toBe(400);
  expect(response.body).toMatchObject({ error: { code: 'invalid_request' } });
});
