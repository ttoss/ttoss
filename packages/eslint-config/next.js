/**
 * https://nextjs.org/docs/app/api-reference/config/eslint#with-typescript
 */
import defaultConfig, { compat } from './config';

export default [
  ...defaultConfig,
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),
  {
    rules: {
      'import/no-default-export': 'off',
    },
  },
];
