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
      statements: 98.7,
      branches: 90.3,
      lines: 98.7,
      functions: 98.7,
    },
  },
});
