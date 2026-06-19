import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  setupFiles: ['<rootDir>/tests/unit/setupTests.ts'],
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules: ['@ttoss/postgresdb'],
  }),
  moduleNameMapper: {
    '^dist/index$': '<rootDir>/dist/index.cjs',
  },
  // coverageThreshold: {
  //   global: {
  //     statements: 96,
  //     branches: 88,
  //     functions: 100,
  //     lines: 96,
  //   },
  // },
});

export default config;
