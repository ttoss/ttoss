import type { DeprecationEntry, ThemeTokensV2 } from '../Types';
import { toFlatTokens } from './helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of validating a single deprecated token entry.
 */
export interface DeprecationValidationResult {
  /** Dot-path of the deprecated token. */
  path: string;
  /** The deprecation metadata for this token. */
  entry: DeprecationEntry;
  /** Whether the token still resolves to a value in the theme. */
  resolves: boolean;
  /**
   * Whether the replacement token exists in the theme.
   * `null` when no replacement was provided.
   */
  replacementExists: boolean | null;
}

// ---------------------------------------------------------------------------
// validateDeprecations
// ---------------------------------------------------------------------------

/**
 * Validate the `$deprecated` metadata attached to a theme.
 *
 * For each entry in `theme.$deprecated`:
 * - Checks the deprecated token still resolves (it must remain functional
 *   until its `removalVersion`).
 * - Checks the declared replacement token (if any) also resolves.
 *
 * Returns an empty array when the theme carries no deprecation metadata.
 *
 * @example
 * ```ts
 * import { validateDeprecations } from '@ttoss/theme2';
 * import { defaultTheme } from '@ttoss/theme2';
 *
 * const results = validateDeprecations(defaultTheme);
 * // results === [] — no deprecated tokens in built-in themes
 *
 * const broken = results.filter(r => !r.resolves);
 * if (broken.length > 0) {
 *   console.error('Deprecated tokens no longer resolve:', broken);
 * }
 * ```
 */
export const validateDeprecations = (
  theme: ThemeTokensV2
): DeprecationValidationResult[] => {
  const map = theme.$deprecated;
  if (!map || Object.keys(map).length === 0) return [];

  const flat = toFlatTokens(theme);
  return Object.entries(map).map(([path, entry]) => {
    return {
      path,
      entry,
      resolves: path in flat,
      replacementExists:
        entry.replacement != null ? entry.replacement in flat : null,
    };
  });
};
