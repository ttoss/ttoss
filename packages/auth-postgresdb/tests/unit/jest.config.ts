import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  /**
   * Babel cannot transform decorated `declare` fields, so the models are
   * exercised through the `pretest` bundle — the same pattern
   * `@terezinha-farm/postgresdb` uses. Coverage therefore measures the store
   * adapters, which are plain functions.
   */
  moduleNameMapper: {
    '^dist/index$': '<rootDir>/../../dist/index.cjs',
  },
  coveragePathIgnorePatterns: [
    '<rootDir>/../../src/models/',
    '<rootDir>/../../src/index.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
});
