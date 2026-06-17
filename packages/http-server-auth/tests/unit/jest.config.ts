import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      branches: 96.2,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
});
