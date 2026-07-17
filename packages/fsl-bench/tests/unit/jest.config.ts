import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // The gauntlet owns its DOM: render.ts boots a dedicated jsdom instance and
  // loads React/RTL through Node's native module cache (createRequire), so a
  // single React instance is shared between the harness and the evaluated
  // sample. Running jest in `node` keeps jest's module registry out of that
  // path entirely.
  testEnvironment: 'node',
  // Gauntlet-heavy suites (golden calibration compiles + bundles + mounts 20
  // samples) exceed jest's 5s default.
  testTimeout: 120000,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // Network + CLI orchestration — exercised only in real campaigns (needs
    // API keys); everything they orchestrate (gauntlet, report, extract,
    // stats) is unit-tested. The provider REGISTRY (providers/index.ts) is
    // pure logic and stays covered; only the transport impls are excluded.
    'src/providers/claude.ts',
    'src/providers/gemini.ts',
    'src/runner.ts',
    'src/reportCli.ts',
    // Gauntlet L2/L3 executes in a dedicated child Node process (native
    // module resolution + per-sample isolation — see renderChild.ts), which
    // jest cannot instrument. The golden calibration suite exercises this
    // code end-to-end: 20 fixtures × render + behavior assertions.
    'src/gauntlet/render.ts',
    'src/gauntlet/renderChild.ts',
    'src/scenarios/check.ts',
    'src/scenarios/dialog.ts',
    'src/scenarios/fieldValidation.ts',
    'src/scenarios/menu.ts',
    'src/scenarios/destructiveConfirm.ts',
    'src/scenarios/themedComposite.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 92.9,
      branches: 80.9,
      lines: 92.9,
      functions: 98.1,
    },
  },
});
