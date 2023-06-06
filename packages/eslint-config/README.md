# @ttoss/eslint-config

**@ttoss/eslint-config** is a set of rules for [ESLint](https://eslint.org/) to use on ttoss ecosystem.

## Installation

```bash
pnpm add @ttoss/eslint-config --save-dev
```

## Usage

Add the following to your `.eslintrc.js` file:

```js
module.exports = {
  extends: ['@ttoss/eslint-config'],
};
```

### Next.js projects

Add the following to your `.eslintrc.json` file:

```json
{
  "extends": ["@ttoss/eslint-config/next"]
}
```
