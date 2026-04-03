import { baseTheme, darkAlternate } from './baseTheme';
import { createTheme } from './createTheme';

/**
 * Base theme bundle — light base with dark alternate.
 * Assembled here (not in default.ts) to avoid circular dependency with createTheme.
 *
 * Internal-only: consumers use `createTheme()` with no args for the default.
 */
const baseBundle = createTheme({
  base: baseTheme,
  alternate: darkAlternate,
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** @internal Used by vars.ts — not part of the public API. */
export { baseBundle };

/** Base theme — complete reference implementation of ThemeTokensV2. */
export { baseTheme };

/** Dark-mode semantic override for composition with createTheme. */
export { darkAlternate };
