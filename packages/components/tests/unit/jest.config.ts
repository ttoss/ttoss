import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 94.5,
      branches: 88.7,
      lines: 95.1,
      functions: 95.3,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
