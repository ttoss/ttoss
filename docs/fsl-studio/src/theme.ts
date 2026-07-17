import { createTheme, type ThemeBundle } from '@ttoss/fsl-theme';

/**
 * The Studio's active theme bundle.
 *
 * Phase 0: fixed to the base theme (light base + built-in dark alternate).
 * Phase 1 (Theme Lab) replaces this constant with session state — a diff of
 * overrides re-derived through `createTheme` on every edit (PRD AD-5).
 */
export const studioBundle: ThemeBundle = createTheme();

/**
 * themeId used to scope the stage panes' CSS. With a themeId,
 * `getThemeStylesContent` emits vars against `[data-tt-theme="<id>"]` and
 * `[data-tt-theme="<id>"][data-tt-mode="dark"]` — element-scoped, which is
 * what lets the stage render light and dark side by side regardless of the
 * chrome's own mode (PRD §6.2).
 */
export const STAGE_THEME_ID = 'fsl-studio-stage';
