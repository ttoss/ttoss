import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 95.5,
      branches: 88.8,
      lines: 96.2,
      functions: 90.8,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns(),
});

export default config;
