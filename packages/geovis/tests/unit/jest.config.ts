import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
  },
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
});
