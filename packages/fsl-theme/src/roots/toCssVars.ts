import type { ThemeBundle, ThemeTokens } from '../Types';
import {
  COMPOUND_REF_RE,
  deepMerge,
  flattenObject,
  flattenTheme,
  SAFE_ID_RE,
} from './helpers';
import { CSS_PATH_PREFIXES } from './tokenRegistry';

// ---------------------------------------------------------------------------
// CSS custom property name mapping
// ---------------------------------------------------------------------------

/**
 * Convert a full token path to a CSS custom property name.
 *
 * `core.colors.brand.500` → `--tt-core-colors-brand-500`
 * `semantic.colors.action.primary.background.default` → `--tt-colors-action-primary-background-default`
 */
export const toCssVarName = (tokenPath: string): string => {
  for (const [prefix, cssPrefix] of CSS_PATH_PREFIXES) {
    if (tokenPath.startsWith(prefix)) {
      const rest = tokenPath.slice(prefix.length).replace(/\./g, '-');
      return `${cssPrefix}${rest}`;
    }
  }
  // Unregistered path fallback. Semantic extensions drop the `semantic.`
  // segment so custom families follow the same convention as registered ones
  // (`semantic.chart.grid` → `--tt-chart-grid`, like `semantic.colors.*` →
  // `--tt-colors-*`). Core extensions keep their `core-` segment.
  // `assertDistinctCssVars` guards against collisions in dev.
  const path = tokenPath.startsWith('semantic.')
    ? tokenPath.slice('semantic.'.length)
    : tokenPath;
  return `--tt-${path.replace(/\./g, '-')}`;
};

/**
 * Replace all embedded `{token.path}` refs inside a raw string with `var(--tt-...)` references.
 *
 * Handles compound semantic values like:
 *   `clamp({core.spacing.4}, {core.spacing.6}, {core.spacing.12})`
 *   → `clamp(var(--tt-core-spacing-4), var(--tt-core-spacing-6), var(--tt-core-spacing-12))`
 */
export const inlineRefsToVars = (value: string): string => {
  return value.replace(COMPOUND_REF_RE, (_match, path) => {
    return `var(${toCssVarName(path)})`;
  });
};

// ---------------------------------------------------------------------------
// Build CSS vars record
// ---------------------------------------------------------------------------

/**
 * Assert that no two token paths collapse to the same CSS custom property name.
 *
 * `toCssVarName` is first-match-wins with no duplicate detection, so two
 * distinct token paths sharing a `cssPrefix` (e.g. a future
 * `semantic.dataviz.color.state.*` vs `semantic.dataviz.geo.state.*`) could
 * silently overwrite each other in the flat record. This guards the whole
 * registry, not just dataviz.
 *
 * **DEV-only** — callers gate this behind `process.env.NODE_ENV !== 'production'`
 * so bundlers tree-shake the entire call in production builds.
 */
export const assertDistinctCssVars = (
  flat: Record<string, string | number>
): void => {
  const byVarName = new Map<string, string>();
  for (const path of Object.keys(flat)) {
    const varName = toCssVarName(path);
    const existing = byVarName.get(varName);
    if (existing !== undefined && existing !== path) {
      throw new Error(
        `[fsl-theme] CSS variable name collision: '${varName}' is produced by ` +
          `both '${existing}' and '${path}'. Give one of them a distinct token ` +
          `path or CSS prefix (see roots/tokenRegistry.ts).`
      );
    }
    byVarName.set(varName, path);
  }
};

/**
 * Build a flat CSS custom properties record from a ThemeTokens.
 *
 * Core tokens get raw values. Semantic tokens get `var()` references
 * to preserve the cascade relationship at runtime.
 */
const buildCssVars = (theme: ThemeTokens): Record<string, string | number> => {
  const vars: Record<string, string | number> = {};

  const { core: coreFlat, semantic: semanticFlat } = flattenTheme(theme);
  for (const [path, value] of Object.entries(coreFlat)) {
    vars[toCssVarName(path)] = value;
  }

  for (const [path, value] of Object.entries(semanticFlat)) {
    const varName = toCssVarName(path);
    if (typeof value === 'string' && value.includes('{')) {
      // Handles both pure refs ({core.spacing.4}) and mixed expressions
      // (clamp({core.spacing.4}, {core.spacing.6}, {core.spacing.12}))
      vars[varName] = inlineRefsToVars(value);
    } else {
      vars[varName] = value;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    assertDistinctCssVars({ ...coreFlat, ...semanticFlat });
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
   * All durations are set to `var(--tt-core-motion-duration-none)` (0ms).
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
    // Canonical 1-theme model: base → :root, alternate → :root[data-tt-mode="dark"]
    return mode ? `:root[data-tt-mode="${mode}"]` : ':root';
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

/** Matches container query length units: cqi, cqb, cqw, cqh, cqmin, cqmax */
const CQ_UNIT_RE = /cq(?:i|b|w|h|min|max)(?![a-z])/i;

/** Check if a CSS value contains container query units. */
export const hasCqUnits = (value: string | number): boolean => {
  return typeof value === 'string' && CQ_UNIT_RE.test(value);
};

/**
 * Replace container query units with viewport-safe equivalents.
 *
 * cqi → vw, cqb → vh, cqw → vw, cqh → vh, cqmin → vmin, cqmax → vmax
 */
export const toViewportFallback = (value: string): string => {
  return value
    .replace(/cqmin(?![a-z])/gi, 'vmin')
    .replace(/cqmax(?![a-z])/gi, 'vmax')
    .replace(/cqi(?![a-z])/gi, 'vw')
    .replace(/cqb(?![a-z])/gi, 'vh')
    .replace(/cqw(?![a-z])/gi, 'vw')
    .replace(/cqh(?![a-z])/gi, 'vh');
};

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
 * Sets all semantic motion duration vars to `var(--tt-core-motion-duration-none)` (0ms).
 * Emitted inside `@media (prefers-reduced-motion: reduce)`.
 */
const buildReducedMotionVars = (theme: ThemeTokens): Record<string, string> => {
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
 *
 * `hit` is a single floor per pointer profile: the coarse override maps
 * `semantic.sizing.hit` to `core.sizing.hit.coarse`.
 */
const buildCoarseHitVars = (theme: ThemeTokens): Record<string, string> => {
  return {
    [toCssVarName('semantic.sizing.hit')]: theme.core.sizing.hit.coarse,
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
  containerQueryVars,
  coarseHitVars,
  reducedMotionVars,
  colorScheme,
}: {
  selector: string;
  vars: Record<string, string | number>;
  containerQueryVars: Record<string, string | number>;
  coarseHitVars: Record<string, string>;
  reducedMotionVars: Record<string, string>;
  colorScheme?: string;
}): string => {
  // Local helpers — capture `selector` from closure, only used here.

  /** Maps a vars record to indented CSS declaration lines (4-space, for nested at-rule blocks). */
  const varLines = (v: Record<string, string | number>): string[] => {
    return Object.entries(v).map(([name, val]) => {
      return `    ${name}: ${val};`;
    });
  };

  /** Builds a complete at-rule block, or empty string if the vars record is empty. */
  const atRuleBlock = (
    atRule: string,
    v: Record<string, string | number>
  ): string => {
    const lines = varLines(v);
    return lines.length > 0
      ? `${atRule} {\n  ${selector} {\n${lines.join('\n')}\n  }\n}`
      : '';
  };

  const baseLines: string[] = [];

  if (colorScheme) {
    baseLines.push(`  color-scheme: ${colorScheme};`);
  }

  for (const [name, value] of Object.entries(vars)) {
    // Emit viewport-safe fallback for CQ vars in the base block
    if (hasCqUnits(value)) {
      baseLines.push(`  ${name}: ${toViewportFallback(String(value))};`);
    } else {
      baseLines.push(`  ${name}: ${value};`);
    }
  }

  const baseBlock = `${selector} {\n${baseLines.join('\n')}\n}`;

  // Container query progressive enhancement — appended to baseBlock (not joined separately)
  const cqContent = atRuleBlock('@supports (width: 1cqi)', containerQueryVars);
  const cqBlock = cqContent ? `\n\n${cqContent}` : '';

  const coarseBlock = atRuleBlock(
    '@media (any-pointer: coarse)',
    coarseHitVars
  );
  const reducedMotionBlock = atRuleBlock(
    '@media (prefers-reduced-motion: reduce)',
    reducedMotionVars
  );

  return [baseBlock + cqBlock, coarseBlock, reducedMotionBlock]
    .filter(Boolean)
    .join('\n\n');
};

// ---------------------------------------------------------------------------
// toCssVars
// ---------------------------------------------------------------------------

/**
 * Internal: convert a single `ThemeTokens` into CSS custom properties.
 * Use the public overloaded `toCssVars()` instead.
 */
const toCssVarsBase = (
  theme: ThemeTokens,
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
    toCssString: () => {
      return buildCssBlock({
        selector,
        vars: cssVars,
        containerQueryVars,
        coarseHitVars,
        reducedMotionVars,
        colorScheme: effectiveColorScheme,
      });
    },
  };
};

// ---------------------------------------------------------------------------
// Bundle support — generates base + alternate mode CSS blocks
// ---------------------------------------------------------------------------

/** Type guard: checks if the input is a ThemeBundle. */
export const isThemeBundle = (
  input: ThemeTokens | ThemeBundle
): input is ThemeBundle => {
  return 'baseMode' in input && 'base' in input;
};

/**
 * Options for `bundleToCssVars()`.
 */
export interface BundleCssVarsOptions {
  /**
   * Theme identifier for scoping. Generates `[data-tt-theme="<themeId>"]` selectors.
   * When omitted, CSS targets `:root` (canonical 1-theme model). The alternate mode
   * selector becomes `:root[data-tt-mode="dark"]`. Use `themeId` only for
   * multi-theme scenarios (Storybook, micro-frontends).
   */
  themeId?: string;
  /**
   * Emit the `@media (prefers-color-scheme)` fallback block so the OS
   * preference applies before JS runs (and without JS). Only meaningful for
   * themeId-less bundles. Default `true`.
   *
   * Set `false` when the app is deliberately single-default (`defaultMode`
   * `'light'` or `'dark'` with the alternate reachable only via explicit
   * toggle) — otherwise dark-OS users would get the alternate on first paint
   * against the app's configured default. `<ThemeProvider>` / `<ThemeHead>`
   * derive this automatically from their `defaultMode` prop.
   */
  systemModeFallback?: boolean;
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
 * Build the no-JS / pre-hydration system-mode fallback block.
 *
 * Canonical 1-theme model only (no `themeId`): before the runtime (or the SSR
 * bootstrap script) stamps `data-tt-mode`, and for users with JavaScript
 * disabled, the alternate mode would otherwise never apply. This block scopes
 * the alternate diff vars to `@media (prefers-color-scheme: <mode>)` behind
 * `:root:not([data-tt-mode])`, so it applies exactly while no explicit mode
 * attribute exists and gets out of the way the moment the runtime writes one
 * (persisted user choice always wins over the OS preference).
 */
const buildSystemModeFallbackBlock = ({
  mode,
  vars,
}: {
  mode: 'light' | 'dark';
  vars: Record<string, string | number>;
}): string => {
  // Callers only invoke this with a non-empty diff (guarded at the call site).
  const entries = Object.entries(vars);
  const selector = ':root:not([data-tt-mode])';
  const lines = entries.map(([name, value]) => {
    const val = hasCqUnits(value) ? toViewportFallback(String(value)) : value;
    return `    ${name}: ${val};`;
  });

  const cqEntries = entries.filter(([, value]) => {
    return hasCqUnits(value);
  });
  const cqBlock =
    cqEntries.length > 0
      ? `\n\n  @supports (width: 1cqi) {\n  ${selector} {\n${cqEntries
          .map(([name, value]) => {
            return `      ${name}: ${value};`;
          })
          .join('\n')}\n  }\n  }`
      : '';

  return `@media (prefers-color-scheme: ${mode}) {\n  ${selector} {\n    color-scheme: ${mode};\n${lines.join(
    '\n'
  )}\n  }${cqBlock}\n}`;
};

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
 * import { toCssVars } from '@ttoss/fsl-theme/css';
 * import { createTheme } from '@ttoss/fsl-theme';
 *
 * const myBundle = createTheme();
 * const css = toCssVars(myBundle, { themeId: 'default' }).toCssString();
 * // → base block (all vars) + dark block (only changed vars) + coarse block
 * ```
 */
const bundleToCssVars = (
  bundle: ThemeBundle,
  options: BundleCssVarsOptions
): BundleCssVarsResult => {
  const { themeId, systemModeFallback = true } = options;
  const { baseMode, base: baseTheme, alternate } = bundle;
  const alternateMode: 'light' | 'dark' =
    baseMode === 'light' ? 'dark' : 'light';

  // Base: full CSS vars
  const baseResult = toCssVarsBase(baseTheme, {
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

  // Alternate: core is immutable across modes — only semantic refs are remapped.
  // This construction makes the invariant explicit in code: core is copied as-is,
  // and deepMerge is scoped to the semantic layer only (one narrower cast instead
  // of two casts through the full ThemeTokens shape).
  const alternateTheme: ThemeTokens = {
    core: baseTheme.core,
    semantic: deepMerge(
      baseTheme.semantic,
      alternate.semantic
    ) as ThemeTokens['semantic'],
  };
  const fullAlternateVars = buildCssVars(alternateTheme);
  const diffVars = diffCssVars({
    base: baseResult.cssVars,
    full: fullAlternateVars,
  });

  const alternateSelector = buildSelector({
    themeId,
    mode: alternateMode,
  });

  // core is immutable in ModeOverride (only semantic? is allowed) — coarse hit
  // targets are structurally guaranteed identical across modes. The alternate
  // block is diff-only (like cssVars), so coarse is not repeated here.
  const altCoarseHitVars: Record<string, string> = {};
  // Reduced-motion: emit only entries that actually differ from the base so the
  // block is omitted when semantic.motion is not overridden in the alternate.
  // cast is safe: reducedMotionVars values are always var() strings
  const altReducedMotionVars = diffCssVars({
    base: baseResult.reducedMotionVars,
    full: buildReducedMotionVars(alternateTheme),
  }) as Record<string, string>;
  const altContainerQueryVars = extractContainerQueryVars(diffVars);

  const alternateResult: CssVarsResult = {
    cssVars: diffVars,
    coarseHitVars: altCoarseHitVars,
    reducedMotionVars: altReducedMotionVars,
    containerQueryVars: altContainerQueryVars,
    selector: alternateSelector,
    toCssString: () => {
      return buildCssBlock({
        selector: alternateSelector,
        vars: diffVars,
        containerQueryVars: altContainerQueryVars,
        coarseHitVars: altCoarseHitVars,
        reducedMotionVars: altReducedMotionVars,
        colorScheme: alternateMode,
      });
    },
  };

  return {
    base: baseResult,
    alternate: alternateResult,
    toCssString: () => {
      const parts = [baseResult.toCssString()];
      if (Object.keys(diffVars).length > 0) {
        parts.push(alternateResult.toCssString());
        // Canonical 1-theme model: honor the OS preference before JS runs
        // (and when JS never runs). Multi-theme (themeId) scoping is
        // runtime-managed, so the fallback is emitted only for `:root` —
        // and only when the app follows the OS (`systemModeFallback`).
        if (!themeId && systemModeFallback) {
          parts.push(
            buildSystemModeFallbackBlock({
              mode: alternateMode,
              vars: diffVars,
            })
          );
        }
      }
      return parts.join('\n\n');
    },
  };
};

// ---------------------------------------------------------------------------
// Public overloaded `toCssVars`
// ---------------------------------------------------------------------------

/**
 * Convert a theme (tokens or bundle) into CSS custom properties.
 *
 * **Overload 1 — ThemeTokens**: returns a single `CssVarsResult`.
 * **Overload 2 — ThemeBundle**: returns a `BundleCssVarsResult` with
 * base + alternate blocks and optimized diff output.
 *
 * @example
 * ```ts
 * import { toCssVars } from '@ttoss/fsl-theme/css';
 * import { createTheme } from '@ttoss/fsl-theme';
 *
 * const myBundle = createTheme();
 *
 * // Single theme tokens
 * const css = toCssVars(myBundle.base).toCssString();
 *
 * // Full bundle (base + dark alternate)
 * const bundleCss = toCssVars(myBundle, { themeId: 'default' }).toCssString();
 * ```
 */
export function toCssVars(
  theme: ThemeTokens,
  options?: CssVarsOptions
): CssVarsResult;
export function toCssVars(
  bundle: ThemeBundle,
  options?: BundleCssVarsOptions
): BundleCssVarsResult;
export function toCssVars(
  input: ThemeTokens | ThemeBundle,
  options?: CssVarsOptions | BundleCssVarsOptions
): CssVarsResult | BundleCssVarsResult {
  if (isThemeBundle(input)) {
    return bundleToCssVars(input, (options ?? {}) as BundleCssVarsOptions);
  }
  return toCssVarsBase(input, options as CssVarsOptions);
}
