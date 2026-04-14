import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 20,
      functions: 62,
      lines: 50,
    },
  },
});
