import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 89.9,
      branches: 80.1,
      functions: 87.9,
      lines: 89.75,
    },
  },
};
