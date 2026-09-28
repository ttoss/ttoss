import {
  createCatalog,
  defineMessages,
  LocalizedError,
  msg,
} from '@ttoss/i18n-core';
import { App, i18nMiddleware, type I18nState, Router } from 'src/index';
import request from 'supertest';

const messages = defineMessages({
  quota: {
    defaultMessage: 'You reached your plan limit.',
    description: 'Quota refusal',
  },
  greeting: {
    defaultMessage: 'Hello',
    description: 'Greeting',
  },
});

const catalog = createCatalog({
  supported: ['en', 'pt-BR'],
  fallback: 'en',
  load: (locale) => {
    return locale === 'pt-BR'
      ? {
          [messages.quota.id!]: 'Você atingiu o limite do plano.',
          [messages.greeting.id!]: 'Olá',
        }
      : {};
  },
});

const quotaError = (extra: Record<string, unknown> = {}) => {
  return Object.assign(
    new LocalizedError({ code: 'PLAN_LIMIT', message: msg(messages.quota) }),
    extra
  );
};

const buildApp = ({
  getUserLocale,
  thrown,
}: {
  getUserLocale?: Parameters<typeof i18nMiddleware>[0]['getUserLocale'];
  thrown?: () => unknown;
}) => {
  const app = new App();
  const caught: unknown[] = [];

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      caught.push(error);
      ctx.status = 500;
      ctx.body = { error: (error as Error).message };
    }
  });
  app.use(i18nMiddleware({ catalog, getUserLocale }));

  const router = new Router();
  router.get('/', (ctx) => {
    if (thrown) {
      throw thrown();
    }
    const { locale, i18n } = ctx.state as I18nState;
    ctx.body = { locale, text: i18n.render(msg(messages.greeting)) };
  });
  app.use(router.routes());

  return { app, caught };
};

test('negotiates Accept-Language and exposes the i18n on ctx.state', async () => {
  const { app } = buildApp({});

  const response = await request(app.callback())
    .get('/')
    .set('Accept-Language', 'pt-PT,pt;q=0.9');

  expect(response.body).toEqual({ locale: 'pt-BR', text: 'Olá' });
});

test('a stored user preference wins over Accept-Language', async () => {
  const { app } = buildApp({
    getUserLocale: () => {
      return 'en';
    },
  });

  const response = await request(app.callback())
    .get('/')
    .set('Accept-Language', 'pt-BR');

  expect(response.body).toEqual({ locale: 'en', text: 'Hello' });
});

test('falls back when nothing is requested', async () => {
  const { app } = buildApp({
    getUserLocale: async () => {
      return null;
    },
  });

  const response = await request(app.callback()).get('/');

  expect(response.body.locale).toBe('en');
});

test('renders an expected LocalizedError as { error: { code, message } } with 400', async () => {
  const { app, caught } = buildApp({
    thrown: () => {
      return quotaError({ expected: true });
    },
  });

  const response = await request(app.callback())
    .get('/')
    .set('Accept-Language', 'pt-BR');

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: { code: 'PLAN_LIMIT', message: 'Você atingiu o limite do plano.' },
  });
  expect(caught).toHaveLength(0);
});

test('keeps a 4xx status the error carries', async () => {
  const { app } = buildApp({
    thrown: () => {
      return quotaError({ status: 402 });
    },
  });

  const response = await request(app.callback()).get('/');

  expect(response.status).toBe(402);
  expect(response.body.error.message).toBe('You reached your plan limit.');
});

test('renders a faulting LocalizedError in place and rethrows it', async () => {
  const { app, caught } = buildApp({
    thrown: () => {
      return quotaError({ statusCode: 503 });
    },
  });

  const response = await request(app.callback())
    .get('/')
    .set('Accept-Language', 'pt-BR');

  expect(response.status).toBe(500);
  expect(caught).toHaveLength(1);
  expect((caught[0] as Error).message).toBe('Você atingiu o limite do plano.');
});

test('rethrows other errors untouched', async () => {
  const fault = new Error('boom');
  const { app, caught } = buildApp({
    thrown: () => {
      return fault;
    },
  });

  await request(app.callback()).get('/');

  expect(caught).toEqual([fault]);
  expect(fault.message).toBe('boom');
});
