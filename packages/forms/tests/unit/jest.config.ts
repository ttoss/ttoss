import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 94.7,
      branches: 90.5,
      functions: 94.6,
      lines: 94.65,
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
