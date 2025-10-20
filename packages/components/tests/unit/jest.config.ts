import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
  coverageThreshold: {
    global: {
      statements: 88.3,
      branches: 79.2,
      lines: 89.82,
      functions: 90.38,
    },
  },
});
