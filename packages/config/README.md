# @ttoss/config

<strong>@ttoss/config</strong> is an opinionated configuration library for monorepo repositories, packages, and applications. It contains a set of <a href="/docs/core/config/default-configs">default configurations</a> that you can use on your projects.

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

## Install

```shell
$ yarn add -DW @ttoss/config @ttoss/eslint-config
```

It already installs:

- ESLint
- Prettier
- commitlint
- lint-staged

## Monorepo

Add the configs of this section on the root of your monorepo. For configs for packages, you can check the section [Packages and Applications](#packages-and-applications). You can check [this monorepo template](https://github.com/ttoss/monorepo) if you want to see the final configuration after following the steps.

### ESLint and Prettier

Create `.prettierrc.js` (`touch .prettierrc.js`) and add the following to it:

```js title=".prettierrc.js"
const { prettierConfig } = require('@ttoss/config');

module.exports = prettierConfig();
```

Create `.eslintrc.js` (`touch .eslintrc.js`) and add the following to it:

```js title=".eslintrc.js"
module.exports = {
  extends: '@ttoss/eslint-config',
};
```

### Husky, commitlint, and lint-staged

This group of packages will only work if you have already installed [ESLint and Prettier](#eslint-and-prettier).

Install the following packages on the root of your monorepo:

```shell
yarn add -DW husky
```

Create `.commitlintrc.js` (`touch .commitlintrc.js`) and add the following to it:

```js title=".commitlintrc.js"
const { commitlintConfig } = require('@ttoss/config');

module.exports = commitlintConfig();
```

Create `.lintstagedrc.js` (`touch .lintstagedrc.js`) and add the following to it:

```js title=".lintstagedrc.js"
const { lintstagedConfig } = require('@ttoss/config');

module.exports = lintstagedConfig();
```

Finally, configure Husky:

```shell
npm set-script prepare "husky install"
yarn run prepare
yarn husky add .husky/commit-msg "yarn commitlint --edit"
yarn husky add .husky/pre-commit "yarn lint-staged"
```

### Lerna and Yarn Workspaces

Although this package doesn't export any configuration for [Lerna](https://github.com/lerna/lerna) or [Yarn Workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/), it's still useful to have them installed.

Install [Lerna](https://github.com/lerna/lerna) on the root of your monorepo:

```shell
yarn add -DW lerna
```

And add `lerna.json` (`touch lerna.json`) config file:

```json title="lerna.json"
{
  "version": "0.0.0",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "stream": true,
  "command": {
    "publish": {
      "allowBranch": "main",
      "conventionalCommits": true,
      "message": "chore: publish new version"
    },
    "version": {
      "forcePublish": true
    }
  }
}
```

Finally, add the following in a `package.json` file to configure [Yarn Workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/):

```json title="package.json"
{
  "private": true,
  "workspaces": ["packages/**/*"]
}
```

### Turborepo

Coming soon...

## Packages and Applications

You can use configs below to your packages and applications folders.

### Babel

Add `babel.config.js` (`touch babel.config.js`) on the package folder:

```js title="babel.config.js"
const { babelConfig } = require('@ttoss/config');

module.exports = babelConfig();
```

### Jest

Install [Jest](https://jestjs.io/) and its types on your package:

```shell
yarn add -D jest @types/jest
```

Create `jest.config.ts` (`touch jest.config.ts`) on the package folder:

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

Use [tsup](https://tsup.egoist.sh/) to bundle your TypeScript package, if you need to.

Install [tsup](https://tsup.egoist.sh/) on the root of your monorepo:

```shell
yarn add -DW tsup
```

Create `tsup.config.ts` (`touch tsup.config.ts`) on the package folder:

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

Install [TypeScript](https://www.npmjs.com/package/typescript) on the root of your monorepo:

```shell
yarn add -DW typescript
```

Extend default configuration for each `tsconfig.json` (`touch tsconfig.json`) on the package folder:

```json title="tsconfig.json"
{
  "extends": "@ttoss/config/tsconfig.json"
}
```
