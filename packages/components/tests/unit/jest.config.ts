import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 93.23,
      branches: 88.44,
      lines: 94.01,
      functions: 94.34,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
