# @ttoss/monorepo

`@ttoss/monorepo` is a tool to setup a monorepo with [pnpm](https://pnpm.js.org/) based on ttoss conventions.

## Install

```bash
pnpm add -Dw @ttoss/monorepo
```

## Commands

### setup-tests

Setup test structure following [ttoss testing guidelines](https://ttoss.dev/docs/engineering/guidelines/tests).

This command creates the recommended directory structure for unit and e2e tests, including all necessary configuration files.

```bash
npx @ttoss/monorepo setup-tests [directory] [options]
```

**Arguments:**

- `directory` - Target directory (defaults to current directory `.`)

**Options:**

- `--e2e` - Include e2e test setup (default: false)

**Examples:**

```bash
# Setup tests in current directory (unit tests only)
npx @ttoss/monorepo setup-tests

# Setup tests with e2e in current directory
npx @ttoss/monorepo setup-tests --e2e

# Setup tests in a specific package
npx @ttoss/monorepo setup-tests packages/my-package

# Setup tests with e2e in a specific package
npx @ttoss/monorepo setup-tests packages/my-package --e2e
```

**What it creates:**

Without `--e2e`:

- `tests/` - Root tests directory
- `tests/unit/tests/` - Unit tests directory
- `tests/unit/tests/setup.test.ts` - Sample test to verify setup works
- `jest.config.ts` - Root Jest configuration (with 50% coverage threshold)
- `tests/unit/jest.config.ts` - Unit tests Jest configuration
- `tests/unit/babel.config.cjs` - Unit tests Babel configuration
- `tests/tsconfig.json` - Tests TypeScript configuration

With `--e2e`:

- All of the above, plus:
- `tests/e2e/tests/` - E2E tests directory
- `tests/e2e/tests/setup.test.ts` - Sample e2e test to verify setup works
- `tests/e2e/jest.config.ts` - E2E tests Jest configuration
- `tests/e2e/babel.config.cjs` - E2E tests Babel configuration

It also:

- Installs `jest` and `@ttoss/config` as dev dependencies
- Adds test scripts to `package.json`:
  - `"test": "jest --projects tests/unit"` - Run unit tests
  - `"e2e": "jest --projects tests/e2e"` - Run e2e tests

**Verifying the setup:**

After running the command, verify everything works:

```bash
pnpm test
```

You should see the sample tests pass. Once you start writing your own tests, you can delete the `setup.test.ts` files.
