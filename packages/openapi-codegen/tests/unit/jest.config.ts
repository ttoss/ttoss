import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.9,
      branches: 97.95,
      lines: 100,
      functions: 100,
    },
  },
});

export default config;
