# @ttoss/config

**@ttoss/config** is an opinionated configuration library for [monorepo](#monorepo) and [packages](#packages). It contains a set of default configurations that you can use on your projects.

## Install

```shell
pnpm add -Dw @ttoss/config
```

## Monorepo

Use the configs of this section on the root of your monorepo.

### ESLint and Prettier

Install the following packages:

```shell
pnpm add -Dw eslint prettier @ttoss/eslint-config

```

Create the `.prettierrc.js` file and add the following configuration:

```js title=".prettierrc.js"
const { prettierConfig } = require('@ttoss/config');

module.exports = prettierConfig();
```

Create the `.eslintrc.js` file and add the following configuration:

```js title=".eslintrc.js"
module.exports = {
  extends: '@ttoss/eslint-config',
};
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
pnpm husky add .husky/pre-commit "pnpm lint-staged"
```

## Packages

You can use configs below to your packages folders.

### Babel

Add the `babel.config.js` file on the package folder:

```js title="babel.config.js"
const { babelConfig } = require('@ttoss/config');

module.exports = babelConfig();
```

### Jest

Install [Jest](https://jestjs.io/) and its types on your package:

```shell
pnpm add -D jest @types/jest
```

Create the `jest.config.ts` file on the package folder:

```ts title="jest.config.ts"
import { jestConfig } from '@ttoss/config';

const config = jestConfig();

export default config;
```

Configure the `test` script on `package.json` of your package:

```json title="package.json"
"scripts": {
  "test": "jest",
}
```

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
