import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/../..'],
});

delete config.moduleNameMapper['src/(.*)'];

// eslint-disable-next-line import/no-default-export
export default config;
