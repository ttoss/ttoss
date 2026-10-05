import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 93.9,
      branches: 88.7,
      lines: 94.5,
      functions: 94.6,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
