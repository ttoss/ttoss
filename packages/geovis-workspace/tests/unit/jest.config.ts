import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/setup.ts'],
  transformIgnorePatterns: getTransformIgnorePatterns(),
  coverageThreshold: {
    global: {
      statements: 99.85,
      branches: 99.7,
      functions: 99.75,
      lines: 99.9,
    },
  },
});
