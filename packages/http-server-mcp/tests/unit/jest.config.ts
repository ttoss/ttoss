import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.65,
      branches: 95.0,
      functions: 99.9,
      lines: 99.65,
    },
  },
};
