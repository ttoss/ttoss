import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 95.28,
      branches: 81.81,
      lines: 95.28,
      functions: 95.45,
    },
  },
});

export default config;
