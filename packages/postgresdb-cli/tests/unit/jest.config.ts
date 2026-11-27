import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // pgvector (through @ttoss/postgresdb) ships ESM only.
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/)?pgvector)'],
  coverageThreshold: {
    global: {
      statements: 73.2,
      branches: 77.7,
      functions: 66.6,
      lines: 73.2,
    },
  },
});
