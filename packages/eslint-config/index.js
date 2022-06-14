/**
 * We need `require('@rushstack/eslint-patch/modern-module-resolution');`
 * because ESLint doesn't support plugins as dependency in shareable ESLint
 * configuration, as you can see on [this issue](https://github.com/eslint/eslint/issues/3458).
 * To overcome this, you can use the [`@rushstack/eslint-patch` package](https://www.npmjs.com/package/@rushstack/eslint-patch),
 * a patch that improves how ESLint loads plugins when working in a monorepo
 */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = require('./config');
