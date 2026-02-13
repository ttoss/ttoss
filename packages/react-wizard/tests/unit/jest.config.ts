import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      statements: 95.7,
      branches: 89.5,
      functions: 92.2,
      lines: 95.7,
    },
  },
});
