import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.6,
      branches: 94.2,
      functions: 99.9,
      lines: 99.6,
    },
  },
};
