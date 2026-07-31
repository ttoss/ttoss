import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // Browser entry point — exercised by the app itself, not unit-testable.
    'src/main.tsx',
  ],
  coverageThreshold: {
    global: {
      statements: 99.1,
      branches: 92.5,
      lines: 99.1,
      functions: 99,
    },
  },
});
