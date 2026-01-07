---
title: Tests
---

This document outlines the guidelines for writing tests in ttoss packages.

## Quick Setup

For a fast automated setup, use the `@ttoss/monorepo` CLI tool to scaffold the complete test structure:

```bash
# Setup unit tests only (recommended for most packages)
npx @ttoss/monorepo setup-tests path/to/package

# Setup unit tests in current directory
npx @ttoss/monorepo setup-tests

# Setup both unit and e2e tests
npx @ttoss/monorepo setup-tests path/to/package --e2e
```

This command creates the directory structure, configuration files, installs required dependencies (`jest` and `@ttoss/config`), and adds test scripts to your `package.json`.

**After setup, verify everything is working:**

```bash
pnpm test
```

You should see a sample test pass. The setup creates a `setup.test.ts` file in `tests/unit/tests/` that you can delete once you start writing your own tests.

For manual setup or to understand the structure, continue reading the sections below.

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

## Manual Configuration

If you prefer to set up tests manually or need to customize the automated setup, follow these steps:

### Installation

First, install the required dependencies:

```bash
pnpm add -D jest @ttoss/config
```

For more details, see [@ttoss/config installation instructions](/docs/modules/packages/config/#jest).

### Configuration Files

1. Define the root Jest configuration in `jest.config.ts` at the package root. This sets up Jest [projects](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig):

   ```ts
   import { jestRootConfig } from '@ttoss/config';

   export default jestRootConfig({
     coverageThreshold: {
       global: {
         lines: 50,
         functions: 50,
         branches: 50,
         statements: 50,
       },
     },
   });
   ```

2. Create a `jest.config.ts` file in `tests/unit/` for unit tests:

   ```ts
   import { jestUnitConfig } from '@ttoss/config';

   export default jestUnitConfig();
   ```

3. Create `tests/tsconfig.json` to enable TypeScript path aliases:

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

4. (Optional) For e2e tests, create `tests/e2e/jest.config.ts`:

   ```ts
   import { jestE2EConfig } from '@ttoss/config';

   export default jestE2EConfig();
   ```

5. Create Babel configuration files for Jest transpilation. Add `tests/unit/babel.config.cjs` (and `tests/e2e/babel.config.cjs` if using e2e tests):

   ```js
   const { babelConfig } = require('@ttoss/config');

   const config = babelConfig({});

   module.exports = config;
   ```

6. Add test scripts to `package.json`:

   ```json
   {
     "scripts": {
       "test": "jest --projects tests/unit",
       "e2e": "jest --projects tests/e2e"
     }
   }
   ```

### Running Tests

After setup, write your tests in `tests/unit/tests/` (and `tests/e2e/tests/` for e2e tests) with `.test.ts` or `.test.tsx` extensions.

Run unit tests:

```shell
pnpm test
```

Run e2e tests:

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

[@ttoss/config](https://ttoss.dev/docs/modules/packages/config/#jest) has already configured coverage collection.

### Integration with Pull Requests

- **Baseline maintenance**: PRs should not decrease overall package coverage below 10%
- **New feature testing**: New features should include appropriate test coverage
- **Coverage reporting**: Use coverage reports to guide testing priorities
