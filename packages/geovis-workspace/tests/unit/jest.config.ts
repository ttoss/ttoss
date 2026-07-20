import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/setup.ts'],
  transformIgnorePatterns: getTransformIgnorePatterns(),
  coverageThreshold: {
    global: {
      statements: 91.13,
      branches: 82.11,
      functions: 96.26,
      lines: 93.97,
    },
  },
});
