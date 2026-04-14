import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // barrel files — no executable logic
    'src/index.ts',
    'src/model.ts',
    'src/semantics/index.ts',
    'src/tokens/index.ts',
    // pure `as const` data — no branches to cover
    'src/semantics/taxonomy.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      lines: 100,
      functions: 100,
    },
  },
});
