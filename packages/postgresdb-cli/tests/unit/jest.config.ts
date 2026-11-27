import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // pgvector (through @ttoss/postgresdb) ships ESM only.
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/)?pgvector)'],
  coverageThreshold: {
    global: {
      statements: 87.2,
      branches: 88.4,
      functions: 85.7,
      lines: 87.2,
    },
  },
});
