import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.2,
      branches: 98.2,
      functions: 100,
      lines: 99.2,
    },
  },
});
