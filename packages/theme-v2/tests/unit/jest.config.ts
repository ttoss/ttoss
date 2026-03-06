import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 98.3,
      branches: 85.7,
      lines: 98.3,
      functions: 100,
    },
  },
};
