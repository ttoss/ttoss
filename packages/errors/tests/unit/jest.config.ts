import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      lines: 100,
      functions: 100,
    },
  },
  // @formatjs/intl and intl-messageformat ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|intl-messageformat))',
  ],
});
