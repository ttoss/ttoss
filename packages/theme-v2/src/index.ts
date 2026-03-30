export { createTheme, createThemeBundle } from './createTheme';
export type {
  DeepPartial,
  SemanticModeOverride,
  ThemeBundle,
  ThemeTokensV2,
} from './Types';

// React — re-export SemanticTokens type for consumers who don't import from react entry
// The full React API (ThemeProvider, useTokens, useTheme) lives in the '/react' entry point.
export type { SemanticTokens } from './react';

// Themes
export {
  aurora,
  auroraBundle,
  bruttal,
  bruttalBundle,
  bundles,
  defaultBundle,
  defaultTheme,
  neon,
  neonBundle,
  oca,
  ocaBundle,
  terra,
  terraBundle,
  themes,
} from './themes';

// Roots
export { type FlatTokenMap, toFlatTokens } from './roots/helpers';
export {
  type BundleCssVarsOptions,
  type BundleCssVarsResult,
  bundleToCssVars,
  type CssVarsOptions,
  type CssVarsResult,
  toCssVars,
} from './roots/toCssVars';
export { type DTCGToken, type DTCGTokenTree, toDTCG } from './roots/toDTCG';
export {
  type DeprecationValidationResult,
  validateDeprecations,
} from './roots/validateDeprecations';

// Runtime
export {
  createThemeRuntime,
  DATA_MODE_ATTR,
  DATA_THEME_ATTR,
  DEFAULT_STORAGE_KEY,
  type ResolvedMode,
  type ThemeMode,
  type ThemeRuntime,
  type ThemeRuntimeConfig,
  type ThemeState,
  VALID_MODES,
} from './runtime';

// SSR
export { getThemeScriptContent, type ThemeScriptConfig } from './ssrScript';
