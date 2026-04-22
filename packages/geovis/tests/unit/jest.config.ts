import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
  },
  coverageThreshold: {
    global: {
      statements: 68,
      branches: 62,
      functions: 72,
      lines: 70,
    },
  },
});
