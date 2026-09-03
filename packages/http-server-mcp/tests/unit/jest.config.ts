import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 97.6,
      functions: 100,
      lines: 100,
    },
  },
};
