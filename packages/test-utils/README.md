# @ttoss/test-utils

This package provides re-exports utilities for testing using [Jest](https://jestjs.io/).

## Installing the Package

We suggest installing the package at the root of your project:

```sh
yarn add -DW @ttoss/test-utils
```

## How to Configure Your Project

You configure your project following the instructions in the [Jest](https://jestjs.io/) documentation. Add Jest to the root to your project:

```sh
yarn add -DW jest
```

If you're working with TypeScript, you'll also need to configure Babel to handle the transpilation of the ES6 code, TypeScript, and JSX.

```sh
yarn add --DW @ttoss/config
```

Add `babel.config.js` (`touch babel.config.js`) on the package folder:

```js title="babel.config.js"
const { babelConfig } = require("@ttoss/config");

module.exports = babelConfig();
```

You can read more about [`@ttoss/config` here](/docs/core/config#babel).

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
import { setOptions } from "@ttoss/test-utils";

import AllProviders from "./paht/to/AllProviders";

/**
 * Add global wrapper to React Testing Library `customRender`.
 */
setOptions({ wrapper: AllProviders });
```

### User Interactions

`@ttoss/test-utils` re-exports `userEvent` from [user event](https://testing-library.com/docs/user-event/intro) library.

For example, you write your tests like this:

```tsx
import { render, screen, userEvent } from "@ttoss/test-utils";

import Component from "./Component";

test("test with render", async () => {
  const user = await userEvent.setup();

  render(<Component />);

  await user.click(screen.getByText("Increment"));

  expect(screen.getByText(1)).toBeInTheDocument();
});
```

### Testing Hooks

`@ttoss/test-utils` re-exports `renderHook` from [react-hooks-testing-library](https://react-hooks-testing-library.com/).

Example:

```tsx
import { renderHook } from "@ttoss/test-utils";
import useCounter from "./useCounter";

test("should use counter", () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);
  expect(typeof result.current.increment).toBe("function");
});
```

The `setOptions` also works for [`renderHook` options](https://react-hooks-testing-library.com/reference/api#renderhook-options).

### Storybook

You can use your Storybook stories in your unit tests or create Storyshoots testing.

#### Storybook Stories

You can reuse the Storybook stories that you've already created in your unit tests. To do so, this packages uses the package [@storybook/testing-react](https://github.com/storybookjs/testing-react), that you can use this way:

```tsx
import { render, screen, userEvent } from "@ttoss/test-utils";
import { composeStories } from "@ttoss/test-utils/storybook";

import * as stories from "./my.stories";

const { Example } = composeStories(stories);

test("check if Storybook Example story is working", async () => {
  const user = userEvent.setup();

  render(<Example />);

  expect(screen.getByText("oi")).toBeInTheDocument();
  expect(screen.getByText(0)).toBeInTheDocument();
  expect(screen.getByText("Increment")).toBeInTheDocument();
  expect(screen.getByText("StorybookDecorator")).toBeInTheDocument();
  expect(screen.getByText("JestSetupProvider")).toBeInTheDocument();

  await user.click(screen.getByText("Increment"));

  expect(screen.getByText(1)).toBeInTheDocument();
});
```

If your Storybook configuration has global decorators/parameters/etc and you want to use them in your tests, you can use the `setGlobalConfig` function to pass them to your stories. In your `jest.setup.ts` file, you can use the `setGlobalConfig` this way:

```tsx title=jest.setup.ts
import { setGlobalConfig } from "@ttoss/test-utils/storybook";

/**
 * Add global config to Storybook.
 * https://storybook.js.org/addons/@storybook/testing-react
 */
import * as globalStorybookConfig from "./.storybook/preview";

setGlobalConfig(globalStorybookConfig);
```

#### Storyshoots

... TODO

### Relay

It re-exports `createMockEnvironment` and `MockPayloadGenerator` from [Relay test utils.](https://relay.dev/docs/guides/testing-relay-components/)

Example:

```tsx
import {
  createMockEnvironment,
  MockPayloadGenerator,
} from "@ttoss/test-utils/relay";

// ...
```

### Faker

It exports `faker` functions from [faker](https://fakerjs.dev/). Example:

```ts
import { faker } from "@ttoss/test-utils/faker";

const randomName = faker.name.findName();
const randomEmail = faker.internet.email();
const randomCard = faker.helpers.createCard();
```
