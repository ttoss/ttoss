/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createCatalog,
  defineMessages,
  LocalizedError,
  msg,
} from '@ttoss/i18n-core';

import { createAppSyncI18nMiddleware, getRequestLocale } from '../../src';

const messages = defineMessages({
  notActive: {
    defaultMessage: 'Your subscription is not active.',
    description: 'Gate refusal',
  },
});

const catalog = createCatalog({
  supported: ['en', 'pt-BR'],
  fallback: 'en',
  load: (locale) => {
    return locale === 'pt-BR'
      ? { [messages.notActive.id!]: 'Sua assinatura não está ativa.' }
      : {};
  },
});

const info = { fieldName: 'createOptimization', parentTypeName: 'Mutation' };

const context = (acceptLanguage?: string) => {
  return {
    request: {
      headers: acceptLanguage ? { 'Accept-Language': acceptLanguage } : {},
    },
  };
};

class ExpectedGraphQLError extends LocalizedError {
  expected = true;

  constructor() {
    super({
      code: 'SUBSCRIPTION_NOT_ACTIVE',
      message: msg(messages.notActive),
    });
    this.name = 'ExpectedGraphQLError';
  }
}

const run = (
  middleware: ReturnType<typeof createAppSyncI18nMiddleware>,
  resolve: () => unknown,
  ctx = context('pt-BR,pt;q=0.9')
) => {
  return (middleware as any)(resolve, {}, {}, ctx, info);
};

describe('getRequestLocale', () => {
  test('reads Accept-Language case-insensitively', () => {
    expect(getRequestLocale(context('pt-BR'))).toBe('pt-BR');
    expect(
      getRequestLocale({ request: { headers: { 'accept-language': 'es' } } })
    ).toBe('es');
    expect(getRequestLocale(context())).toBeUndefined();
    expect(getRequestLocale({ request: null })).toBeUndefined();
  });
});

describe('createAppSyncI18nMiddleware', () => {
  test('renders a thrown LocalizedError in the request locale, code as errorType', async () => {
    const middleware = createAppSyncI18nMiddleware({ catalog });

    const error = await run(middleware, () => {
      throw new ExpectedGraphQLError();
    }).catch((error_: unknown) => {
      return error_;
    });

    expect(error).toBeInstanceOf(ExpectedGraphQLError);
    expect(error.name).toBe('SUBSCRIPTION_NOT_ACTIVE');
    expect(error.message).toBe('Sua assinatura não está ativa.');
    expect(error.expected).toBe(true);
  });

  test('errorType can keep the class visible', async () => {
    const middleware = createAppSyncI18nMiddleware({
      catalog,
      errorType: ({ name, code }) => {
        return `${name}[${code}]`;
      },
    });

    await expect(
      run(
        middleware,
        () => {
          throw new ExpectedGraphQLError();
        },
        context()
      )
    ).rejects.toMatchObject({
      name: 'ExpectedGraphQLError[SUBSCRIPTION_NOT_ACTIVE]',
      message: 'Your subscription is not active.',
    });
  });

  test('renders a returned LocalizedError, which the handler rethrows', async () => {
    const middleware = createAppSyncI18nMiddleware({
      catalog,
      getLocale: () => {
        return 'pt-BR';
      },
    });

    const result = await run(
      middleware,
      () => {
        return new ExpectedGraphQLError();
      },
      context('en')
    );

    expect(result).toBeInstanceOf(ExpectedGraphQLError);
    expect(result.message).toBe('Sua assinatura não está ativa.');
  });

  test('leaves other errors and results untouched', async () => {
    const middleware = createAppSyncI18nMiddleware({ catalog });
    const fault = new Error('boom');

    await expect(
      run(middleware, () => {
        throw fault;
      })
    ).rejects.toBe(fault);
    expect(fault.name).toBe('Error');
    expect(
      await run(middleware, () => {
        return { id: '1' };
      })
    ).toEqual({ id: '1' });
  });

  test('rethrows the unrendered error when the catalog fails', async () => {
    const middleware = createAppSyncI18nMiddleware({
      catalog: {
        getI18n: () => {
          return Promise.reject(new Error('S3 down'));
        },
      },
    });

    await expect(
      run(middleware, () => {
        throw new ExpectedGraphQLError();
      })
    ).rejects.toMatchObject({
      name: 'ExpectedGraphQLError',
      message: 'Your subscription is not active.',
    });
  });
});
