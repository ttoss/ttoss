import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.1,
      branches: 97.95,
      functions: 100,
      lines: 99.1,
    },
  },
});
