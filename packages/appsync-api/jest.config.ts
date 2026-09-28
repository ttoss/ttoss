import { jestConfig } from '@ttoss/config';

const config = jestConfig({
  // @ttoss/i18n-core depends on @formatjs/intl, which ships ESM only.
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm/)?(@formatjs|intl-messageformat))',
  ],
});

export default config;
