import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99,
      branches: 97.9,
      functions: 100,
      lines: 99,
    },
  },
});
