# @ttoss/errors

A zero-dependency contract for **expected errors**: outcomes an operation anticipates and handles — invalid input, a missing resource, a degraded state already dealt with. They still reach the caller, so the message is shown, but they are not faults, so an error tracker should not open an issue for them. Bugs, infrastructure failures and unexpected third-party errors stay a plain `Error`.

## Installation

```bash
pnpm add @ttoss/errors
```

## Usage

Throw an expected error where the condition is detected:

```ts
import { NotFoundError, ValidationError } from '@ttoss/errors';

if (!input.name) {
  throw new ValidationError('name is required');
}

if (!project || project.ownerId !== userId) {
  // Same error for "missing" and "not yours", so a response never reveals
  // that a resource the caller cannot see exists.
  throw new NotFoundError('project not found');
}
```

Filter it once, at the reporting boundary:

```ts
import { isExpectedError } from '@ttoss/errors';

try {
  await handler(event);
} catch (error) {
  if (!isExpectedError(error)) {
    reportToErrorTracking(error);
  }
  throw error;
}
```

`isExpectedError` matches the `expected: true` marker, not the class, so it holds when a bundler inlines its own copy of this package.

## Extending

Subclass `ExpectedError` for your own kinds. `name` defaults to the subclass name:

```ts
import { ExpectedError } from '@ttoss/errors';

class PaymentDeclinedError extends ExpectedError {}

throw new PaymentDeclinedError('card declined', { code: 'PAYMENT_DECLINED' });
```

Narrow `code` to the values your error can carry with the type parameter:

```ts
class CardError extends ExpectedError<'CARD_DECLINED' | 'CARD_EXPIRED'> {}

new CardError('declined', { code: 'CARD_DECLINED' }).code; // 'CARD_DECLINED' | 'CARD_EXPIRED'
```

A minifier that renames classes renames `name` too. When something downstream matches on it (an error type a client branches on), pin it:

```ts
class PaymentDeclinedError extends ExpectedError {
  override name = 'PaymentDeclinedError';
}
```

An error that is expected only in some cases does not need to extend anything. Set the marker on the instance and `isExpectedError` recognizes it:

```ts
class ProviderError extends Error {
  expected?: true;

  constructor(status: number) {
    super(`provider answered ${status}`);
    if (status < 500) {
      this.expected = true;
    }
  }
}
```

## Localized messages

Pass a `code` and a `messageRef` and the error is also a localized error by shape, so the [`@ttoss/i18n-core`](https://www.npmjs.com/package/@ttoss/i18n-core) boundaries in `@ttoss/http-server` and `@ttoss/appsync-api` render it in the request locale:

```ts
throw new ValidationError('plan limit reached', {
  code: 'PLAN_LIMIT',
  messageRef: msg(messages.planLimit),
});
```

The two ideas are independent: "localized" decides how the message is shown, "expected" decides whether it is reported.
