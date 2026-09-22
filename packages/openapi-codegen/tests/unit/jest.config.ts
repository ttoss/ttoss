import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.4,
      branches: 93,
      lines: 100,
      functions: 100,
    },
  },
});

export default config;
