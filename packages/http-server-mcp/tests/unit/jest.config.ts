import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.18,
      branches: 92.45,
      functions: 100,
      lines: 99.17,
    },
  },
};
