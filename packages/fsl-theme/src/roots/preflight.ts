// ---------------------------------------------------------------------------
// Preflight — the theme's base stylesheet
//
// A design system ships not only token *values* but the minimal base layer
// that binds them to the document: a box-sizing reset, the body's default
// typography/colour drawn from the semantic tokens, and the global
// reduced-motion guard. Apps inject this once (via `<ThemeReset />` or
// `getPreflightStyles()`) instead of hand-writing resets — the base is the
// theme's responsibility, not every app's.
//
// It is intentionally minimal and layout-agnostic: no widths, heights, or
// component styling (those are `@ttoss/fsl-ui`'s and the app's job). Every
// value is a `var(--tt-*)` read, so the base re-themes with the tokens.
// ---------------------------------------------------------------------------

/**
 * The theme's base stylesheet as a raw CSS string — box-sizing reset, body
 * typography/colour bound to semantic tokens, and the reduced-motion guard.
 * Inject once at the app root. Requires the `--tt-*` custom properties to be
 * present (via `getThemeStylesContent` / `<ThemeStyles>` / `<ThemeProvider>`).
 */
export const PREFLIGHT_CSS = `*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--tt-text-body-md-font-family, system-ui, sans-serif);
  font-size: var(--tt-text-body-md-font-size);
  line-height: var(--tt-text-body-md-line-height);
  color: var(--tt-colors-informational-primary-text-default);
  background-color: var(--tt-colors-informational-primary-background-default);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`;

/**
 * Returns the theme's base stylesheet — see {@link PREFLIGHT_CSS}. A function
 * for API symmetry with `getThemeStylesContent`; the value is static.
 *
 * @example
 * ```ts
 * import { getPreflightStyles } from '@ttoss/fsl-theme/css';
 * res.type('text/css').send(getPreflightStyles());
 * ```
 */
export const getPreflightStyles = (): string => {
  return PREFLIGHT_CSS;
};
