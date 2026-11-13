import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.25,
      branches: 98.3,
      functions: 100,
      lines: 99.25,
    },
  },
});
