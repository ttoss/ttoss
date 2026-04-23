// ---------------------------------------------------------------------------
// @ttoss/theme2/runtime — Framework-agnostic theme runtime + SSR bootstrap
//
// createThemeRuntime(config?)
//   Manages theme/mode via data-tt-theme / data-tt-mode attributes on the root
//   element. Persists to localStorage and reacts to prefers-color-scheme.
//   Use directly in framework-agnostic code (vanilla JS, Vue, Svelte, etc.).
//   In React apps, prefer <ThemeProvider> from '@ttoss/theme2/react' — it
//   wraps the runtime internally and exposes mode via context hooks.
//
//   @example
//   import { createThemeRuntime } from '@ttoss/theme2/runtime';
//   const runtime = createThemeRuntime({ defaultMode: 'system' });
//   runtime.setMode('dark');
//   const unsub = runtime.subscribe((state) => console.log(state.mode, state.resolvedMode));
//   unsub();          // stop listening
//   runtime.destroy(); // remove event listeners and media query subscriptions
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
