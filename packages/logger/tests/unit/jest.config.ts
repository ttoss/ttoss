import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const esmModules = ['@faker-js/faker'];

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({ esmModules }),
});

export default config;
