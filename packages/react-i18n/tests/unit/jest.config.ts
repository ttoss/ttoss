import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
});

export default config;
