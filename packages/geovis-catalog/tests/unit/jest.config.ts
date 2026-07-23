import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      statements: 99.9,
      branches: 92.8,
      functions: 99.9,
      lines: 99.9,
    },
  },
});
