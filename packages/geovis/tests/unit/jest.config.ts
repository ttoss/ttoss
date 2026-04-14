import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  coverageThreshold: {
    global: {
      statements: 48,
      branches: 19,
      functions: 62,
      lines: 48,
    },
  },
});
