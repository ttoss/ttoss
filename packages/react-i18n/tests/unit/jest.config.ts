import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

const config = jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: getTransformIgnorePatterns(),
});

export default config;
