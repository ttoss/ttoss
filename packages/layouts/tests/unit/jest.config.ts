import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      statements: 92.37,
      branches: 62.06,
      lines: 92.37,
      functions: 86.95,
    },
  },
});

// eslint-disable-next-line import/no-default-export
export default config;
