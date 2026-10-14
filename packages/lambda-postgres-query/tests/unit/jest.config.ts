import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // camelcase-keys and its dependencies ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(camelcase-keys|camelcase|map-obj|quick-lru)[@/])',
  ],
  coverageThreshold: {
    global: {
      statements: 86.35,
      branches: 92.95,
      lines: 86.35,
      functions: 94.95,
    },
  },
});
