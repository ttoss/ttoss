import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 93.65,
      branches: 88.5,
      lines: 94.32,
      functions: 94.26,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
