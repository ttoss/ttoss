import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 81,
      branches: 70,
      functions: 78,
      lines: 81,
    },
  },
};
