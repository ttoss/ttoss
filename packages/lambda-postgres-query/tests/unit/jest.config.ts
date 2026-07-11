import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 86.2,
      branches: 92.9,
      lines: 86.2,
      functions: 94.9,
    },
  },
});
