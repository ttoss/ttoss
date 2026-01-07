import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@iconify-icons'];

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 82.35,
      branches: 78.5,
      lines: 82.35,
      functions: 76.1,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules,
  }),
});

export default config;
