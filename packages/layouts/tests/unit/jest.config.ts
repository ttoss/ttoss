import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
});

// eslint-disable-next-line import/no-default-export
export default config;
