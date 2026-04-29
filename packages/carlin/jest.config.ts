import { jestConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestConfig({
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/tests/'],
  coverageThreshold: {
    global: {
      statements: 69.16,
      branches: 59.09,
      lines: 69.13,
      functions: 70.87,
    },
  },
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
    'tests/(.*)': '<rootDir>/tests/$1',
  },
  setupFiles: ['<rootDir>/tests/setupTests.ts'],
  silent: true,
  transformIgnorePatterns: getTransformIgnorePatterns(),
});

export default config;
