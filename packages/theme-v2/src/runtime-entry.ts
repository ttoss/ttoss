// ---------------------------------------------------------------------------
// @ttoss/theme2/runtime — Framework-agnostic theme runtime + SSR bootstrap
//
// createThemeRuntime(config?)
//   Manages theme/mode via data-tt-theme / data-tt-mode attributes on the root
//   element. Persists to localStorage and reacts to prefers-color-scheme.
//   Use alongside <ThemeProvider theme={...}> from '@ttoss/theme2/react'.
//
//   @example
//   import { createThemeRuntime } from '@ttoss/theme2/runtime';
//   const rt = createThemeRuntime({ defaultTheme: 'bruttal', defaultMode: 'system' });
//   rt.setMode('dark');
//   const off = rt.subscribe((state) => console.log(state.mode, state.resolvedMode));
//   rt.destroy(); // clean up listeners on unmount
//
// getThemeScriptContent(config?)
//   Returns an inline <script> string that reads localStorage before the first
//   paint — prevents flash of wrong theme/mode on SSR/SSG pages.
//
//   @example
//   // Next.js app/layout.tsx
//   import { getThemeScriptContent } from '@ttoss/theme2/runtime';
//   <script dangerouslySetInnerHTML={{ __html: getThemeScriptContent() }} />
// ---------------------------------------------------------------------------

export {
  createThemeRuntime,
  DATA_MODE_ATTR,
  DATA_THEME_ATTR,
  type ResolvedMode,
  type ThemeMode,
  type ThemeRuntime,
  type ThemeRuntimeConfig,
  type ThemeState,
} from './runtime';
export { getThemeScriptContent, type ThemeScriptConfig } from './ssrScript';
