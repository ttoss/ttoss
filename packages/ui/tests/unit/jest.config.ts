import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@iconify-icons'];

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 82.53,
      branches: 77.14,
      lines: 82.53,
      functions: 76.81,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules,
  }),
});

export default config;
