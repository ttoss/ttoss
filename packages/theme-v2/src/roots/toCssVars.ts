import type { DeepPartial } from '../Types';
import type { ThemeBundle, ThemeTokensV2 } from '../Types';
import { deepMerge, extractRefPath, flattenObject, isTokenRef } from './helpers';

// ---------------------------------------------------------------------------
// CSS custom property name mapping
//
// Maps full token paths to `--tt-` prefixed CSS variable names.
// Order matters: longer (more specific) prefixes must come first.
// ---------------------------------------------------------------------------

const CSS_PATH_PREFIXES: [string, string][] = [
  // Core dataviz paths (longer/more-specific entries first)
  // Consumer-facing semantic vars are under '--tt-dataviz-*' (semantic.dataviz.*).
  // Core primitives use '--tt-dataviz-color-raw-*' / '--tt-dataviz-raw-*' to signal
  // they are value-only and not the public consumption API.
  ['core.dataviz.color.', '--tt-dataviz-color-raw-'],
  ['core.dataviz.', '--tt-dataviz-raw-'],
  // Semantic dataviz — public consumer API: '--tt-dataviz-*'
  ['semantic.dataviz.', '--tt-dataviz-'],
  // Core paths
  ['core.colors.', '--tt-color-'],
  ['core.elevation.dark.', '--tt-shadow-dark-'],
  ['core.elevation.level.', '--tt-shadow-'],
  ['core.font.family.', '--tt-font-'],
  ['core.font.weight.', '--tt-font-weight-'],
  ['core.font.leading.', '--tt-line-height-'],
  ['core.font.tracking.', '--tt-letter-spacing-'],
  ['core.font.opticalSizing.', '--tt-font-optical-sizing-'],
  ['core.font.numeric.', '--tt-font-variant-numeric-'],
  ['core.type.ramp.', '--tt-font-size-'],
  ['core.space.', '--tt-space-'],
  ['core.size.', '--tt-size-'],
  ['core.radii.', '--tt-radii-'],
  ['core.border.width.', '--tt-border-width-'],
  ['core.border.style.', '--tt-border-style-'],
  ['core.opacity.', '--tt-opacity-'],
  ['core.motion.duration.', '--tt-duration-'],
  ['core.motion.easing.', '--tt-easing-'],
  ['core.zIndex.level.', '--tt-z-index-level-'],
  ['core.breakpoint.', '--tt-breakpoint-'],
  // Semantic paths
  ['semantic.colors.', '--tt-'],
  ['semantic.elevation.', '--tt-elevation-'],
  ['semantic.text.', '--tt-text-'],
  ['semantic.spacing.', '--tt-spacing-'],
  ['semantic.sizing.', '--tt-sizing-'],
  ['semantic.radii.', '--tt-radii-semantic-'],
  ['semantic.focus.', '--tt-focus-'],
  ['semantic.border.', '--tt-border-'],
  ['semantic.opacity.', '--tt-opacity-semantic-'],
  ['semantic.motion.', '--tt-motion-'],
  ['semantic.zIndex.layer.', '--tt-z-index-'],
];

/**
 * Convert a full token path to a CSS custom property name.
 *
 * `core.colors.brand.500` → `--tt-color-brand-500`
 * `semantic.colors.action.primary.background.default` → `--tt-action-primary-background-default`
 */
export const toCssVarName = (tokenPath: string): string => {
  for (const [prefix, cssPrefix] of CSS_PATH_PREFIXES) {
    if (tokenPath.startsWith(prefix)) {
      const rest = tokenPath.slice(prefix.length).replace(/\./g, '-');
      return `${cssPrefix}${rest}`;
    }
  }
  return `--tt-${tokenPath.replace(/\./g, '-')}`;
};

/**
 * Transform a ttoss token reference to a CSS `var()` reference.
 *
 * `{core.colors.brand.500}` → `var(--tt-color-brand-500)`
 */
const toCssVarRef = (ref: string): string => {
  const inner = extractRefPath(ref);
  const varName = toCssVarName(inner);
  return `var(${varName})`;
};

/**
 * Replace all embedded `{token.path}` refs inside a raw string with `var(--tt-...)` references.
 *
 * Handles compound semantic values like:
 *   `clamp({core.space.4}, {core.space.6}, {core.space.12})`
 *   → `clamp(var(--tt-space-4), var(--tt-space-6), var(--tt-space-12))`
 *
 * If the string is a pure `{...}` ref it delegates to `toCssVarRef` (same result).
 */
export const inlineRefsToVars = (value: string): string =>
  value.replace(/\{([^}]+)\}/g, (_match, path) => `var(${toCssVarName(path)})`);

// ---------------------------------------------------------------------------
// Build CSS vars record
// ---------------------------------------------------------------------------

/**
 * Build a flat CSS custom properties record from a ThemeTokensV2.
 *
 * Core tokens get raw values. Semantic tokens get `var()` references
 * to preserve the cascade relationship at runtime.
 */
const buildCssVars = (
  theme: ThemeTokensV2
): Record<string, string | number> => {
  const vars: Record<string, string | number> = {};

  const coreFlat = flattenObject(
    theme.core as unknown as Record<string, unknown>,
    'core'
  );
  for (const [path, value] of Object.entries(coreFlat)) {
    vars[toCssVarName(path)] = value;
  }

  const semanticFlat = flattenObject(
    theme.semantic as unknown as Record<string, unknown>,
    'semantic'
  );
  for (const [path, value] of Object.entries(semanticFlat)) {
    const varName = toCssVarName(path);
    if (typeof value === 'string' && value.includes('{')) {
      // Handles both pure refs ({core.space.4}) and mixed expressions
      // (clamp({core.space.4}, {core.space.6}, {core.space.12}))
      vars[varName] = inlineRefsToVars(value);
    } else {
      vars[varName] = value;
    }
  }

  return vars;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for `toCssVars()`.
 */
export interface CssVarsOptions {
  /**
   * Theme identifier for scoping. Generates `[data-tt-theme="<themeId>"]` selector.
   * When omitted, uses `:root`.
   */
  themeId?: string;
  /**
   * Mode for scoping. Adds `[data-tt-mode="<mode>"]` to the selector.
   * Only effective when `themeId` is also set.
   */
  mode?: 'light' | 'dark';
  /**
   * Custom CSS selector override. Takes precedence over `themeId`/`mode`.
   */
  selector?: string;
  /**
   * Sets the `color-scheme` CSS property in the generated block.
   * Helps native elements (inputs, scrollbars) respect the active mode.
   */
  colorScheme?: 'light' | 'dark' | 'light dark';
}

/**
 * Return type of `toCssVars()`.
 */
export interface CssVarsResult {
  /** Flat map of CSS custom property names → values (original, including CQ units). */
  cssVars: Record<string, string | number>;
  /**
   * Overrides for `hit.*` tokens when `any-pointer: coarse` is active.
   * Apply these inside `@media (any-pointer: coarse) { :root { ... } }`.
   * Emitted automatically by `toCssString()`.
   */
  coarseHitVars: Record<string, string>;
  /**
   * Overrides for semantic motion duration tokens under reduced-motion.
   * All durations are set to `var(--tt-duration-none)` (0ms).
   * Apply these inside `@media (prefers-reduced-motion: reduce) { :root { ... } }`.
   * Emitted automatically by `toCssString()`.
   */
  reducedMotionVars: Record<string, string>;
  /**
   * CSS vars whose values contain container query units (cqi, cqb, etc.).
   * Emitted inside `@supports (width: 1cqi)` by `toCssString()`.
   * The base block uses viewport-safe fallbacks for these vars.
   */
  containerQueryVars: Record<string, string | number>;
  /** The CSS selector used for scoping. */
  selector: string;
  /** Generates a complete CSS block string. */
  toCssString: () => string;
}

// ---------------------------------------------------------------------------
// Selector builder
// ---------------------------------------------------------------------------

/**
 * Allowed characters for a themeId: alphanumeric, hyphens, underscores.
 * Prevents CSS selector injection when interpolating into attribute selectors.
 */
const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;

const sanitizeId = (value: string): string => {
  if (!SAFE_ID_RE.test(value)) {
    throw new Error(
      `Invalid themeId "${value}". Only alphanumeric characters, hyphens, and underscores are allowed.`
    );
  }
  return value;
};

const buildSelector = ({
  themeId,
  mode,
  selector,
}: Pick<CssVarsOptions, 'themeId' | 'mode' | 'selector'>): string => {
  if (selector) {
    return selector;
  }

  if (!themeId) {
    return ':root';
  }

  let s = `[data-tt-theme="${sanitizeId(themeId)}"]`;
  if (mode) {
    s += `[data-tt-mode="${mode}"]`;
  }
  return s;
};

// ---------------------------------------------------------------------------
// Container query unit progressive enhancement
// ---------------------------------------------------------------------------

/** Matches container query length units: cqi, cqb, cqmin, cqmax */
const CQ_UNIT_RE = /cq(?:i|b|min|max)(?![a-z])/i;

/** Check if a CSS value contains container query units. */
export const hasCqUnits = (value: string | number): boolean =>
  typeof value === 'string' && CQ_UNIT_RE.test(value);

/**
 * Replace container query units with viewport-safe equivalents.
 *
 * cqi → vw, cqb → vh, cqmin → vmin, cqmax → vmax
 */
export const toViewportFallback = (value: string): string =>
  value
    .replace(/cqmin(?![a-z])/gi, 'vmin')
    .replace(/cqmax(?![a-z])/gi, 'vmax')
    .replace(/cqi(?![a-z])/gi, 'vw')
    .replace(/cqb(?![a-z])/gi, 'vh');

/**
 * Extract entries from a CSS vars record whose values contain CQ units.
 */
const extractContainerQueryVars = (
  vars: Record<string, string | number>
): Record<string, string | number> => {
  const cqVars: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(vars)) {
    if (hasCqUnits(value)) {
      cqVars[name] = value;
    }
  }
  return cqVars;
};

// ---------------------------------------------------------------------------
// Reduced-motion overrides
// ---------------------------------------------------------------------------

/**
 * Build CSS vars for reduced-motion overrides.
 *
 * Derives every `*.duration` path from the theme's `semantic.motion` structure,
 * so adding a new motion role never silently omits it from the
 * `@media (prefers-reduced-motion: reduce)` block.
 *
 * Sets all semantic motion duration vars to `var(--tt-duration-none)` (0ms).
 * Emitted inside `@media (prefers-reduced-motion: reduce)`.
 */
const buildReducedMotionVars = (theme: ThemeTokensV2): Record<string, string> => {
  const noneVar = `var(${toCssVarName('core.motion.duration.none')})`;
  const flat = flattenObject(
    theme.semantic.motion as unknown as Record<string, unknown>,
    'semantic.motion'
  );
  const vars: Record<string, string> = {};
  for (const path of Object.keys(flat)) {
    if (path.endsWith('.duration')) {
      vars[toCssVarName(path)] = noneVar;
    }
  }
  return vars;
};

// ---------------------------------------------------------------------------
// Coarse-pointer hit target overrides
// ---------------------------------------------------------------------------

/**
 * Build CSS vars for coarse-pointer hit target overrides.
 *
 * The semantic hit tokens default to fine-pointer values. This record
 * contains the coarse overrides, to be emitted inside
 * `@media (any-pointer: coarse)`.
 */
const buildCoarseHitVars = (theme: ThemeTokensV2): Record<string, string> => {
  const { hit } = theme.core.size;
  return {
    [toCssVarName('semantic.sizing.hit.min')]: hit.coarse.min,
    [toCssVarName('semantic.sizing.hit.default')]: hit.coarse.default,
    [toCssVarName('semantic.sizing.hit.prominent')]: hit.coarse.prominent,
  };
};

// ---------------------------------------------------------------------------
// buildCssBlock — single source of truth for CSS block emission
// ---------------------------------------------------------------------------

/**
 * Render a complete scoped CSS block from a vars record.
 *
 * Includes the base selector block, optional CQ `@supports` block,
 * coarse-pointer `@media` block, and reduced-motion `@media` block.
 * This is the single implementation shared by `toCssVars` and `bundleToCssVars`.
 */
const buildCssBlock = ({
  selector,
  vars,
  coarseHitVars,
  reducedMotionVars,
  colorScheme,
}: {
  selector: string;
  vars: Record<string, string | number>;
  coarseHitVars: Record<string, string>;
  reducedMotionVars: Record<string, string>;
  colorScheme?: string;
}): string => {
  const lines: string[] = [];

  if (colorScheme) {
    lines.push(`  color-scheme: ${colorScheme};`);
  }

  for (const [name, value] of Object.entries(vars)) {
    // Emit viewport-safe fallback for CQ vars in the base block
    if (hasCqUnits(value)) {
      lines.push(`  ${name}: ${toViewportFallback(String(value))};`);
    } else {
      lines.push(`  ${name}: ${value};`);
    }
  }

  const baseBlock = `${selector} {\n${lines.join('\n')}\n}`;

  // Container query progressive enhancement
  const cqVars = extractContainerQueryVars(vars);
  const cqEntries = Object.entries(cqVars);
  let cqBlock = '';
  if (cqEntries.length > 0) {
    const cqLines = cqEntries.map(([name, val]) => `    ${name}: ${val};`);
    cqBlock = `\n\n@supports (width: 1cqi) {\n  ${selector} {\n${cqLines.join('\n')}\n  }\n}`;
  }

  const coarseLines = Object.entries(coarseHitVars).map(
    ([name, val]) => `    ${name}: ${val};`
  );
  const coarseBlock = `@media (any-pointer: coarse) {\n  ${selector} {\n${coarseLines.join('\n')}\n  }\n}`;

  const reducedMotionLines = Object.entries(reducedMotionVars).map(
    ([name, val]) => `    ${name}: ${val};`
  );
  const reducedMotionBlock = `@media (prefers-reduced-motion: reduce) {\n  ${selector} {\n${reducedMotionLines.join('\n')}\n  }\n}`;

  return `${baseBlock}${cqBlock}\n\n${coarseBlock}\n\n${reducedMotionBlock}`;
};

// ---------------------------------------------------------------------------
// toCssVars
// ---------------------------------------------------------------------------

/**
 * Root 1 — CSS Custom Properties.
 *
 * Convert a `ThemeTokensV2` into CSS custom properties scoped by data-attribute selectors.
 *
 * @example
 * ```ts
 * import { themes, toCssVars } from '@ttoss/theme2';
 *
 * const defaultCss = toCssVars(themes.default).toCssString();
 * const bruttalCss = toCssVars(themes.bruttal, { themeId: 'bruttal' }).toCssString();
 * ```
 */
export const toCssVars = (
  theme: ThemeTokensV2,
  options: CssVarsOptions = {}
): CssVarsResult => {
  const cssVars = buildCssVars(theme);
  const coarseHitVars = buildCoarseHitVars(theme);
  const reducedMotionVars = buildReducedMotionVars(theme);
  const containerQueryVars = extractContainerQueryVars(cssVars);
  const selector = buildSelector(options);
  const { colorScheme, mode } = options;
  const effectiveColorScheme = colorScheme ?? mode;

  return {
    cssVars,
    coarseHitVars,
    reducedMotionVars,
    containerQueryVars,
    selector,
    toCssString: () =>
      buildCssBlock({
        selector,
        vars: cssVars,
        coarseHitVars,
        reducedMotionVars,
        colorScheme: effectiveColorScheme,
      }),
  };
};

// ---------------------------------------------------------------------------
// Bundle support — generates base + alternate mode CSS blocks
// ---------------------------------------------------------------------------

/** Type guard: checks if the input is a ThemeBundle. */
export const isThemeBundle = (
  input: ThemeTokensV2 | ThemeBundle
): input is ThemeBundle => {
  return 'baseMode' in input && 'base' in input;
};

/**
 * Options for `bundleToCssVars()`.
 */
export interface BundleCssVarsOptions {
  /** Theme identifier. Required for generating scoped selectors. */
  themeId: string;
}

/**
 * Return type of `bundleToCssVars()`.
 */
export interface BundleCssVarsResult {
  /** CSS result for the base mode (all vars). */
  base: CssVarsResult;
  /** CSS result for the alternate mode (diff-only vars). Undefined if no alternate. */
  alternate?: CssVarsResult;
  /** Generates a complete CSS string with base + alternate + coarse blocks. */
  toCssString: () => string;
}

/**
 * Compute a diff record: only entries in `full` whose values differ from `base`.
 */
const diffCssVars = ({
  base,
  full,
}: {
  base: Record<string, string | number>;
  full: Record<string, string | number>;
}): Record<string, string | number> => {
  const diff: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(full)) {
    if (base[key] !== value) {
      diff[key] = value;
    }
  }
  return diff;
};

/**
 * Convert a `ThemeBundle` into scoped CSS custom properties with optimized
 * alternate-mode output (diff-only).
 *
 * @example
 * ```ts
 * import { bundles, bundleToCssVars } from '@ttoss/theme2';
 *
 * const css = bundleToCssVars(bundles.default, { themeId: 'default' }).toCssString();
 * // → base block (all vars) + dark block (only changed vars) + coarse block
 * ```
 */
export const bundleToCssVars = (
  bundle: ThemeBundle,
  options: BundleCssVarsOptions
): BundleCssVarsResult => {
  const { themeId } = options;
  const { baseMode, base: baseTheme, alternate } = bundle;
  const alternateMode: 'light' | 'dark' =
    baseMode === 'light' ? 'dark' : 'light';

  // Base: full CSS vars
  const baseResult = toCssVars(baseTheme, {
    themeId,
    colorScheme: baseMode,
  });

  if (!alternate) {
    return {
      base: baseResult,
      toCssString: () => {
        return baseResult.toCssString();
      },
    };
  }

  // Alternate: resolve full theme by merging semantic overrides into base
  const alternateTheme = deepMerge(
    baseTheme,
    alternate as DeepPartial<ThemeTokensV2>
  ) as ThemeTokensV2;
  const fullAlternateVars = buildCssVars(alternateTheme);
  const diffVars = diffCssVars({
    base: baseResult.cssVars,
    full: fullAlternateVars,
  });

  const alternateSelector = buildSelector({
    themeId,
    mode: alternateMode,
  });

  const altCoarseHitVars = buildCoarseHitVars(alternateTheme);
  const altReducedMotionVars = buildReducedMotionVars(alternateTheme);
  const altContainerQueryVars = extractContainerQueryVars(diffVars);

  const alternateResult: CssVarsResult = {
    cssVars: diffVars,
    coarseHitVars: altCoarseHitVars,
    reducedMotionVars: altReducedMotionVars,
    containerQueryVars: altContainerQueryVars,
    selector: alternateSelector,
    toCssString: () =>
      buildCssBlock({
        selector: alternateSelector,
        vars: diffVars,
        coarseHitVars: altCoarseHitVars,
        reducedMotionVars: altReducedMotionVars,
        colorScheme: alternateMode,
      }),
  };

  return {
    base: baseResult,
    alternate: alternateResult,
    toCssString: () => {
      const parts = [baseResult.toCssString()];
      if (Object.keys(diffVars).length > 0) {
        parts.push(alternateResult.toCssString());
      }
      return parts.join('\n\n');
    },
  };
};
