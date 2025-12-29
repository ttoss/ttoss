---
title: Tests
---

This document outlines the guidelines for writing tests.

## Runners

We use [Jest](https://jestjs.io/) as our test runner and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) for testing React components.

## Categories

We divide our tests into two categories: unit tests and e2e tests. Unit tests are for testing individual functions, and e2e tests are for testing the entire application.

We write unit tests in the `tests/unit/tests` folder and e2e tests in the `tests/e2e/tests` folder, both ending with the `.test.ts` or `.test.tsx` extension.

## File Structure

The inital file structure for tests in your package should be as follows:

```
tests/
  e2e/
    tests/
      myFunction.test.ts
    babel.config.cjs
    jest.config.ts
  unit/
    tests/
      myOtherFunction.test.ts
    babel.config.cjs
    jest.config.ts
  tsconfig.json
jest.config.ts
```

## Configuration

1. Follow the installation instructions from [@ttoss/config](/docs/modules/packages/config/#jest) to set up Jest.

1. Define the configuration for Jest in the `jest.config.ts` file at the root of the package. This configuration set up Jest [projects](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig).

   ```ts
   import { jestRootConfig } from '@ttoss/config';

   export default jestRootConfig();
   ```

1. For unit tests, create a `jest.config.ts` file in the `tests/unit` folder.

   ```ts
   import { jestUnitConfig } from '@ttoss/config';

   export default jestUnitConfig();
   ```

1. Create a `tsconfig.json` file at `tests/tsconfig.json` with the following content:

   ```json
   {
     "extends": "@ttoss/config/tsconfig.test.json",
     "compilerOptions": {
       "paths": {
         "src/*": ["../src/*"],
         "tests/*": ["./*"]
       }
     }
   }
   ```

   This way, you can import files from the `src` folder in your tests. For example:

   ```ts
   import { myFunction } from 'src/myFunction';
   ```

1. For e2e tests, create a `jest.config.ts` file in the `tests/e2e` folder.

   ```ts
   import { jestE2EConfig } from '@ttoss/config';

   export default jestE2EConfig();
   ```

1. Create a Babel configuration file in each test folder: `tests/unit/babel.config.cjs` and `tests/e2e/babel.config.cjs`. Jest needs Babel to transpile the code before running the tests.

   ```js
   const { babelConfig } = require('@ttoss/config');

   const config = babelConfig({});

   module.exports = config;
   ```

1. Add the following scripts to the `package.json` file:

   ```json
   {
     "scripts": {
       "e2e": "jest --projects tests/e2e",
       "test": "jest --projects tests/unit"
     }
   }
   ```

1. Finnaly, write your tests in the `tests/unit/tests` and `tests/e2e/tests` folders.

1. Run the unit tests with the following command:

   ```shell
   pnpm test
   ```

   Or run only the e2e tests with:

   ```shell
   pnpm e2e
   ```

## Test Coverage Requirements

### Minimum Coverage Baseline

All packages must maintain **minimum 10% test coverage** as a baseline requirement. This ensures basic testing discipline while remaining achievable for all team members.

### Coverage Improvement Strategy

- **Package-specific goals**: Each package can set higher coverage targets based on complexity and criticality
- **Incremental improvement**: Increase coverage gradually when the team has capacity
- **Flexible timeline**: No rigid schedule—improve when sustainable for the team
- **Focus on critical paths**: Prioritize testing of core functionality and user flows

### Coverage Tracking

Monitor coverage using Jest's built-in coverage reporting:

```bash
# Generate coverage report
pnpm test -- --coverage

# Set coverage thresholds in jest.config.ts
export default {
  coverageThreshold: {
    global: {
      lines: 10,
      functions: 10,
      branches: 10,
      statements: 10,
    },
  },
};
```

### Integration with Pull Requests

- **Baseline maintenance**: PRs should not decrease overall package coverage below 10%
- **New feature testing**: New features should include appropriate test coverage
- **Coverage reporting**: Use coverage reports to guide testing priorities
