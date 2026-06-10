import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      branches: 89,
      functions: 97,
      lines: 95,
      statements: 95,
    },
  },
});
