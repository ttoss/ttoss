import { defaultTheme } from './themes/default';
import type { ThemeTokensV2 } from './ThemeTokensTemplate';

export { defaultTheme };

// ---------------------------------------------------------------------------
// DeepPartial — allows overriding any nested property of a theme
// ---------------------------------------------------------------------------

/**
 * Recursive partial type. Every nested property becomes optional,
 * enabling selective overrides at any depth.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// ---------------------------------------------------------------------------
// Deep Merge
// ---------------------------------------------------------------------------

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Recursively merges `overrides` into `base`.
 * - Plain objects are merged recursively.
 * - All other values (primitives, arrays) are replaced.
 */
const deepMerge = <T>(base: T, overrides: DeepPartial<T>): T => {
  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return (overrides ?? base) as T;
  }

  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(overrides)) {
    const baseVal = result[key];
    const overVal = (overrides as Record<string, unknown>)[key];

    if (overVal === undefined) {
      continue;
    }

    if (isPlainObject(baseVal) && isPlainObject(overVal)) {
      result[key] = deepMerge(baseVal, overVal);
    } else {
      result[key] = overVal;
    }
  }

  return result as T;
};

// ---------------------------------------------------------------------------
// createTheme
// ---------------------------------------------------------------------------

/**
 * Creates a fully resolved theme by merging partial overrides into a base theme.
 *
 * @param params.overrides - Partial token overrides to apply on top of the base.
 * @param params.base - Base theme to extend. Defaults to `defaultTheme`.
 * @returns A complete `ThemeTokensV2` with all tokens resolved.
 *
 * @example
 * ```ts
 * // Extend the default theme with brand colors
 * const myTheme = createTheme({
 *   overrides: {
 *     core: { colors: { brand: { main: '#FF0000' } } },
 *   },
 * });
 *
 * // Extend another theme (theme inheritance)
 * const childTheme = createTheme({
 *   base: parentTheme,
 *   overrides: {
 *     core: { radii: { sm: '8px' } },
 *   },
 * });
 * ```
 */
export const createTheme = ({
  base = defaultTheme,
  overrides = {},
}: {
  /** Base theme to extend. Defaults to `defaultTheme`. */
  base?: ThemeTokensV2;
  /** Partial overrides applied on top of the base theme. */
  overrides?: DeepPartial<ThemeTokensV2>;
} = {}): ThemeTokensV2 => {
  const merged = deepMerge(base, overrides);

  // Deep-clone to break shared references between base and result.
  // Tokens are primitives (strings, numbers) — JSON round-trip is safe.
  return JSON.parse(JSON.stringify(merged));
};
