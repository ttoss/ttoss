import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  coverageThreshold: {
    global: {
      statements: 99.9,
      branches: 99.9,
      functions: 99.9,
      lines: 99.9,
    },
  },
});

export default config;
