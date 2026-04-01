import { jestConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestConfig({
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/tests/'],
  coverageThreshold: {
    global: {
      statements: 67.5,
      branches: 57.59,
      functions: 68.13,
      lines: 67.47,
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
