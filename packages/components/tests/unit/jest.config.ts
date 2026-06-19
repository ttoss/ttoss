import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 98.2,
      branches: 88.4,
      lines: 98.2,
      functions: 90.7,
    },
  },
  coveragePathIgnorePatterns: ['/index.ts$'],
});
