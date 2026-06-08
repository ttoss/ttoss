import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 79,
      branches: 72,
      lines: 79,
      functions: 77,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
