# @ttoss/test-utils

Testing utilities for [Jest](https://jestjs.io/) with React Testing Library, DOM matchers, and emotion support.

## Installation

```sh
pnpm add -D @ttoss/test-utils
```

This package includes `@testing-library/jest-dom` types automatically - other packages in your monorepo don't need to list it as a dependency.

## Quick Start

```tsx
import { render, screen, userEvent, renderHook } from '@ttoss/test-utils';

test('example component test', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  await user.click(screen.getByText('Increment'));

  expect(screen.getByText('1')).toBeInTheDocument();
});

test('example hook test', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);
});
```

## Features

This package includes:

- **React Testing Library**: All exports from [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) (`render`, `screen`, `act`, etc.)
- **User Event**: [`userEvent`](https://testing-library.com/docs/user-event/intro) for realistic user interactions
- **Hook Testing**: `renderHook` from [@testing-library/react](https://testing-library.com/docs/react-testing-library/api/#renderhook)
- **DOM Matchers**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) custom matchers (`toBeInTheDocument`, `toHaveStyle`, etc.)
- **Emotion Matchers**: [@emotion/jest](https://emotion.sh/docs/@emotion/jest) matchers for CSS-in-JS testing
- **jsdom Environment**: Built-in `jest-environment-jsdom` - no separate installation needed
- **Relay Mocking**: `createMockEnvironment` and `MockPayloadGenerator` from `@ttoss/test-utils/relay`
- **Fake Data**: `faker` from `@ttoss/test-utils/faker` for generating test data

## Global Test Configuration

Use `setOptions` to configure default render options for all tests:

```tsx title="jest.setup.ts"
import { setOptions } from '@ttoss/test-utils';
import AllProviders from './src/AllProviders';

setOptions({ wrapper: AllProviders });
```

This applies to both `render` and `renderHook` calls throughout your test suite.

## Additional Utilities

### Relay Testing

```tsx
import {
  createMockEnvironment,
  MockPayloadGenerator,
} from '@ttoss/test-utils/relay';

const environment = createMockEnvironment();
// Use for testing Relay components
```

### Fake Data Generation

```ts
import { faker } from '@ttoss/test-utils/faker';

const testUser = {
  name: faker.name.findName(),
  email: faker.internet.email(),
};
```
