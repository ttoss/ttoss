import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // jose ships ESM only; tests verify tokens with it as an independent party.
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/)?jose)'],
  coverageThreshold: {
    global: {
      statements: 99.4,
      branches: 98.65,
      functions: 100,
      lines: 99.4,
    },
  },
});
