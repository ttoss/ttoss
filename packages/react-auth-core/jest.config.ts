import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  setupFilesAfterEnv: ['<rootDir>/setupTests.tsx'],
});

export default config;
