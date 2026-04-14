import { baseIcons } from './baseIcons';
import { baseTheme, darkAlternate } from './baseTheme';
import { deepMerge } from './roots/helpers';
import type {
  DeepPartial,
  IconGlyphMap,
  ModeOverride,
  ThemeBundle,
  ThemeTokensV2,
} from './Types';

// ---------------------------------------------------------------------------
// buildTheme (internal)
// ---------------------------------------------------------------------------

/**
 * Creates a fully resolved `ThemeTokensV2` by merging partial overrides into a base.
 * Internal engine — consumers should use `createTheme` which returns `ThemeBundle`.
 *
 * @internal
 */
export const buildTheme = ({
  base = baseTheme,
  overrides = {},
}: {
  /** Base theme to extend. Defaults to `baseTheme`. */
  base?: ThemeTokensV2;
  /** Partial overrides applied on top of the base theme. */
  overrides?: DeepPartial<ThemeTokensV2>;
} = {}): ThemeTokensV2 => {
  const merged = deepMerge(base, overrides);

  // Deep-clone to break shared references between base and result.
  // Tokens are primitives (strings, numbers) — structuredClone is safe and
  // more correct than JSON round-trip (preserves undefined, NaN, etc.).
  return structuredClone(merged);
};

// ---------------------------------------------------------------------------
// createTheme
// ---------------------------------------------------------------------------

/**
 * Creates a theme bundle with an optional alternate color mode.
 *
 * The `extends` param is the idiomatic way to build on a built-in theme:
 * it inherits the base tokens **and** the dark-mode alternate automatically.
 *
 * @param params.extends - Parent bundle to inherit from. `base`, `baseMode`, and
 *   `alternate` default to the parent's values when this is provided.
 * @param params.baseMode - Which mode the base represents. Defaults to `'light'`.
 * @param params.base - Base theme to extend. Defaults to `extends.base` or `baseTheme`.
 * @param params.overrides - Brand overrides applied to the base theme.
 * @param params.alternate - Semantic remapping overrides for the opposite color mode.
 *   Defaults to `darkAlternate` (built-in dark mode) when neither `alternate` nor
 *   `extends` is provided. Inherits from `extends.alternate` when `extends` is given.
 *   Pass `null` to explicitly opt out of any alternate (single-mode theme).
 *   Core tokens are immutable — only semantic references change between modes.
 *
 * @example
 * ```ts
 * // Path A — default foundation (light base + dark alternate included)
 * const myTheme = createTheme();
 * <ThemeProvider theme={myTheme} />
 *
 * // Path B — custom brand overrides (dark mode still included)
 * const myTheme = createTheme({
 *   overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
 * });
 *
 * // Path C — custom semantic dark alternate
 * const myTheme = createTheme({
 *   overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
 *   alternate: {
 *     semantic: {
 *       colors: { content: { primary: { background: { default: '{core.colors.neutral.900}' } } } },
 *     },
 *   },
 * });
 *
 * // Path D — single-mode theme (no dark alternate)
 * const myTheme = createTheme({ alternate: null });
 * ```
 */
export const createTheme = ({
  extends: parentBundle,
  baseMode,
  base,
  overrides,
  alternate,
  icons,
}: {
  /**
   * Parent bundle to inherit from. `base`, `baseMode`, and `alternate` all
   * default to the parent's values — including dark-mode inheritance.
   *
   * `extends` is a reserved word in JS — destructured as `parentBundle`
   * in the implementation.
   */
  extends?: ThemeBundle;
  /** Which mode the base represents. Defaults to `extends.baseMode` or `'light'`. */
  baseMode?: 'light' | 'dark';
  /** Base theme to extend. Defaults to `extends.base` or `baseTheme`. */
  base?: ThemeTokensV2;
  /** Brand overrides applied to the base theme. */
  overrides?: DeepPartial<ThemeTokensV2>;
  /**
   * Semantic remapping overrides for the opposite mode.
   * Defaults to `darkAlternate` when not provided (and no `extends`).
   * Pass `null` to opt out of any alternate (single-mode theme).
   */
  alternate?: ModeOverride | null;
  /**
   * Glyph mapping for all canonical icon intents.
   * Defaults to `parentBundle.icons` when `extends` is provided,
   * or to `baseIcons` (via baseBundle) when neither is given.
   * Pass a full `IconGlyphMap` to replace the mapping entirely.
   */
  icons?: IconGlyphMap;
} = {}): ThemeBundle => {
  const resolvedBase = base ?? parentBundle?.base;
  const resolvedBaseMode = baseMode ?? parentBundle?.baseMode ?? 'light';
  const resolvedAlternate =
    alternate === null
      ? undefined
      : alternate !== undefined
        ? alternate
        : (parentBundle?.alternate ?? darkAlternate);
  const resolvedIcons = icons ?? parentBundle?.icons ?? baseIcons;

  return {
    baseMode: resolvedBaseMode,
    base: buildTheme({ base: resolvedBase, overrides }),
    alternate: resolvedAlternate,
    icons: resolvedIcons,
  };
};
