// ---------------------------------------------------------------------------
// SSR Bootstrap Script Generator
//
// Returns JavaScript code (as a string) that runs synchronously before paint.
// Reads persisted theme/mode from localStorage, resolves system mode,
// and applies data-tt-theme / data-tt-mode / color-scheme on <html>.
// ---------------------------------------------------------------------------

import { type ThemeMode, VALID_MODES } from './runtime';

/**
 * Configuration for the SSR bootstrap script.
 */
export interface ThemeScriptConfig {
  /** Theme identifier written to `data-tt-theme`. When omitted, `data-tt-theme` is not written. */
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
 * import { getThemeScriptContent } from '@ttoss/theme2/runtime';
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
const SAFE_THEME_ID_RE = /^[a-zA-Z0-9_-]+$/;

export const getThemeScriptContent = (
  config: ThemeScriptConfig = {}
): string => {
  const {
    defaultTheme,
    defaultMode = 'system',
    storageKey = 'tt-theme',
  } = config;

  if (defaultTheme !== undefined && !SAFE_THEME_ID_RE.test(defaultTheme)) {
    throw new Error(
      `Invalid defaultTheme "${defaultTheme}". Only alphanumeric characters, hyphens, and underscores are allowed.`
    );
  }

  // The script must be self-contained — no external imports.
  // We inline the constants and logic.
  return `(function(){try{var d=document.documentElement;var k=${JSON.stringify(storageKey)};var dt=${JSON.stringify(defaultTheme)};var dm=${JSON.stringify(defaultMode)};var vm=${JSON.stringify(VALID_MODES)};var s=null;try{var r=localStorage.getItem(k);if(r)s=JSON.parse(r)}catch(e){}var m=(s&&s.mode&&vm.indexOf(s.mode)!==-1)?s.mode:dm;var rm=m;if(m==='system'){rm=window.matchMedia?.('(prefers-color-scheme: dark)')?.matches?'dark':'light'}if(dt){d.setAttribute('data-tt-theme',dt)}d.setAttribute('data-tt-mode',rm);d.style.colorScheme=rm}catch(e){}})()`;
};
