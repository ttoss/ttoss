import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns(),
  coverageThreshold: {
    global: {
      statements: 99.7,
      branches: 93.3,
      functions: 100,
      lines: 99.7,
    },
  },
});
