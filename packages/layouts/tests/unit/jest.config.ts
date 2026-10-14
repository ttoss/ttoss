import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 96.8,
      branches: 81.75,
      lines: 96.8,
      functions: 91.6,
    },
  },
});

export default config;
