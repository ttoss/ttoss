import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/index.ts',
    'src/model.ts',
    'src/_model/factory.types.ts',
    'src/_model/componentTokens.ts', // pure `as const` data — no executable branches
    'src/_model/resolver.types.ts', // pure type definitions
    'src/_model/tokenMap.ts', // pure `as const` data
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
