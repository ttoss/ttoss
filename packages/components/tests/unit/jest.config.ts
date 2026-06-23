import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 93.5,
      branches: 88.4,
      lines: 94.1,
      functions: 94.1,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
