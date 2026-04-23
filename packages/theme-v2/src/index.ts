// ---------------------------------------------------------------------------
// @ttoss/theme2 — Root Entry Point
//
// Core concern: theme definition (creation + types).
//
// Imports for specific concerns:
//   CSS generation  → '@ttoss/theme2/css'
//   runtime + SSR   → '@ttoss/theme2/runtime'
//   React           → '@ttoss/theme2/react'
//   vars            → '@ttoss/theme2/vars'
//   DTCG            → '@ttoss/theme2/dtcg'
//   dataviz         → '@ttoss/theme2/dataviz'
// ---------------------------------------------------------------------------

export { darkAlternate } from './baseBundle';
export { createTheme } from './createTheme';
export type { ThemeHeadProps, ThemeStylesProps } from './react';
export type { ThemeMode } from './runtime';
export type { SemanticTokens } from './Types';
export type {
  DeepPartial,
  ModeOverride,
  ThemeBundle,
  ThemeTokensV2,
} from './Types';
