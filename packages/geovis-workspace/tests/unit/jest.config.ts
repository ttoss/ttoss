import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/setup.ts'],
  transformIgnorePatterns: getTransformIgnorePatterns(),
  coverageThreshold: {
    global: {
      statements: 99.6,
      branches: 98.6,
      functions: 99.3,
      lines: 99.75,
    },
  },
});
