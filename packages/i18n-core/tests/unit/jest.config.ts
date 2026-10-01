import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.35,
      branches: 97.35,
      lines: 99.35,
      functions: 98,
    },
  },
  // @formatjs/intl and intl-messageformat ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|intl-messageformat))',
  ],
});
