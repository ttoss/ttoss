import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.4,
      branches: 94.6,
      functions: 100,
      lines: 99.4,
    },
  },
};
