import type { ThemeTokensV2 } from '../ThemeTokensTemplate';
import { buildCssVars, flattenObject, toCssVarName } from './helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Return type of `toTailwindTheme()`.
 *
 * - `cssVars`: flat map of CSS custom property names → values.
 * - `config`: Tailwind-compatible theme config referencing the CSS vars.
 * - `toCssString()`: generates a `:root { ... }` CSS string for injection.
 */
export interface TailwindThemeConfig {
  cssVars: Record<string, string | number>;
  config: {
    colors: Record<string, string>;
    spacing: Record<string, string>;
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
    letterSpacing: Record<string, string>;
    borderRadius: Record<string, string>;
    boxShadow: Record<string, string>;
    opacity: Record<string, string>;
    zIndex: Record<string, string>;
    screens: Record<string, string>;
    transitionDuration: Record<string, string>;
    transitionTimingFunction: Record<string, string>;
  };
  toCssString: () => string;
}

// ---------------------------------------------------------------------------
// Config builder helpers
//
// Build Tailwind config objects where each value references the CSS var.
// ---------------------------------------------------------------------------

const buildConfigSection = (
  obj: Record<string, unknown>,
  tokenPathPrefix: string
): Record<string, string> => {
  const flat = flattenObject(obj);
  const result: Record<string, string> = {};

  for (const path of Object.keys(flat)) {
    const fullPath = `${tokenPathPrefix}.${path}`;
    const varName = toCssVarName(fullPath);
    const configKey = path.replace(/\./g, '-');
    result[configKey] = `var(${varName})`;
  }

  return result;
};

// ---------------------------------------------------------------------------
// toTailwindTheme
// ---------------------------------------------------------------------------

/**
 * Convert a `ThemeTokensV2` into CSS custom properties and a Tailwind config.
 *
 * @example
 * ```ts
 * import { themes, toTailwindTheme } from '@ttoss/theme2';
 *
 * const tw = toTailwindTheme(themes.default);
 * // Inject CSS: tw.toCssString()
 * // Use config: tw.config.colors['brand-main']
 * ```
 */
export const toTailwindTheme = (theme: ThemeTokensV2): TailwindThemeConfig => {
  const cssVars = buildCssVars(theme);

  const config = {
    colors: buildConfigSection(
      theme.core.colors as unknown as Record<string, unknown>,
      'core.colors'
    ),
    spacing: buildConfigSection(
      theme.core.space as unknown as Record<string, unknown>,
      'core.space'
    ),
    fontFamily: buildConfigSection(
      theme.core.font.family as unknown as Record<string, unknown>,
      'core.font.family'
    ),
    fontSize: buildConfigSection(
      theme.core.type.ramp as unknown as Record<string, unknown>,
      'core.type.ramp'
    ),
    fontWeight: buildConfigSection(
      theme.core.font.weight as unknown as Record<string, unknown>,
      'core.font.weight'
    ),
    lineHeight: buildConfigSection(
      theme.core.font.leading as unknown as Record<string, unknown>,
      'core.font.leading'
    ),
    letterSpacing: buildConfigSection(
      theme.core.font.tracking as unknown as Record<string, unknown>,
      'core.font.tracking'
    ),
    borderRadius: buildConfigSection(
      theme.core.radii as unknown as Record<string, unknown>,
      'core.radii'
    ),
    boxShadow: buildConfigSection(
      theme.core.elevation.level as unknown as Record<string, unknown>,
      'core.elevation.level'
    ),
    opacity: buildConfigSection(
      theme.core.opacity as unknown as Record<string, unknown>,
      'core.opacity'
    ),
    zIndex: buildConfigSection(
      theme.core.zIndex as unknown as Record<string, unknown>,
      'core.zIndex'
    ),
    screens: { ...theme.core.breakpoints },
    transitionDuration: buildConfigSection(
      theme.core.motion.duration as unknown as Record<string, unknown>,
      'core.motion.duration'
    ),
    transitionTimingFunction: buildConfigSection(
      theme.core.motion.easing as unknown as Record<string, unknown>,
      'core.motion.easing'
    ),
  };

  const toCssString = (): string => {
    const lines = Object.entries(cssVars).map(([name, value]) => {
      return `  ${name}: ${value};`;
    });
    return `:root {\n${lines.join('\n')}\n}`;
  };

  return { cssVars, config, toCssString };
};
