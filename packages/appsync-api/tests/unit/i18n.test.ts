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
  tooLong: {
    defaultMessage: 'Messages are limited to {limit, number} characters.',
    description: 'Message length refusal',
  },
  tooLongOverride: {
    defaultMessage: 'Shorten your question.',
    description: 'Resolver-specific refusal',
  },
});

// What a package that holds no copy throws: a code plus the data its message
// needs, with a message in its own words for whoever ignores references.
class CodedError extends Error {
  expected = true;

  code = 'MESSAGE_TOO_LONG';

  values = { limit: 4000 };

  messageRef?: unknown;

  constructor() {
    super('Mensagem longa demais');
    this.name = 'ValidationError';
  }
}

const resolveMessageRef = ({ error }: { error: { code: string } & any }) => {
  return error.code === 'MESSAGE_TOO_LONG'
    ? msg(messages.tooLong, { limit: error.values.limit })
    : undefined;
};

const catalog = createCatalog({
  supported: ['en', 'pt-BR'],
  fallback: 'en',
  load: (locale) => {
    return locale === 'pt-BR'
      ? {
          [messages.notActive.id!]: 'Sua assinatura não está ativa.',
          [messages.tooLong.id!]:
            'Mensagens têm limite de {limit, number} caracteres.',
        }
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

  test('resolves the reference of a thrown error that has only a code', async () => {
    const middleware = createAppSyncI18nMiddleware({
      catalog,
      resolveMessageRef,
      errorType: ({ name, code }) => {
        return `${name}[${code}]`;
      },
    });

    const error = await run(middleware, () => {
      throw new CodedError();
    }).catch((error_: unknown) => {
      return error_;
    });

    expect(error).toBeInstanceOf(CodedError);
    expect(error.expected).toBe(true);
    expect(error.name).toBe('ValidationError[MESSAGE_TOO_LONG]');
    expect(error.message).toBe('Mensagens têm limite de 4.000 caracteres.');
  });

  test('resolves a returned error, and passes the context and info along', async () => {
    const resolver = jest.fn(resolveMessageRef);
    const middleware = createAppSyncI18nMiddleware({
      catalog,
      resolveMessageRef: resolver,
    });
    const ctx = context('en');

    const result = await run(
      middleware,
      () => {
        return new CodedError();
      },
      ctx
    );

    expect(result.message).toBe('Messages are limited to 4,000 characters.');
    expect(resolver).toHaveBeenCalledWith({
      error: result,
      context: ctx,
      info,
    });
  });

  test('leaves an unmapped code with its own message', async () => {
    const middleware = createAppSyncI18nMiddleware({
      catalog,
      resolveMessageRef: () => {
        return undefined;
      },
    });

    const error = new CodedError();

    await expect(
      run(middleware, () => {
        throw error;
      })
    ).rejects.toBe(error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Mensagem longa demais');
    expect(error.messageRef).toBeUndefined();
  });

  test('never replaces a reference already attached', async () => {
    const resolver = jest.fn(resolveMessageRef);
    const middleware = createAppSyncI18nMiddleware({
      catalog,
      resolveMessageRef: resolver,
    });

    const error = await run(
      middleware,
      () => {
        const overridden = new CodedError();
        overridden.messageRef = msg(messages.tooLongOverride);
        throw overridden;
      },
      context('en')
    ).catch((error_: unknown) => {
      return error_;
    });

    expect(error.message).toBe('Shorten your question.');
    expect(resolver).not.toHaveBeenCalled();
  });

  test('passes the error through when resolving fails or answers no reference', async () => {
    for (const failing of [
      () => {
        throw new Error('copy registry bug');
      },
      () => {
        return { id: 'no default message' } as any;
      },
    ]) {
      const middleware = createAppSyncI18nMiddleware({
        catalog,
        resolveMessageRef: failing,
      });

      const error = new CodedError();

      await expect(
        run(middleware, () => {
          throw error;
        })
      ).rejects.toBe(error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Mensagem longa demais');
      expect(error.messageRef).toBeUndefined();
    }
  });

  test('does not resolve errors without a code, nor values that are not errors', async () => {
    const resolver = jest.fn(resolveMessageRef);
    const middleware = createAppSyncI18nMiddleware({
      catalog,
      resolveMessageRef: resolver,
    });
    const fault = new Error('boom');

    await expect(
      run(middleware, () => {
        throw fault;
      })
    ).rejects.toBe(fault);
    await expect(
      run(middleware, () => {
        throw { code: 'NOT_AN_ERROR' };
      })
    ).rejects.toEqual({ code: 'NOT_AN_ERROR' });
    expect(
      await run(middleware, () => {
        return fault;
      })
    ).toBe(fault);
    expect(resolver).not.toHaveBeenCalled();
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
