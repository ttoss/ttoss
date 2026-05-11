# @ttoss/monorepo

`@ttoss/monorepo` is a tool to setup a monorepo with [pnpm](https://pnpm.js.org/) based on ttoss conventions.

## Install

```bash
pnpm add -Dw @ttoss/monorepo
```

## Commands

### setup-monorepo

Setup monorepo configuration following [ttoss configuration guidelines](https://ttoss.dev/docs/modules/packages/config/).

This command creates all necessary configuration files for ESLint, Prettier, Husky, commitlint, lint-staged, Lerna, Syncpack, and pnpm workspace in your monorepo root.

```bash
npx @ttoss/monorepo setup-monorepo [directory]
```

**Arguments:**

- `directory` - Target directory (defaults to current directory `.`)

**Examples:**

```bash
# Setup monorepo configuration in current directory
npx @ttoss/monorepo setup-monorepo

# Setup monorepo configuration in a specific directory
npx @ttoss/monorepo setup-monorepo /path/to/monorepo
```

**What it creates:**

Configuration files:

- `.prettierrc.js` - Prettier configuration
- `eslint.config.mjs` - ESLint configuration
- `.commitlintrc.js` - commitlint configuration
- `.lintstagedrc.js` - lint-staged configuration
- `lerna.json` - Lerna configuration for versioning and publishing
- `.syncpackrc.js` - Syncpack configuration for dependency management
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `.gitignore` - Git ignore file with common patterns
- `.npmrc` - pnpm configuration file
- `.husky/commit-msg` - Husky hook for commit message linting
- `.husky/pre-commit` - Husky hook for pre-commit linting and syncpack validation

It also:

- Installs `eslint`, `prettier`, `@ttoss/eslint-config`, and `@ttoss/config` as dev dependencies
- Installs `husky`, `@commitlint/cli`, and `lint-staged` as dev dependencies
- Installs `@lerna-lite/cli`, `@lerna-lite/version`, `@lerna-lite/changed`, and `@lerna-lite/list` as dev dependencies
- Installs `syncpack` as dev dependency
- Adds `"prepare": "husky install"` script to `package.json`
- Adds `"syncpack:fix": "syncpack fix-mismatches"` script to `package.json`
- Adds `"syncpack:list": "syncpack list-mismatches"` script to `package.json`
- Initializes Husky and creates git hooks
- Configures pre-commit hook to run both `lint-staged` and `syncpack:list`

**Verifying the setup:**

After running the command:

1. Update `pnpm-workspace.yaml` "packages" field to match your monorepo structure
2. Update `lerna.json` "packages" field to match your monorepo structure
3. Run `pnpm syncpack:list` to check for version mismatches across packages
4. Try making a commit to test the hooks
5. Run `pnpm lint` to check your code formatting

**About the tools:**

- **Lerna**: [Lerna](https://lerna.js.org/) helps manage versioning and publishing of packages in a monorepo. The setup uses [lerna-lite](https://github.com/lerna-lite/lerna-lite), a lighter alternative to Lerna.
- **Syncpack**: [Syncpack](https://jamiemason.github.io/syncpack/) ensures consistent versions of dependencies across all packages in your monorepo.
- **pnpm workspace**: Defines which directories contain packages in your pnpm monorepo.

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
