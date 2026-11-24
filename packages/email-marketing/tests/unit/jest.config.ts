import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.95,
      branches: 98.4,
      functions: 99.95,
      lines: 99.95,
    },
  },
});
