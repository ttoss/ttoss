import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 94.18,
      branches: 89.73,
      functions: 94.3,
      lines: 94.11,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules: ['react-error-boundary'],
  }),
});

export default config;
