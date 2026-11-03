import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      statements: 99.4,
      branches: 94.5,
      functions: 100,
      lines: 99.4,
    },
  },
});

export default config;
