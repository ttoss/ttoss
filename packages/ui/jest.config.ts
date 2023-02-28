import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  setupFilesAfterEnv: ['./tests/setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['/node_modules/(?!(@iconify-icons/.*))'],
});

export default config;
