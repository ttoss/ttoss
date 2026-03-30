import { deepMerge } from './roots/helpers';
import { defaultTheme } from './themes/default';
import type {
  DeepPartial,
  SemanticModeOverride,
  ThemeBundle,
  ThemeTokensV2,
} from './Types';

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

// ---------------------------------------------------------------------------
// createThemeBundle
// ---------------------------------------------------------------------------

/**
 * Creates a theme bundle with an optional alternate color mode.
 *
 * @param params.baseMode - Which mode the base represents. Defaults to `'light'`.
 * @param params.base - Base theme to extend. Defaults to `defaultTheme`.
 * @param params.overrides - Brand overrides applied to the base theme.
 * @param params.alternate - Semantic remapping overrides for the opposite color mode.
 *   Core tokens are immutable — only semantic references change between modes.
 *
 * @example
 * ```ts
 * const myBundle = createThemeBundle({
 *   overrides: { core: { colors: { brand: { main: '#FF0000' } } } },
 *   alternate: {
 *     semantic: {
 *       colors: { content: { primary: { background: { default: '{core.colors.neutral.900}' } } } },
 *     },
 *   },
 * });
 * ```
 */
export const createThemeBundle = ({
  baseMode = 'light',
  base,
  overrides,
  alternate,
}: {
  /** Which mode the base represents. @default 'light' */
  baseMode?: 'light' | 'dark';
  /** Base theme to extend. Defaults to `defaultTheme`. */
  base?: ThemeTokensV2;
  /** Brand overrides applied to the base theme. */
  overrides?: DeepPartial<ThemeTokensV2>;
  /** Semantic remapping overrides for the opposite mode. Only changed semantic refs. */
  alternate?: SemanticModeOverride;
} = {}): ThemeBundle => {
  return {
    baseMode,
    base: createTheme({ base, overrides }),
    alternate,
  };
};
