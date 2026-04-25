import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
  },
  coverageThreshold: {
    global: {
      statements: 77.7,
      branches: 69.8,
      functions: 84.7,
      lines: 83,
    },
  },
});
