import { jestConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@faker-js/faker', 'change-case'];

const config = jestConfig({
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/tests/'],
  coverageThreshold: {
    global: {
      statements: 58.84,
      branches: 45.31,
      lines: 58.87,
      functions: 60.89,
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
