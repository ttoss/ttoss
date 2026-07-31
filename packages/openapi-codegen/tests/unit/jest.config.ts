import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.2,
      branches: 84.2,
      lines: 100,
      functions: 100,
    },
  },
});

export default config;
