import { jestConfig } from '@ttoss/config';

/**
 * https://github.com/facebook/jest/issues/12984#issuecomment-1228392944
 */
const esmModules = ['@iconify-icons'];

const transformIgnorePatterns = [
  `node_modules/(?!(?:.pnpm/)?(${esmModules.join('|')}))`,
];

const config = jestConfig({
  setupFilesAfterEnv: ['./tests/setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns,
});

export default config;
