// ---------------------------------------------------------------------------
// @ttoss/fsl-theme — Root Entry Point
//
// Core concern: theme definition (creation + types).
//
// Imports for specific concerns:
//   CSS generation  → '@ttoss/fsl-theme/css'
//   runtime + SSR   → '@ttoss/fsl-theme/runtime'
//   React           → '@ttoss/fsl-theme/react'
//   vars            → '@ttoss/fsl-theme/vars'
//   DTCG            → '@ttoss/fsl-theme/dtcg'
//   dataviz         → '@ttoss/fsl-theme/dataviz'
// ---------------------------------------------------------------------------

export { baseTheme, darkAlternate } from './baseBundle';
export { createTheme } from './createTheme';
export type { ThemeHeadProps, ThemeStylesProps } from './react';
export type { ThemeMode } from './runtime';
export { bruttal } from './themes/bruttal';
export type { SemanticTokens } from './Types';
export type {
  DeepPartial,
  ModeOverride,
  ThemeBrief,
  ThemeBundle,
  ThemeTokens,
} from './Types';
