import { jestConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestConfig({
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/tests/'],
  coverageThreshold: {
    global: {
      statements: 84.45,
      branches: 76.35,
      lines: 84.4,
      functions: 85.4,
    },
  },
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
    'tests/(.*)': '<rootDir>/tests/$1',
  },
  setupFiles: ['<rootDir>/tests/setupTests.ts'],
  silent: true,
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules: ['@octokit/webhooks-methods', '@octokit/webhooks'],
  }),
});

export default config;
