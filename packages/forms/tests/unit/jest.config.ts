import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      branches: 71.34,
      functions: 87.05,
      lines: 85.4,
      statements: 85.59,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
});

export default config;
