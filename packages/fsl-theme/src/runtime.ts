// ---------------------------------------------------------------------------
// Framework-agnostic Theme Runtime
//
// Manages theme/mode via data attributes on a root element,
// with localStorage persistence and system mode detection.
// Client-only — do not call on the server.
// ---------------------------------------------------------------------------

import { resolveTheme } from './themeBootstrap';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DATA_THEME_ATTR = 'data-tt-theme';
export const DATA_MODE_ATTR = 'data-tt-mode';
export const DEFAULT_STORAGE_KEY = 'tt-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Theme mode. `'system'` delegates to the OS `prefers-color-scheme` preference.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Valid values for the `mode` field. Used to sanitize localStorage input. */
export const VALID_MODES = [
  'light',
  'dark',
  'system',
] as const satisfies ThemeMode[];

/**
 * Resolved mode — always `'light'` or `'dark'` (never `'system'`).
 */
export type ResolvedMode = 'light' | 'dark';

/**
 * Snapshot of the current theme state.
 */
export interface ThemeState {
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
}

/**
 * Configuration for `createThemeRuntime()`.
 */
export interface ThemeRuntimeConfig {
  /** Theme identifier written to `data-tt-theme`. Provide only for MFE / multi-theme CSS scoping. When omitted, `data-tt-theme` is not written to the DOM. */
  defaultTheme?: string;
  /** Mode to use when no persisted value is found. @default 'system' */
  defaultMode?: ThemeMode;
  /** localStorage key for persistence. @default 'tt-theme' */
  storageKey?: string;
  /** Root element to apply data attributes to. @default document.documentElement */
  root?: HTMLElement;
}

/**
 * Public API returned by `createThemeRuntime()`.
 */
export interface ThemeRuntime {
  getState: () => ThemeState;
  setMode: (mode: ThemeMode) => void;
  subscribe: (listener: (state: ThemeState) => void) => () => void;
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Helpers (module-private)
// ---------------------------------------------------------------------------

const writeStorage = (key: string, data: { mode: ThemeMode }): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage unavailable (SSR, privacy mode, quota exceeded) — silent fail
  }
};

// ---------------------------------------------------------------------------
// createThemeRuntime
// ---------------------------------------------------------------------------

/**
 * Creates a framework-agnostic runtime that manages theme switching.
 *
 * - Sets `data-tt-mode` (and `data-tt-theme` when `defaultTheme` is provided) attributes on the root element.
 * - Updates `style.colorScheme` for native dark/light UI.
 * - Persists `{ mode }` to localStorage.
 * - Listens to `prefers-color-scheme` media query when mode is `'system'`.
 * - Pub/sub pattern for state changes.
 *
 * @example
 * ```ts
 * const runtime = createThemeRuntime({ defaultMode: 'dark' });
 * runtime.setMode('system');
 * const unsub = runtime.subscribe(console.log);
 * runtime.destroy();
 * ```
 */
export const createThemeRuntime = (
  config: ThemeRuntimeConfig = {}
): ThemeRuntime => {
  const {
    defaultTheme,
    defaultMode = 'system',
    storageKey = DEFAULT_STORAGE_KEY,
    root = document.documentElement,
  } = config;

  const listeners = new Set<(state: ThemeState) => void>();
  let destroyed = false;

  // --- Init: read persisted mode and resolve --------------------------------

  const init = resolveTheme({
    storageKey,
    defaultMode,
    validModes: VALID_MODES,
  });
  let mode: ThemeMode = init.mode;
  let resolvedMode: ResolvedMode = init.resolvedMode;

  // --- DOM write — single owner for all attribute mutations ----------------
  // NOTE: If you add a new DOM attribute here, add it to the template string
  // in ssrScript.ts too (both are visible in context; drift is obvious).
  const apply = (): void => {
    if (defaultTheme) {
      root.setAttribute(DATA_THEME_ATTR, defaultTheme);
    } else {
      root.removeAttribute(DATA_THEME_ATTR);
    }
    root.setAttribute(DATA_MODE_ATTR, resolvedMode);
    root.style.colorScheme = resolvedMode;
  };

  const getState = (): ThemeState => {
    return { mode, resolvedMode };
  };

  // Initial DOM write — same path used by all subsequent updates
  apply();

  // --- Centralized state transition ----------------------------------------

  let prevMode = mode;
  let prevResolvedMode = resolvedMode;

  const applyState = ({ persist }: { persist: boolean }): void => {
    if (mode === prevMode && resolvedMode === prevResolvedMode) {
      return;
    }
    prevMode = mode;
    prevResolvedMode = resolvedMode;
    apply();
    if (persist) {
      writeStorage(storageKey, { mode });
    }
    const state = getState();
    for (const listener of listeners) {
      listener(state);
    }
  };

  // --- Lazy system mode listener -------------------------------------------

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const onSystemChange = (): void => {
    resolvedMode = mediaQuery.matches ? 'dark' : 'light';
    applyState({ persist: false });
  };

  const syncMediaListener = (active: boolean): void => {
    mediaQuery.removeEventListener('change', onSystemChange);
    if (active) {
      mediaQuery.addEventListener('change', onSystemChange);
    }
  };

  syncMediaListener(mode === 'system');

  // --- Public API ----------------------------------------------------------

  const setMode = (newMode: ThemeMode): void => {
    if (destroyed || !VALID_MODES.includes(newMode)) {
      return;
    }
    mode = newMode;
    resolvedMode =
      mode === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : mode;
    syncMediaListener(mode === 'system');
    applyState({ persist: true });
  };

  const subscribe = (listener: (state: ThemeState) => void): (() => void) => {
    if (destroyed) {
      return () => {};
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const destroy = (): void => {
    destroyed = true;
    syncMediaListener(false);
    listeners.clear();
  };

  return { getState, setMode, subscribe, destroy };
};
