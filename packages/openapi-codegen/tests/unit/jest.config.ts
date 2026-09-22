import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.6,
      branches: 97.1,
      lines: 100,
      functions: 100,
    },
  },
});

export default config;
