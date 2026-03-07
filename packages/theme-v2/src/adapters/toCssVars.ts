import type { ThemeTokensV2 } from '../ThemeTokensTemplate';
import { buildCssVars } from './helpers';

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
   * Differs from `mode` in that:
   *   The mode determines when/where the block applies (selector).
   *   The colorScheme determines how the browser renders native components within this block.
   *   They usually match, but they don't need to match in advanced scenarios.
   */
  colorScheme?: 'light' | 'dark' | 'light dark';
}

/**
 * Return type of `toCssVars()`.
 */
export interface CssVarsResult {
  /** Flat map of CSS custom property names → values. */
  cssVars: Record<string, string | number>;
  /** The CSS selector used for scoping. */
  selector: string;
  /** Generates a complete CSS block string. */
  toCssString: () => string;
}

// ---------------------------------------------------------------------------
// Selector builder
// ---------------------------------------------------------------------------

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

  let s = `[data-tt-theme="${themeId}"]`;
  if (mode) {
    s += `[data-tt-mode="${mode}"]`;
  }
  return s;
};

// ---------------------------------------------------------------------------
// toCssVars
// ---------------------------------------------------------------------------

/**
 * Convert a `ThemeTokensV2` into CSS custom properties scoped by data-attribute selectors.
 *
 * Designed for runtime theme switching: generate one CSS block per theme/mode
 * combination, include them all in your stylesheet, and switch themes by
 * setting `data-tt-theme` and `data-tt-mode` attributes on the root element.
 *
 * @example
 * ```ts
 * import { themes, toCssVars } from '@ttoss/theme2';
 *
 * // Default theme at :root
 * const defaultCss = toCssVars(themes.default).toCssString();
 *
 * // Scoped by theme
 * const bruttalCss = toCssVars(themes.bruttal, { themeId: 'bruttal' }).toCssString();
 *
 * // Scoped by theme + mode
 * const darkCss = toCssVars(darkTheme, {
 *   themeId: 'bruttal',
 *   mode: 'dark',
 *   colorScheme: 'dark',
 * }).toCssString();
 * ```
 */
export const toCssVars = (
  theme: ThemeTokensV2,
  options: CssVarsOptions = {}
): CssVarsResult => {
  const cssVars = buildCssVars(theme);
  const selector = buildSelector(options);
  const { colorScheme, mode } = options;
  const effectiveColorScheme = colorScheme ?? mode;

  const toCssString = (): string => {
    const lines: string[] = [];

    if (effectiveColorScheme) {
      lines.push(`  color-scheme: ${effectiveColorScheme};`);
    }

    for (const [name, value] of Object.entries(cssVars)) {
      lines.push(`  ${name}: ${value};`);
    }

    return `${selector} {\n${lines.join('\n')}\n}`;
  };

  return { cssVars, selector, toCssString };
};
