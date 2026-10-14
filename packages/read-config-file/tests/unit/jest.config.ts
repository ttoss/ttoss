import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 88.3,
      branches: 84.95,
      lines: 88.3,
      functions: 100,
    },
  },
});

export default config;
