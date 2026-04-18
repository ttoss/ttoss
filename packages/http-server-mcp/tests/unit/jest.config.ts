import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 72,
      functions: 83,
      lines: 85,
    },
  },
};
