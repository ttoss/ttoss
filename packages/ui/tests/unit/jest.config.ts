import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@iconify-icons'];

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 82.06,
      branches: 77.14,
      lines: 82.06,
      functions: 76.11,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules,
  }),
});

export default config;
