import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 99.3,
      branches: 85.45,
      lines: 100,
      functions: 100,
    },
  },
});

export default config;
