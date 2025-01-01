# @ttoss/eslint-config

**@ttoss/eslint-config** is a set of rules for [ESLint](https://eslint.org/) to use on ttoss ecosystem. It uses the new [ESLint flat configuration format](https://eslint.org/docs/latest/use/configure/configuration-files).

## Installation

```bash
pnpm add -D @ttoss/eslint-config
```

## Usage

Add the following to your `eslint.config.mjs` file:

```js
import ttossEslintConfig from '@ttoss/eslint-config';

export default [...ttossEslintConfig];
```

### Next.js projects

Add the following to your `eslint.config.mjs` file:

```js
import ttossEslintConfig from '@ttoss/eslint-config/next';

export default [...ttossEslintConfig];
```
