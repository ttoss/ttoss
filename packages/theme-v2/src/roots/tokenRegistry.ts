// ---------------------------------------------------------------------------
// Token Path Registry — single source of truth for path → CSS / DTCG mapping
//
// Both toCssVars.ts and toDTCG.ts derive their lookup tables from this
// registry. Adding a new token family here propagates to both consumers.
//
// Order matters: entries MUST be sorted from most specific (longest prefix)
// to least specific within each group. The first match wins.
// ---------------------------------------------------------------------------

export interface TokenPathEntry {
  /** Token path prefix (e.g. `'core.colors.'`). */
  path: string;
  /** CSS custom property prefix (e.g. `'--tt-color-'`). */
  cssPrefix: string;
  /** W3C DTCG `$type` value (e.g. `'color'`). */
  dtcgType: string;
}

/**
 * Ordered registry of token path prefixes → CSS var prefix + DTCG type.
 *
 * Longer (more specific) prefixes come first so that consumers using
 * first-match lookup get the correct result.
 */
export const TOKEN_PATH_REGISTRY: readonly TokenPathEntry[] = [
  // -- Core dataviz (longer/more-specific entries first) --------------------
  {
    path: 'core.dataviz.color.',
    cssPrefix: '--tt-dataviz-color-raw-',
    dtcgType: 'color',
  },
  {
    path: 'core.dataviz.opacity.',
    cssPrefix: '--tt-dataviz-raw-',
    dtcgType: 'number',
  },
  { path: 'core.dataviz.', cssPrefix: '--tt-dataviz-raw-', dtcgType: 'string' },

  // -- Semantic dataviz (longer/more-specific entries first) ----------------
  {
    path: 'semantic.dataviz.color.',
    cssPrefix: '--tt-dataviz-',
    dtcgType: 'color',
  },
  {
    path: 'semantic.dataviz.encoding.opacity.',
    cssPrefix: '--tt-dataviz-',
    dtcgType: 'number',
  },
  {
    path: 'semantic.dataviz.geo.',
    cssPrefix: '--tt-dataviz-',
    dtcgType: 'color',
  },
  {
    path: 'semantic.dataviz.encoding.',
    cssPrefix: '--tt-dataviz-',
    dtcgType: 'string',
  },
  { path: 'semantic.dataviz.', cssPrefix: '--tt-dataviz-', dtcgType: 'string' },

  // -- Core paths -----------------------------------------------------------
  { path: 'core.colors.', cssPrefix: '--tt-color-', dtcgType: 'color' },
  {
    path: 'core.elevation.dark.',
    cssPrefix: '--tt-shadow-dark-',
    dtcgType: 'shadow',
  },
  {
    path: 'core.elevation.level.',
    cssPrefix: '--tt-shadow-',
    dtcgType: 'shadow',
  },
  {
    path: 'core.font.family.',
    cssPrefix: '--tt-font-',
    dtcgType: 'fontFamily',
  },
  {
    path: 'core.font.weight.',
    cssPrefix: '--tt-font-weight-',
    dtcgType: 'fontWeight',
  },
  {
    path: 'core.font.leading.',
    cssPrefix: '--tt-line-height-',
    dtcgType: 'number',
  },
  {
    path: 'core.font.tracking.',
    cssPrefix: '--tt-letter-spacing-',
    dtcgType: 'dimension',
  },
  {
    path: 'core.font.opticalSizing.',
    cssPrefix: '--tt-font-optical-sizing-',
    dtcgType: 'string',
  },
  {
    path: 'core.font.numeric.',
    cssPrefix: '--tt-font-variant-numeric-',
    dtcgType: 'string',
  },
  {
    path: 'core.type.ramp.',
    cssPrefix: '--tt-font-size-',
    dtcgType: 'dimension',
  },
  { path: 'core.space.', cssPrefix: '--tt-space-', dtcgType: 'dimension' },
  { path: 'core.size.', cssPrefix: '--tt-size-', dtcgType: 'dimension' },
  { path: 'core.radii.', cssPrefix: '--tt-radii-', dtcgType: 'dimension' },
  {
    path: 'core.border.width.',
    cssPrefix: '--tt-border-width-',
    dtcgType: 'dimension',
  },
  {
    path: 'core.border.style.',
    cssPrefix: '--tt-border-style-',
    dtcgType: 'string',
  },
  { path: 'core.opacity.', cssPrefix: '--tt-opacity-', dtcgType: 'number' },
  {
    path: 'core.motion.duration.',
    cssPrefix: '--tt-duration-',
    dtcgType: 'duration',
  },
  {
    path: 'core.motion.easing.',
    cssPrefix: '--tt-easing-',
    dtcgType: 'string',
  },
  {
    path: 'core.zIndex.level.',
    cssPrefix: '--tt-z-index-level-',
    dtcgType: 'number',
  },
  {
    path: 'core.breakpoint.',
    cssPrefix: '--tt-breakpoint-',
    dtcgType: 'dimension',
  },

  // -- Semantic paths -------------------------------------------------------
  { path: 'semantic.colors.', cssPrefix: '--tt-', dtcgType: 'color' },
  {
    path: 'semantic.elevation.',
    cssPrefix: '--tt-elevation-',
    dtcgType: 'shadow',
  },
  { path: 'semantic.text.', cssPrefix: '--tt-text-', dtcgType: 'string' },
  {
    path: 'semantic.spacing.',
    cssPrefix: '--tt-spacing-',
    dtcgType: 'dimension',
  },
  {
    path: 'semantic.sizing.',
    cssPrefix: '--tt-sizing-',
    dtcgType: 'dimension',
  },
  {
    path: 'semantic.radii.',
    cssPrefix: '--tt-radii-semantic-',
    dtcgType: 'dimension',
  },
  { path: 'semantic.focus.', cssPrefix: '--tt-focus-', dtcgType: 'string' },
  { path: 'semantic.border.', cssPrefix: '--tt-border-', dtcgType: 'string' },
  {
    path: 'semantic.opacity.',
    cssPrefix: '--tt-opacity-semantic-',
    dtcgType: 'number',
  },
  { path: 'semantic.motion.', cssPrefix: '--tt-motion-', dtcgType: 'string' },
  {
    path: 'semantic.zIndex.layer.',
    cssPrefix: '--tt-z-index-',
    dtcgType: 'number',
  },
];

/** Derived lookup table: `[path, cssPrefix]` pairs. */
export const CSS_PATH_PREFIXES: [string, string][] = TOKEN_PATH_REGISTRY.map(
  (e) => {
    return [e.path, e.cssPrefix];
  }
);

/** Derived lookup table: `[path, dtcgType]` pairs. */
export const DTCG_TYPE_PREFIXES: [string, string][] = TOKEN_PATH_REGISTRY.map(
  (e) => {
    return [e.path, e.dtcgType];
  }
);
