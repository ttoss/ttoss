import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 96.99,
      branches: 89.89,
      functions: 98.7,
      lines: 97.64,
    },
  },
});
