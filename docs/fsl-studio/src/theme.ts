/**
 * themeId used to scope the stage panes' CSS. With a themeId,
 * `getThemeStylesContent` emits vars against `[data-tt-theme="<id>"]` and
 * `[data-tt-theme="<id>"][data-tt-mode="dark"]` — element-scoped, which is
 * what lets the stage render light and dark side by side regardless of the
 * chrome's color mode (PRD §6.2).
 *
 * The live theme bundle itself lives in the theme store
 * (`src/studio/theme/themeStore.tsx`).
 */
export const STAGE_THEME_ID = 'fsl-studio-stage';
