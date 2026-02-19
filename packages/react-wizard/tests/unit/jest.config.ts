import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      statements: 95.67,
      branches: 89.51,
      functions: 92.2,
      lines: 95.67,
    },
  },
});
