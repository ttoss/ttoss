import { jestConfig } from '@ttoss/config';
import coverageThreshold from './jest.coverageThreshold.cjs';

/**
 * https://github.com/facebook/jest/issues/12984#issuecomment-1228392944
 */
const esmModules = ['change-case'];

const transformIgnorePatterns = [
  `node_modules/(?!(?:.pnpm/)?(${esmModules.join('|')}))`,
];

const config = jestConfig({
  collectCoverage: true,
  coverageThreshold,
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
    'tests/(.*)': '<rootDir>/tests/$1',
  },
  setupFiles: ['<rootDir>/tests/setupTests.ts'],
  // silent: true,
  transformIgnorePatterns,
});

// eslint-disable-next-line import/no-default-export
export default config;
