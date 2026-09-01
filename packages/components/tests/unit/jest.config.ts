import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 93.64,
      branches: 88.4,
      lines: 94.31,
      functions: 94.25,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
