import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 94.2,
      functions: 95,
      lines: 95,
    },
  },
});
