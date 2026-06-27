import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.3,
      branches: 93.6,
      functions: 100,
      lines: 99.3,
    },
  },
};
