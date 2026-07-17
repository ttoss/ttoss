/**
 * Wire protocol between gauntlet/index.ts and the renderChild.ts process:
 * the child prints exactly one line starting with this marker, followed by
 * the JSON-encoded result (`null` on success, `{ level, error }` on
 * failure). Everything else on stdout/stderr is library noise.
 */
export const RESULT_MARKER = '__FSL_BENCH_RESULT__';

export interface ChildRenderFailure {
  level: 'render' | 'behavior';
  error: string;
}
