import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
  coverageThreshold: {
    global: {
      statements: 52,
      branches: 20,
      functions: 64,
      lines: 52,
    },
  },
});
