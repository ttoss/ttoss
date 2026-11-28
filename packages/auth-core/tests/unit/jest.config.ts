import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // jose ships ESM only; tests verify tokens with it as an independent party.
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/)?jose)'],
  coverageThreshold: {
    global: {
      statements: 99.42,
      branches: 98.7,
      functions: 100,
      lines: 99.42,
    },
  },
});
