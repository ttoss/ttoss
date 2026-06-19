import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/unit/setup.ts'],
  transformIgnorePatterns: getTransformIgnorePatterns(),
});
