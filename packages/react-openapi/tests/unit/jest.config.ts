import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.0,
      branches: 94.9,
      functions: 99.7,
      lines: 99.0,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns(),
});
