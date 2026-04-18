// ---------------------------------------------------------------------------
// Theme Bootstrap — mode resolution for runtime.ts
//
// Reads persisted mode from localStorage and resolves the effective mode
// (including system detection). Used by createThemeRuntime on init.
// DOM writes are NOT performed here — that is the sole responsibility of
// apply() inside createThemeRuntime, keeping a single owner for DOM writes.
// ---------------------------------------------------------------------------

/**
 * Configuration for `resolveTheme`.
 */
export interface ThemeBootstrapConfig<M extends string = string> {
  storageKey: string;
  defaultMode: M;
  validModes: readonly M[];
}

/**
 * Reads persisted mode from localStorage and resolves the effective
 * `mode` and `resolvedMode` (never `'system'`).
 *
 * Does **not** touch the DOM — DOM writes are performed by `apply()` inside
 * `createThemeRuntime`, which is the single owner of all attribute mutations.
 */
export const resolveTheme = <M extends string>(
  cfg: ThemeBootstrapConfig<M>
): {
  mode: M;
  resolvedMode: 'light' | 'dark';
} => {
  let stored: { mode?: string } | null = null;
  try {
    const raw = localStorage.getItem(cfg.storageKey);
    if (raw) stored = JSON.parse(raw);
  } catch {
    // localStorage may be unavailable in restricted browser contexts
  }

  // `stored.mode` is validated by `indexOf` at runtime — cast to M is safe.
  const mode: M =
    stored != null &&
    stored.mode != null &&
    cfg.validModes.indexOf(stored.mode as M) !== -1
      ? (stored.mode as M)
      : cfg.defaultMode;

  // `window.matchMedia` is client-only; guard so SSR callers degrade to `light`
  // instead of crashing. The runtime will re-resolve on mount via the same code
  // path, so client-authoritative state is preserved.
  const resolvedMode: 'light' | 'dark' =
    mode === 'system'
      ? typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : (mode as 'light' | 'dark');

  return { mode, resolvedMode };
};
