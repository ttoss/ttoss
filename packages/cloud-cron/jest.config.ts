import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      lines: 100,
      functions: 100,
    },
  },
});

export default config;
