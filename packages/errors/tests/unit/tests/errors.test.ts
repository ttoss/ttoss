import {
  createI18n,
  isLocalizedError,
  renderLocalizedError,
} from '@ttoss/i18n-core';

import {
  ExpectedError,
  isExpectedError,
  NotFoundError,
  ValidationError,
} from '../../../src';

describe('ExpectedError', () => {
  test('carries the marker, the message and its own class name', () => {
    const error = new ExpectedError('handled');

    expect(error).toBeInstanceOf(Error);
    expect(error.expected).toBe(true);
    expect(error.message).toBe('handled');
    expect(error.name).toBe('ExpectedError');
    expect(error.code).toBeUndefined();
    expect(error.messageRef).toBeUndefined();
    expect('cause' in error).toBe(false);
  });

  test('keeps code, messageRef and cause', () => {
    const cause = new Error('root');
    const messageRef = { id: 'abc', defaultMessage: 'Not allowed' };

    const error = new ExpectedError('not allowed', {
      code: 'NOT_ALLOWED',
      messageRef,
      cause,
    });

    expect(error.code).toBe('NOT_ALLOWED');
    expect(error.messageRef).toBe(messageRef);
    expect(error.cause).toBe(cause);
  });

  test.each([
    [ValidationError, 'ValidationError'],
    [NotFoundError, 'NotFoundError'],
  ])('%p reports its own name and is expected', (ErrorClass, name) => {
    const error = new ErrorClass('x');

    expect(error).toBeInstanceOf(ExpectedError);
    expect(error.name).toBe(name);
    expect(isExpectedError(error)).toBe(true);
  });
});

describe('extending', () => {
  test('a subclass is expected and named after itself', () => {
    class PaymentDeclinedError extends ExpectedError {}

    const error = new PaymentDeclinedError('declined', { code: 'DECLINED' });

    expect(error.name).toBe('PaymentDeclinedError');
    expect(error.code).toBe('DECLINED');
    expect(isExpectedError(error)).toBe(true);
  });

  test('a subclass can pin its name against minification', () => {
    class Mangled extends ExpectedError {
      override name = 'PaymentDeclinedError';
    }

    expect(new Mangled('declined').name).toBe('PaymentDeclinedError');
  });

  test('an error that sets the marker itself is expected without extending', () => {
    class ProviderError extends Error {
      expected?: true;

      constructor(args: { status: number }) {
        super(`provider answered ${args.status}`);
        if (args.status < 500) {
          this.expected = true;
        }
      }
    }

    expect(isExpectedError(new ProviderError({ status: 404 }))).toBe(true);
    expect(isExpectedError(new ProviderError({ status: 503 }))).toBe(false);
  });
});

describe('isExpectedError', () => {
  test('matches the marker, not the class identity', () => {
    // What a bundler's inlined copy of the class throws: same shape, a
    // different constructor.
    const fromOtherBundle = Object.assign(new Error('copy'), {
      expected: true,
    });

    expect(fromOtherBundle).not.toBeInstanceOf(ExpectedError);
    expect(isExpectedError(fromOtherBundle)).toBe(true);
  });

  test.each([
    ['a plain Error', new Error('fault')],
    [
      'a truthy non-true marker',
      Object.assign(new Error('x'), { expected: 1 }),
    ],
    ['a non-Error object with the marker', { expected: true }],
    ['null', null],
    ['a string', 'expected'],
  ])('rejects %s', (_label, value) => {
    expect(isExpectedError(value)).toBe(false);
  });
});

describe('with @ttoss/i18n-core', () => {
  test('an ExpectedError with code and messageRef is a LocalizedError by shape', () => {
    const error = new ValidationError('Name is required', {
      code: 'NAME_REQUIRED',
      messageRef: { id: 'name.required', defaultMessage: 'Name is required' },
    });

    expect(isLocalizedError(error)).toBe(true);

    const i18n = createI18n({
      locale: 'pt-BR',
      messages: { 'name.required': 'O nome é obrigatório' },
    });

    expect(renderLocalizedError({ error, i18n })).toMatchObject({
      code: 'NAME_REQUIRED',
      message: 'O nome é obrigatório',
    });
  });

  test('an ExpectedError without code is not localized', () => {
    expect(isLocalizedError(new NotFoundError('missing'))).toBe(false);
  });
});
