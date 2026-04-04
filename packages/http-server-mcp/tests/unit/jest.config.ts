import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 77,
      branches: 55,
      functions: 76,
      lines: 77,
    },
  },
};
