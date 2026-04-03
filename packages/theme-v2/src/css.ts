// ---------------------------------------------------------------------------
// @ttoss/theme2/css — Build-time token utilities
//
// Two groups of tools, all operating on theme tokens at build/config time:
//
//   CSS generation      toCssVars, toCssVarName, getThemeStylesContent
//   Token flattening    toFlatTokens, FlatTokenMap
// ---------------------------------------------------------------------------

import { toCssVars } from './roots/toCssVars';
import type { ThemeBundle } from './Types';

export { type FlatTokenMap, toFlatTokens } from './roots/helpers';
export {
  type BundleCssVarsOptions,
  type BundleCssVarsResult,
  type CssVarsOptions,
  type CssVarsResult,
  toCssVarName,
  toCssVars,
} from './roots/toCssVars';

/**
 * Returns the full CSS string for a theme bundle — all `--tt-*` custom
 * properties, coarse-pointer overrides, reduced-motion overrides, and
 * container query progressive enhancement — ready to inject into a
 * `<style>` tag or serve as a static `.css` file.
 *
 * Symmetric counterpart to `getThemeScriptContent()` for CSS.
 * Use `<ThemeStyles>` from `@ttoss/theme2/react` for React apps.
 *
 * When `themeId` is omitted (canonical 1-theme model), CSS targets `:root` and
 * the alternate mode selector becomes `:root[data-tt-mode="dark"]`. Pass
 * `themeId` only for multi-theme scenarios (Storybook, micro-frontends).
 *
 * @example
 * ```ts
 * // Canonical: no themeId needed (CSS goes to :root)
 * import { createTheme } from '@ttoss/theme2';
 * import { getThemeStylesContent } from '@ttoss/theme2/css';
 *
 * const myBundle = createTheme();
 *
 * app.get('/theme.css', (_, res) => {
 *   res.type('text/css').send(getThemeStylesContent(myBundle));
 * });
 *
 * // Multi-theme: explicit themeId for scoping
 * res.type('text/css').send(getThemeStylesContent(myBundle, 'myTheme'));
 * ```
 */
export const getThemeStylesContent = (
  bundle: ThemeBundle,
  themeId?: string
): string => {
  return toCssVars(bundle, { themeId }).toCssString();
};
