import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // The floor is the ratchet, maintained by hand — the band and the
  // never-decrease rule live in CLAUDE.md § Package Development Workflow.
  // Measured 2026-07-25: 98.7402 / 95.9016 / 99.1379 / 98.84 (statements /
  // branches / functions / lines). Recording the actuals is what lets the next
  // reader see at a glance whether the floor has fallen behind — before this
  // pass, branches sat 1.1 points below actual and a full point of regression
  // could have landed without a single check failing.
  coverageThreshold: {
    global: {
      statements: 98.7,
      branches: 95.85,
      functions: 99.1,
      lines: 98.8,
    },
  },
});
