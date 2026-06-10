import { signJwt } from '@ttoss/auth-core';
import { App, Router } from '@ttoss/http-server';
import { requireAuth } from 'src/requireAuth';
import request from 'supertest';

const jwtSecret = 'require-auth-secret';
const systemSecret = 'system-secret';

const makeApp = () => {
  const app = new App();
  const router = new Router();

  router.get(
    '/me',
    requireAuth({ strategies: ['jwt'], jwt: { secret: jwtSecret } }),
    (ctx) => {
      ctx.body = { user: ctx.state.user, strategy: ctx.state.authStrategy };
    }
  );

  router.get(
    '/internal',
    requireAuth({
      strategies: ['system'],
      system: { secret: systemSecret, user: { id: 'system' } },
    }),
    (ctx) => {
      ctx.body = { user: ctx.state.user, strategy: ctx.state.authStrategy };
    }
  );

  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
};

test('requireAuth protects route — rejects unauthenticated', async () => {
  const app = makeApp();
  const res = await request(app.callback()).get('/me');
  expect(res.status).toBe(401);
});

test('requireAuth allows authenticated JWT request', async () => {
  const app = makeApp();
  const token = signJwt({ payload: { sub: 'user_1' }, secret: jwtSecret });
  const res = await request(app.callback())
    .get('/me')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.user.id).toBe('user_1');
  expect(res.body.strategy).toBe('jwt');
});

test('requireAuth allows system-token on /internal', async () => {
  const app = makeApp();
  const res = await request(app.callback())
    .get('/internal')
    .set('Authorization', `Bearer ${systemSecret}`);
  expect(res.status).toBe(200);
  expect(res.body.strategy).toBe('system');
});

test('requireAuth rejects wrong strategy on /internal', async () => {
  const app = makeApp();
  const token = signJwt({ payload: { sub: 'user_1' }, secret: jwtSecret });
  const res = await request(app.callback())
    .get('/internal')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(401);
});
