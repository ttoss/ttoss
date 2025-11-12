import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 91.08,
      branches: 83.58,
      lines: 92.43,
      functions: 91.8,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
