import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      branches: 59.7,
      functions: 61.4,
      lines: 62.8,
      statements: 62.8,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules: ['rehype-raw', 'react-error-boundary'],
  }),
});

export default config;
