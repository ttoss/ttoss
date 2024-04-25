import { jestConfig } from '@ttoss/config';
import coverageThreshold from './jest.coverageThreshold.cjs';

const config = jestConfig({
  collectCoverage: true,
  coverageThreshold,
  setupFiles: ['<rootDir>/tests/setupTests.ts'],
  silent: true,
});

// eslint-disable-next-line import/no-default-export
export default config;
