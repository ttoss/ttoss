import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns(),
  coverageThreshold: {
    global: {
      statements: 99,
      branches: 89.8,
      functions: 99.9,
      lines: 99.9,
    },
  },
});
