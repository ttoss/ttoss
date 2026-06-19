import { jestUnitConfig } from '@ttoss/config';

export default {
  ...jestUnitConfig(),
  coverageThreshold: {
    global: {
      statements: 99.28,
      branches: 92.85,
      functions: 100,
      lines: 99.28,
    },
  },
};
