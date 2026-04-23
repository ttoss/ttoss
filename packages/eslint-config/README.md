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

## Rules

### Cyclomatic Complexity and Module Sizes

To keep code understandable and testable, this config enforces limits on complexity and size. The rationale is explained in [Cognitive Complexity — because testability, understandability, and changeability matter](https://www.sonarsource.com/blog/cognitive-complexity-because-testability-understandability-and-changeability-matter/).

For the current rule values, see [`config.js`](https://github.com/ttoss/ttoss/blob/main/packages/eslint-config/config.js). These rules are disabled for test files (`*.spec.ts`, `*.test.ts`, `*.spec.tsx`, `*.test.tsx`).
