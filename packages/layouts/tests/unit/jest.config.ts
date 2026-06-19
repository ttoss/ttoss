import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 94,
      branches: 82.7,
      lines: 94,
      functions: 82.3,
    },
  },
});

// eslint-disable-next-line import/no-default-export
export default config;
