import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns({
    esmModules: ['react-error-boundary'],
  }),
});

export default config;
