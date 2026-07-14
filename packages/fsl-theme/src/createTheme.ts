import { baseTheme, darkAlternate } from './baseTheme';
import { deepMerge } from './roots/helpers';
import { validateRefs } from './roots/validateRefs';
import type {
  DeepPartial,
  ModeOverride,
  ThemeBrief,
  ThemeBundle,
  ThemeTokens,
} from './Types';

// ---------------------------------------------------------------------------
// buildTheme (internal)
// ---------------------------------------------------------------------------

/**
 * Deep-clone to break shared references between base and result.
 * Tokens are primitives (strings, numbers) — `structuredClone` is safe and
 * more correct than a JSON round-trip (preserves `undefined`, `NaN`, etc.).
 *
 * Falls back to a JSON round-trip when `structuredClone` is unavailable
 * (e.g. Jest's jsdom environment, older embedded runtimes) so importing the
 * package never throws at module-evaluation time. Token trees are plain
 * string/number leaves, so the fallback is lossless for valid themes.
 */
const cloneTokens = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

/**
 * DEV-only: validate the refs an alternate introduces against the built base.
 * The alternate is authored by hand (semantic-only remaps), so a typo'd
 * dark-mode ref must warn at theme creation instead of silently emitting a
 * broken CSS var in production.
 */
const validateAlternateRefs = ({
  base,
  alternate,
}: {
  base: ThemeTokens;
  alternate: ModeOverride;
}): void => {
  validateRefs({
    core: base.core,
    semantic: deepMerge(
      base.semantic,
      alternate.semantic
    ) as ThemeTokens['semantic'],
  });
};

/**
 * Creates a fully resolved `ThemeTokens` by merging partial overrides into a base.
 * Internal engine — consumers should use `createTheme` which returns `ThemeBundle`.
 *
 * @internal
 */
export const buildTheme = ({
  base = baseTheme,
  overrides = {},
}: {
  /** Base theme to extend. Defaults to `baseTheme`. */
  base?: ThemeTokens;
  /** Partial overrides applied on top of the base theme. */
  overrides?: DeepPartial<ThemeTokens>;
} = {}): ThemeTokens => {
  const merged = deepMerge(base, overrides);

  if (process.env.NODE_ENV !== 'production') {
    validateRefs(merged);
  }

  return cloneTokens(merged);
};

// ---------------------------------------------------------------------------
// createTheme
// ---------------------------------------------------------------------------

const resolveAlternate = (
  alternate: ModeOverride | null | undefined,
  parentBundle: ThemeBundle | undefined
): ModeOverride | undefined => {
  if (alternate === null) return undefined;
  if (alternate !== undefined) return alternate;
  return parentBundle?.alternate ?? darkAlternate;
};

/** Resolve every `createTheme` input against its `extends` parent + defaults. */
const resolveBundleInputs = ({
  parentBundle,
  baseMode,
  base,
  alternate,
  brief,
}: {
  parentBundle?: ThemeBundle;
  baseMode?: 'light' | 'dark';
  base?: ThemeTokens;
  alternate?: ModeOverride | null;
  brief?: ThemeBrief;
}) => {
  return {
    resolvedBase: base ?? parentBundle?.base,
    resolvedBaseMode: baseMode ?? parentBundle?.baseMode ?? 'light',
    resolvedAlternate: resolveAlternate(alternate, parentBundle),
    resolvedMeta: brief ?? parentBundle?.meta,
  };
};

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
 *       colors: { informational: { primary: { background: { default: '{core.colors.neutral.900}' } } } },
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
  brief,
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
  base?: ThemeTokens;
  /** Brand overrides applied to the base theme. */
  overrides?: DeepPartial<ThemeTokens>;
  /**
   * Semantic remapping overrides for the opposite mode.
   * Defaults to `darkAlternate` when not provided (and no `extends`).
   * Pass `null` to opt out of any alternate (single-mode theme).
   */
  alternate?: ModeOverride | null;
  /**
   * Machine-readable design brief. Inherited from `extends.meta` when omitted.
   * Orthogonal to tokens — never affects DTCG/CSS output.
   */
  brief?: ThemeBrief;
} = {}): ThemeBundle => {
  const { resolvedBase, resolvedBaseMode, resolvedAlternate, resolvedMeta } =
    resolveBundleInputs({ parentBundle, baseMode, base, alternate, brief });
  const builtBase = buildTheme({ base: resolvedBase, overrides });

  if (process.env.NODE_ENV !== 'production' && resolvedAlternate) {
    validateAlternateRefs({ base: builtBase, alternate: resolvedAlternate });
  }

  return {
    baseMode: resolvedBaseMode,
    base: builtBase,
    alternate: resolvedAlternate,
    ...(resolvedMeta ? { meta: resolvedMeta } : {}),
  };
};
