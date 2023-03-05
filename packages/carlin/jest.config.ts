import { jestConfig } from '@ttoss/config';
import coverageThreshold from './jest.coverageThreshold';

const config = jestConfig({
  collectCoverage: true,
  coverageThreshold,
  setupFiles: ['<rootDir>/tests/setupTests.ts'],
  silent: false,
});

export default config;
