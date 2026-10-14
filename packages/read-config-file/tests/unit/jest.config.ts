import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 88.55,
      branches: 84.95,
      lines: 88.55,
      functions: 100,
    },
  },
});

export default config;
