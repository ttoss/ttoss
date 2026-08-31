import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.15,
      branches: 98,
      functions: 100,
      lines: 99.15,
    },
  },
});
