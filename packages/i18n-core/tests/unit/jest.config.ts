import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.4,
      branches: 97.65,
      lines: 99.4,
      functions: 98.2,
    },
  },
  // @formatjs/intl and intl-messageformat ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|intl-messageformat))',
  ],
});
