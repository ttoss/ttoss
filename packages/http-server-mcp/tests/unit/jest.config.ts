import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.2,
      branches: 90.6,
      functions: 99.9,
      lines: 99.2,
    },
  },
};
