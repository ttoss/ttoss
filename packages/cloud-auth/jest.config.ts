import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
});

export default config;
