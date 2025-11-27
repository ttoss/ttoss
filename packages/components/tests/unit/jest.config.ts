import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 91.83,
      branches: 85.1,
      lines: 93.3,
      functions: 92.3,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
