import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      statements: 96.0,
      branches: 92.75,
      functions: 94.0,
      lines: 96.0,
    },
  },
});
