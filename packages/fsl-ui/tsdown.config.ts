import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  entry: ['src/index.ts', 'src/semantics/index.ts'],
  format: ['esm'],
  /**
   * Emit one file per source module instead of a single bundled chunk. The
   * barrel (`dist/index.mjs`) becomes pure re-exports, so a consumer that
   * imports only `Button` pulls Button's chunk and nothing else — the
   * package tree-shakes at the published-artifact level, not just from
   * `src`. Verified by `pnpm run verify:treeshake` against `dist`.
   */
  unbundle: true,
});
