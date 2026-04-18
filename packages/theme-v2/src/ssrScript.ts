// ---------------------------------------------------------------------------
// SSR Bootstrap Script Generator
//
// Returns JavaScript code (as a string) that runs synchronously before paint.
// Reads persisted theme/mode from localStorage, resolves system mode,
// and applies data-tt-theme / data-tt-mode / color-scheme on <html>.
// ---------------------------------------------------------------------------

import { SAFE_ID_RE } from './roots/helpers';
import { DEFAULT_STORAGE_KEY, type ThemeMode, VALID_MODES } from './runtime';

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
export const getThemeScriptContent = (
  config: ThemeScriptConfig = {}
): string => {
  const {
    defaultTheme,
    defaultMode = 'system',
    storageKey = DEFAULT_STORAGE_KEY,
  } = config;

  if (defaultTheme !== undefined && !SAFE_ID_RE.test(defaultTheme)) {
    throw new Error(
      `Invalid defaultTheme "${defaultTheme}". Only alphanumeric characters, hyphens, and underscores are allowed.`
    );
  }

  // Inline config as a JSON literal — all values statically baked in.
  // IMPORTANT: if you add a new DOM attribute in runtime.ts apply(), add it
  // to this template string too. Both are co-located (ssrScript.ts imports
  // runtime.ts) so drift is immediately visible.
  const cfg = JSON.stringify({
    storageKey,
    defaultTheme,
    defaultMode,
    validModes: [...VALID_MODES],
  });
  // Self-contained IIFE: replicates resolveTheme() + apply() from runtime.ts
  // as plain JavaScript so it runs synchronously before the app bundle loads.
  return (
    `(function(){var cfg=${cfg};` +
    `var d=document.documentElement;` +
    `var s=null;try{var r=localStorage.getItem(cfg.storageKey);if(r)s=JSON.parse(r);}catch(e){}` +
    `var m=(s!=null&&s.mode!=null&&cfg.validModes.indexOf(s.mode)!==-1)?s.mode:cfg.defaultMode;` +
    `var rm=m==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;` +
    `if(cfg.defaultTheme){d.setAttribute("data-tt-theme",cfg.defaultTheme);}else{d.removeAttribute("data-tt-theme");}` +
    `d.setAttribute("data-tt-mode",rm);` +
    `d.style.colorScheme=rm;` +
    `})()`
  );
};
