# @ttoss/test-utils

Testing utilities for Jest with React Testing Library, user events, Relay helpers, faker, and optional ESM transform helpers.

## Installation

```bash
pnpm add -D @ttoss/test-utils
```

## Entry Points

| Import                    | What it gives you                                                                                                      | Side effects                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `@ttoss/test-utils/react` | `render`, `renderHook`, `userEvent`, emotion matchers, jest-dom matchers, ResizeObserver polyfill, snapshot serializer | Yes (extends `expect`, polyfills) |
| `@ttoss/test-utils/faker` | `faker` ESM re-export                                                                                                  | No                                |
| `@ttoss/test-utils/relay` | Relay test utilities                                                                                                   | No                                |
| `@ttoss/test-utils`       | Utility: `getTransformIgnorePatterns` (ESM Jest helper)                                                                | No                                |

Future: a lean version without side effects can be added as a distinct entry (e.g. `react-core`)—current `react` entry already includes the jsdom-oriented setup.

## Quick Start

```tsx
import { render, screen, userEvent, renderHook } from '@ttoss/test-utils/react';

test('component', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  await user.click(screen.getByText('Increment'));
  expect(screen.getByText('1')).toBeInTheDocument();
});

test('hook', () => {
  const { result } = renderHook(() => useCounter());
  expect(result.current.count).toBe(0);
});
```

## Global Wrapper

```tsx title="jest.setup.ts"
import { setOptions } from '@ttoss/test-utils/react';
import AllProviders from './src/AllProviders';

setOptions({ wrapper: AllProviders });
```

```ts title="jest.config.ts"
export default {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
};
```

## Relay Testing

```tsx
import {
  createMockEnvironment,
  MockPayloadGenerator,
} from '@ttoss/test-utils/relay';

const environment = createMockEnvironment();
```

More patterns: [Testing Relay Components](https://relay.dev/docs/guides/testing-relay-components/)

## Fake Data

```ts
import { faker } from '@ttoss/test-utils/faker';

const testUser = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
};
```

## ESM Transform Helper (Jest)

Use `getTransformIgnorePatterns` to ensure ESM packages like `@faker-js/faker` are transformed under pnpm layout:

```ts title="jest.config.ts"
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const transformIgnorePatterns = getTransformIgnorePatterns({
  esmModules: ['@faker-js/faker'],
});

export default {
  testEnvironment: 'jsdom',
  transformIgnorePatterns,
};
```

If you see `SyntaxError: Cannot use import statement outside a module`, add the module name to `esmModules`.

## Features Summary

- React Testing Library (`render`, `renderHook`, queries)
- User events (`userEvent`)
- jest-dom matchers
- Emotion matchers + snapshot serializer
- ResizeObserver polyfill
- Relay test utilities
- Faker ESM helper
- PNPM-aware ESM transform pattern generator

## FAQ

Q: Why is `getTransformIgnorePatterns` separate?  
A: It’s a pure configuration helper without runtime side effects; keeping it in the root avoids pulling in DOM matchers unnecessarily.

Q: Do I need to import jest-dom manually?  
A: Not when using `@ttoss/test-utils/react` (it auto-registers).

Q: How do I add another ESM library?  
A: Include it in `esmModules`: `getTransformIgnorePatterns({ esmModules: ['@faker-js/faker','some-lib'] })`.

## Minimal Config Only (No side effects)

If you ever need a lean setup (no global matchers), you can create your own thin adapter by importing directly from `@testing-library/react` and `@testing-library/user-event`. Current package focuses on convenience defaults.
