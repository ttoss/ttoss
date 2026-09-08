import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 97.8,
      functions: 100,
      lines: 100,
    },
  },
};
