import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      branches: 63,
      functions: 81,
      lines: 81,
      statements: 81,
    },
  },
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
});

export default config;
