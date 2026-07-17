import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/setup.ts'],
  transformIgnorePatterns: getTransformIgnorePatterns(),
  coverageThreshold: {
    global: {
      statements: 97.55,
      branches: 94.15,
      functions: 100,
      lines: 97.55,
    },
  },
});
