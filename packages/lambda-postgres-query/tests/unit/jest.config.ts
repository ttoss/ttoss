import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 94,
      branches: 92.6,
      lines: 94,
      functions: 93.3,
    },
  },
});
