import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.3,
      branches: 95.8,
      lines: 99.3,
      functions: 97.8,
    },
  },
  // @formatjs/intl and intl-messageformat ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|intl-messageformat))',
  ],
});
