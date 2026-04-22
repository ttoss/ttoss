import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
  },
  coverageThreshold: {
    global: {
      statements: 73,
      branches: 66,
      functions: 76,
      lines: 76,
    },
  },
});
