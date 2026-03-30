// ---------------------------------------------------------------------------
// SSR Bootstrap Script Generator
//
// Returns JavaScript code (as a string) that runs synchronously before paint.
// Reads persisted theme/mode from localStorage, resolves system mode,
// and applies data-tt-theme / data-tt-mode / color-scheme on <html>.
// ---------------------------------------------------------------------------

import type { ThemeMode } from './runtime';

/**
 * Configuration for the SSR bootstrap script.
 */
export interface ThemeScriptConfig {
  /** Theme to use when no persisted value is found. @default 'default' */
  defaultTheme?: string;
  /** Mode to use when no persisted value is found. @default 'system' */
  defaultMode?: ThemeMode;
  /** localStorage key. Must match the runtime's `storageKey`. @default 'tt-theme' */
  storageKey?: string;
}

/**
 * Returns self-contained JavaScript code that prevents theme flash on SSR/SSG.
 *
 * Insert the returned string into an inline `<script>` tag in the `<head>`,
 * before any stylesheets or the app bundle.
 *
 * @example
 * ```tsx
 * // Next.js app/layout.tsx
 * import { getThemeScriptContent } from '@ttoss/theme2';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <head>
 *         <script dangerouslySetInnerHTML={{ __html: getThemeScriptContent() }} />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export const getThemeScriptContent = (
  config: ThemeScriptConfig = {}
): string => {
  const {
    defaultTheme = 'default',
    defaultMode = 'system',
    storageKey = 'tt-theme',
  } = config;

  // The script must be self-contained — no external imports.
  // We inline the constants and logic.
  return `(function(){try{var d=document.documentElement;var k=${JSON.stringify(storageKey)};var dt=${JSON.stringify(defaultTheme)};var dm=${JSON.stringify(defaultMode)};var vm=['light','dark','system'];var s=null;try{var r=localStorage.getItem(k);if(r)s=JSON.parse(r)}catch(e){}var t=(s&&typeof s.themeId==='string'&&s.themeId)||dt;var m=(s&&s.mode&&vm.indexOf(s.mode)!==-1)?s.mode:dm;var rm=m;if(m==='system'){rm=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-tt-theme',t);d.setAttribute('data-tt-mode',rm);d.style.colorScheme=rm}catch(e){}})()`;
};
