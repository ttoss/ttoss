import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@iconify-icons'];

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 77.83,
      branches: 75.72,
      lines: 77.83,
      functions: 71.21,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules,
  }),
});

export default config;
