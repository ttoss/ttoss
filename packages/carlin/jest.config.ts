import { jestConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@faker-js/faker', 'change-case'];

const config = jestConfig({
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/tests/'],
  coverageThreshold: {
    global: {
      statements: 60.92,
      branches: 50.56,
      lines: 60.94,
      functions: 62.12,
    },
  },
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
    'tests/(.*)': '<rootDir>/tests/$1',
  },
  setupFiles: ['<rootDir>/tests/setupTests.ts'],
  silent: true,
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules,
  }),
});

export default config;
