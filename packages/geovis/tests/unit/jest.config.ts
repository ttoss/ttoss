import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
  },
  coverageThreshold: {
    global: {
      statements: 71,
      branches: 69,
      functions: 74,
      lines: 73,
    },
  },
});
