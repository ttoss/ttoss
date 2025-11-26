import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 93.53,
      branches: 89.26,
      functions: 93.75,
      lines: 93.47,
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
