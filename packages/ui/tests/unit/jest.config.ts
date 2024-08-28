import { jestUnitConfig } from '@ttoss/config';

/**
 * https://github.com/facebook/jest/issues/12984#issuecomment-1228392944
 */
const esmModules = ['@iconify-icons'];

const transformIgnorePatterns = [
  `node_modules/(?!(?:.pnpm/)?(${esmModules.join('|')}))`,
];

const config = jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns,
});

// eslint-disable-next-line import/no-default-export
export default config;
