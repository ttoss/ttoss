import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  testEnvironment: 'jsdom',
});

// eslint-disable-next-line import/no-default-export
export default config;
