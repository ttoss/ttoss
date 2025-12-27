import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 20,
      functions: 100,
      lines: 70,
    },
  },
};
