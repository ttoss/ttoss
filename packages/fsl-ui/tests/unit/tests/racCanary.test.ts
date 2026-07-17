/**
 * React Aria `UNSTABLE_` canary (audit A9 / ADR-003).
 *
 * `Toast` consumes `UNSTABLE_Toast*` exports, which React Aria may rename
 * or remove in ANY minor release — that is what the prefix means. The
 * dependency is therefore pinned to `~1.9.0` (patch-only) in package.json.
 *
 * If this test fails after a react-aria-components upgrade:
 *   1. Check the RAC release notes for the Toast stabilization / rename.
 *   2. Update the imports in `src/components/Toast/Toast.tsx`.
 *   3. If Toast is now stable (prefix dropped), widen the dependency range
 *      back to `^` and DELETE this canary (see CONTRIBUTING ADR-003).
 */
import * as rac from 'react-aria-components';

const CONSUMED_UNSTABLE_EXPORTS = [
  'UNSTABLE_Toast',
  'UNSTABLE_ToastContent',
  'UNSTABLE_ToastQueue',
  'UNSTABLE_ToastRegion',
] as const;

describe('react-aria-components UNSTABLE canary (ADR-003)', () => {
  test.each(CONSUMED_UNSTABLE_EXPORTS)(
    '%s is still exported by react-aria-components',
    (name) => {
      expect((rac as Record<string, unknown>)[name]).toBeDefined();
    }
  );
});
