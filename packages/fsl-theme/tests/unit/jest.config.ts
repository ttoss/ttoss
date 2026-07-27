import { jestUnitConfig } from '@ttoss/config';

export default jestUnitConfig({
  // The floor is the ratchet, maintained by hand: keep it 0.01–0.1 below actual
  // and never lower it (CLAUDE.md § Package Development Workflow). Read actual
  // from the summary `pnpm run test` prints on every run — deliberately not
  // copied here, because a pasted percentage has no oracle and drifts silently
  // while the printed one cannot. `git log -p` on this file carries the measured
  // snapshot behind each change.
  coverageThreshold: {
    global: {
      statements: 98.7,
      branches: 95.85,
      functions: 99.1,
      lines: 98.8,
    },
  },
});
