import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  moduleNameMapper: {
    '^../../models/dist$': '<rootDir>/../models/dist/index.cjs',
  },
  // pgvector ships ESM only.
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/)?pgvector)'],
});
