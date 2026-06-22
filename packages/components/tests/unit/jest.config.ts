import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 93.3,
      branches: 88.2,
      lines: 94.0,
      functions: 94.0,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
