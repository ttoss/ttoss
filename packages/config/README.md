# @ttoss/config

**@ttoss/config** is an opinionated configuration library for [monorepo](#monorepo) and [packages](#packages). It contains a set of default configurations that you can use on your projects.

## Install

```shell
pnpm add -Dw @ttoss/config
```

## Monorepo

Use the configs of this section on the root of your monorepo.

### Quick Setup (Recommended)

The easiest way to set up all monorepo configurations at once is using the `@ttoss/monorepo` command:

```shell
pnpm add -Dw @ttoss/monorepo
npx @ttoss/monorepo setup-monorepo
```

This command will automatically create all configuration files and install all necessary dependencies for ESLint, Prettier, Husky, commitlint, lint-staged, Lerna, Syncpack, and pnpm workspace.

For more details, see [@ttoss/monorepo documentation](https://github.com/ttoss/ttoss/tree/main/packages/monorepo).

### Manual Setup

Alternatively, you can set up each tool manually:

### ESLint and Prettier

Install the following packages:

```shell
pnpm add -Dw eslint prettier @ttoss/eslint-config @ttoss/config
```

Create the `.prettierrc.js` file and add the following configuration:

```js title=".prettierrc.js"
const { prettierConfig } = require('@ttoss/config');

module.exports = prettierConfig();
```

Create the `eslint.config.mjs` file and add the following configuration:

```js title="eslint.config.mjs"
import ttossEslintConfig from '@ttoss/eslint-config';

export default [...ttossEslintConfig];
```

### Husky, commitlint, and lint-staged

This group of packages will only work if you have already installed [ESLint and Prettier](#eslint-and-prettier) because lint-staged will run the `eslint --fix` command.

Install the following packages on the root of your monorepo:

```shell
pnpm add -Dw husky @commitlint/cli lint-staged
```

Create the `.commitlintrc.js` file and add the following configuration:

```js title=".commitlintrc.js"
const { commitlintConfig } = require('@ttoss/config');

module.exports = commitlintConfig();
```

Create the `.lintstagedrc.js` file and add the following configuration:

```js title=".lintstagedrc.js"
const { lintstagedConfig } = require('@ttoss/config');

module.exports = lintstagedConfig();
```

Finally, configure Husky:

```shell
npm set-script prepare "husky install"
pnpm run prepare
pnpm husky add .husky/commit-msg "pnpm commitlint --edit"
pnpm husky add .husky/pre-commit "pnpm lint-staged && pnpm syncpack:list"
```

### Lerna (optional)

[Lerna](https://lerna.js.org/) helps manage versioning and publishing of packages in a monorepo.

Install lerna-lite packages:

```shell
pnpm add -Dw @lerna-lite/cli @lerna-lite/version @lerna-lite/changed @lerna-lite/list
```

Create the `lerna.json` file and configure it according to your monorepo structure:

```json title="lerna.json"
{
  "$schema": "node_modules/@lerna-lite/cli/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "pnpm",
  "stream": true,
  "command": {
    "publish": {
      "allowBranch": "main",
      "noPrivate": true
    },
    "version": {
      "conventionalCommits": true,
      "createRelease": "github",
      "message": "chore(release): publish packages",
      "syncWorkspaceLock": true,
      "allowPeerDependenciesUpdate": true
    }
  },
  "ignoreChanges": ["**/__fixtures__/**", "**/tests/**"],
  "packages": ["packages/*"]
}
```

### Syncpack (optional)

[Syncpack](https://jamiemason.github.io/syncpack/) ensures consistent versions of dependencies across all packages in your monorepo.

Install syncpack:

```shell
pnpm add -Dw syncpack
```

Create the `.syncpackrc.js` file:

```js title=".syncpackrc.js"
const { syncpackConfig } = require('@ttoss/config');

module.exports = syncpackConfig();
```

Add syncpack scripts to your root `package.json`:

```json title="package.json"
{
  "scripts": {
    "syncpack:fix": "syncpack fix-mismatches",
    "syncpack:list": "syncpack list-mismatches"
  }
}
```

### pnpm workspace (required for pnpm monorepos)

Create a `pnpm-workspace.yaml` file to define which directories contain packages:

```yaml title="pnpm-workspace.yaml"
packages:
  - 'packages/*'
```

Adjust the `packages` array to match your monorepo structure. For example:

```yaml title="pnpm-workspace.yaml"
packages:
  - 'packages/*'
  - 'examples/*'
  - 'apps/*'
```

### .gitignore (recommended)

Create a `.gitignore` file in the monorepo root to exclude common build artifacts and dependencies:

```gitignore title=".gitignore"
node_modules/
dist/
build/
.build/
coverage/
*.log
.env
.env.test
.cache/
.turbo
**/i18n/compiled/
**/i18n/missing/
**/i18n/unused/
tsup.config.bundled*.mjs
package-lock.json
yarn.lock
```

### .npmrc (recommended for pnpm)

Create an `.npmrc` file to configure pnpm behavior:

```ini title=".npmrc"
enable-pre-post-scripts=true
engine-strict=true
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=@types*
```

## Packages

You can use configs below to your packages folders.

### Jest

Follow our [tests guidelines](https://ttoss.dev/docs/engineering/guidelines/tests) to configure and run your tests.

### Tsup

Use [tsup](https://tsup.egoist.sh/) to bundle your TypeScript packages.

Install [tsup](https://tsup.egoist.sh/) on your package.

```shell
pnpm add -D tsup
```

Create the `tsup.config.ts` file on the package folder:

```ts title="tsup.config.ts"
import { tsupConfig } from '@ttoss/config';

export const tsup = tsupConfig();
```

Configure the `build` script on `package.json`:

```json title="package.json"
"scripts": {
  "build": "tsup",
}
```

### TypeScript

Install [TypeScript](https://www.npmjs.com/package/typescript) on your package:

```shell
pnpm add -D typescript
```

Extend default configuration for each `tsconfig.json` (`touch tsconfig.json`) on the package folder:

```json title="tsconfig.json"
{
  "extends": "@ttoss/config/tsconfig.json"
}
```

For tests, you can extend the default test configuration `tsconfig.test.json` on the package `tests` folder:

```json title="tests/tsconfig.json"
{
  "extends": "@ttoss/config/tsconfig.test.json",
  "include": ["**/*.test.ts", "**/*.test.tsx"]
}
```

## Extending configurations

Each configuration is customizable and you can extend them with your own. For example, you can use the default `.prettierrc.js` file in your monorepo:

```js title=".prettierrc.js"
const { prettierConfig } = require('@ttoss/config');

module.exports = prettierConfig();
```

But, if you want to change the `printWidth` [option](https://prettier.io/docs/en/options.html), you can do so:

```js title=".prettierrc.js"
const { prettierConfig } = require('@ttoss/config');

module.exports = prettierConfig({
  printWidth: 120,
});
```

You can also pass a second argument to every configuration to handle array's append or overwrite items.

```js title="babel.config.js"
const { babelConfig } = require('@ttoss/config');

// Append plugins (default)
const appendConfig = babelConfig(
  {
    plugins: ['@babel/plugin-proposal-class-properties'],
  },
  {
    arrayMerge: 'append',
  }
);

const overwriteConfig = babelConfig(
  {
    plugins: ['@babel/plugin-proposal-class-properties'],
  },
  {
    arrayMerge: 'overwrite',
  }
);
```
