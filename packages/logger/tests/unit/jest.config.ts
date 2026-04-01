import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns(),
  coverageThreshold: {
    global: {
      statements: 91,
      branches: 87,
      lines: 91,
      functions: 100,
    },
  },
});

export default config;
