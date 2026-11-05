import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      statements: 99.5,
      branches: 94.9,
      functions: 100,
      lines: 99.5,
    },
  },
});

export default config;
