import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.1,
      branches: 90.7,
      functions: 99.9,
      lines: 99.1,
    },
  },
};
