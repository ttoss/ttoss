import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@iconify-icons'];

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 78.53,
      branches: 76.02,
      lines: 78.53,
      functions: 71.64,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules,
  }),
});

export default config;
