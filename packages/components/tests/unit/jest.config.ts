import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 92.5,
      branches: 87.4,
      lines: 93.1,
      functions: 93.1,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
