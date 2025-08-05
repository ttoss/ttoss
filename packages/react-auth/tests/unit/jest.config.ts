import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      branches: 68,
      functions: 68,
      lines: 75,
      statements: 75,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
});

export default config;
