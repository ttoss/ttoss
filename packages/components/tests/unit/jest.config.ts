import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 92.37,
      branches: 84.4,
      lines: 93.35,
      functions: 93.82,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
