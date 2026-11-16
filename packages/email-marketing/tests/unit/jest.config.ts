import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.9,
      branches: 98.2,
      functions: 99.9,
      lines: 99.9,
    },
  },
});
