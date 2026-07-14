import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 98.5,
      branches: 94.7,
      functions: 99,
      lines: 98.7,
    },
  },
});
