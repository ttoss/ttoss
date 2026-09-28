import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  // @ttoss/i18n-core depends on @formatjs/intl, which ships ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|intl-messageformat))',
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 98.3,
      functions: 100,
      lines: 100,
    },
  },
};
