import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      statements: 20,
      branches: 0,
      functions: 2,
      lines: 21,
    },
  },
});
