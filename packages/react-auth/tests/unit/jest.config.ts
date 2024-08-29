import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!rehype-raw)/'],
});

// eslint-disable-next-line import/no-default-export
export default config;
