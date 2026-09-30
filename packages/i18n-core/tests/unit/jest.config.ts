import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.3,
      branches: 96.1,
      lines: 99.3,
      functions: 97.9,
    },
  },
  // @formatjs/intl and intl-messageformat ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|intl-messageformat))',
  ],
});
