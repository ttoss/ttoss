import { jestUnitConfig } from '@ttoss/config';

const config = jestUnitConfig({
  coverageThreshold: {
    global: {
      statements: 98.7,
      branches: 85.4,
      lines: 98.7,
      functions: 99.9,
    },
  },
  // @formatjs/cli-lib and its fs-extra dependency ship ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|fs-extra))',
  ],
});

export default config;
