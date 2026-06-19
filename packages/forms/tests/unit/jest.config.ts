import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 94.8,
      branches: 90.7,
      functions: 95.2,
      lines: 94.75,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns(),
});

export default config;
