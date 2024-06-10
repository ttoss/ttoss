# @ttoss/test-utils

This package provides re-exports utilities for testing using [Jest](https://jestjs.io/).

## Installing the Package

We suggest installing the package at the root of your project:

```sh
pnpm add -D @ttoss/test-utils
```

## Using the Package

### Matchers and Helpers

`@ttoss/test-utils` add the following matchers to Jest:

- [@testing-library/jest-dom](https://github.com/testing-library/jest-dom): [custom matchers](https://github.com/testing-library/jest-dom#custom-matchers) to test the state of the DOM.
- [@emotion/jest](https://emotion.sh/docs/testing): [custom matchers](https://emotion.sh/docs/@emotion/jest#custom-matchers) to make more explicit assertions when testing libraries that use [emotion](https://emotion.sh/docs/introduction).

If you use `jsdom`, you don't need to [install `jest-environment-jsdom`](https://jestjs.io/docs/upgrading-to-jest28#jsdom), because the library already includes it.

### React Testing Library

`@ttoss/test-utils` re-exports everything from [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/), like `act`, `screen`, and `render`.

If you want to set options to every test, you can use `setOptions` on Jest setup function. This way, all `render` calls will use the same default options, unless you override them.

```tsx title=jest.setup.ts
import { setOptions } from '@ttoss/test-utils';

import AllProviders from './paht/to/AllProviders';

/**
 * Add global wrapper to React Testing Library `customRender`.
 */
setOptions({ wrapper: AllProviders });
```

### User Interactions

`@ttoss/test-utils` re-exports `userEvent` from [user event](https://testing-library.com/docs/user-event/intro) library.

For example, you write your tests like this:

```tsx
import { render, screen, userEvent } from '@ttoss/test-utils';

import Component from './Component';

test('test with render', async () => {
  const user = userEvent.setup();

  render(<Component />);

  await user.click(screen.getByText('Increment'));

  expect(screen.getByText(1)).toBeInTheDocument();
});
```

### Testing Hooks

`@ttoss/test-utils` re-exports `renderHook` from [react-hooks-testing-library](https://react-hooks-testing-library.com/).

Example:

```tsx
import { renderHook } from '@ttoss/test-utils';
import useCounter from './useCounter';

test('should use counter', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);
  expect(typeof result.current.increment).toBe('function');
});
```

The `setOptions` also works for [`renderHook` options](https://react-hooks-testing-library.com/reference/api#renderhook-options).

### Relay

It re-exports `createMockEnvironment` and `MockPayloadGenerator` from [Relay test utils.](https://relay.dev/docs/guides/testing-relay-components/)

Example:

```tsx
import {
  createMockEnvironment,
  MockPayloadGenerator,
} from '@ttoss/test-utils/relay';

// ...
```

### Faker

It exports `faker` functions from [faker](https://fakerjs.dev/). Example:

```ts
import { faker } from '@ttoss/test-utils/faker';

const randomName = faker.name.findName();
const randomEmail = faker.internet.email();
const randomCard = faker.helpers.createCard();
```

### User Event

To render components it is recommended that you use a structure similar to the one below. If you need more information about this structure, you can consult this [link here.](https://testing-library.com/docs/user-event/setup)

```tsx
function setup(jsx: any) {
  return {
    user: userEvent.setup({
      // Use this key if you need to make async tests, like having clicks, write, paste, etc...
      // ref: https://testing-library.com/docs/user-event/options
      advanceTimers: () => Promise.resolve(),
    }),
    ...render(jsx),
  };
}

const onOpen = js.fn();

test('Testing something', async () => {
  const { user } = setup(<Example onOpen={onOpen} />);

  const buttonMenu = screen.getByLabelText('button-menu');
  await user.click(buttonMenu);

  expect(screen.getByLabelText('menu-container')).toBeTruthy();
});
```
