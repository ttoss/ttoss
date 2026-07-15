import { jestUnitConfig } from '@ttoss/config';
import { getTransformIgnorePatterns } from '@ttoss/test-utils';

export default jestUnitConfig({
  // ESM-only deps pulled in by the @ttoss/forms bridge test (react-intl,
  // react-markdown & friends) must be babel-transformed — same setting
  // @ttoss/forms itself uses.
  transformIgnorePatterns: getTransformIgnorePatterns(),
  setupFilesAfterEnv: ['./setupTests.tsx'],
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // barrel files — no executable logic
    'src/index.ts',
    'src/semantics/index.ts',
    'src/tokens/index.ts',
    // pure `as const` data — no branches to cover
    'src/semantics/taxonomy.ts',
    // Components and composite *render* surfaces are structurally enforced
    // by contract tests and visually covered by Storybook. Unit coverage
    // here would force per-state render tests that duplicate what the
    // contract + Storybook matrix already verify.
    //
    // The `src/composites/` regex matches only sub-directories (e.g.
    // `src/composites/Dialog/Dialog.tsx`); top-level files in `composites/`
    // — notably `scope.ts` — remain in the coverage scope and are
    // exercised by `compositeScope.test.tsx` and the existing behaviour
    // suites (`Wizard`, `DialogActions`, `ConfirmationDialog`).
    'src/components/',
    'src/composites/[A-Z]',
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
