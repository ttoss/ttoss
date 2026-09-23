import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 98.3,
      functions: 100,
      lines: 100,
    },
  },
};
