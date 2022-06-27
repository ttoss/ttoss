import { jestConfig } from '@ttoss/config';
import coverageThreshold from './jest.coverageThreshold';

const config = jestConfig({
  collectCoverage: true,
  coverageThreshold,
  setupFiles: ['<rootDir>/setupTests.ts'],
});

export default config;
