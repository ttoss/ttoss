// ---------------------------------------------------------------------------
// Framework-agnostic Theme Runtime
//
// Manages theme/mode via data attributes on a root element,
// with localStorage persistence and system mode detection.
// Client-only — do not call on the server.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DATA_THEME_ATTR = 'data-tt-theme';
export const DATA_MODE_ATTR = 'data-tt-mode';
export const DEFAULT_STORAGE_KEY = 'tt-theme';
const DEFAULT_THEME_ID = 'default';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Theme mode. `'system'` delegates to the OS `prefers-color-scheme` preference.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Valid values for the `mode` field. Used to sanitize localStorage input. */
export const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system'];

/**
 * Resolved mode — always `'light'` or `'dark'` (never `'system'`).
 */
export type ResolvedMode = 'light' | 'dark';

/**
 * Snapshot of the current theme state.
 */
export interface ThemeState {
  themeId: string;
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
}

/**
 * Configuration for `createThemeRuntime()`.
 */
export interface ThemeRuntimeConfig {
  /** Theme to use when no persisted value is found. @default 'default' */
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
  setTheme: (themeId: string) => void;
  setMode: (mode: ThemeMode) => void;
  subscribe: (listener: (state: ThemeState) => void) => () => void;
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Helpers (module-private)
// ---------------------------------------------------------------------------

const readStorage = (
  key: string
): { themeId?: string; mode?: ThemeMode } | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as { themeId?: string; mode?: ThemeMode };
  } catch {
    return null;
  }
};

const writeStorage = (
  key: string,
  data: { themeId: string; mode: ThemeMode }
): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage unavailable (SSR, privacy mode, quota exceeded) — silent fail
  }
};

const getSystemMode = (): ResolvedMode => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
};

const resolveMode = (mode: ThemeMode): ResolvedMode => {
  if (mode === 'system') {
    return getSystemMode();
  }
  return mode;
};

// ---------------------------------------------------------------------------
// createThemeRuntime
// ---------------------------------------------------------------------------

/**
 * Creates a framework-agnostic runtime that manages theme switching.
 *
 * - Sets `data-tt-theme` and `data-tt-mode` attributes on the root element.
 * - Updates `style.colorScheme` for native dark/light UI.
 * - Persists `{ themeId, mode }` to localStorage.
 * - Listens to `prefers-color-scheme` media query when mode is `'system'`.
 * - Pub/sub pattern for state changes.
 *
 * @example
 * ```ts
 * const runtime = createThemeRuntime({ defaultTheme: 'bruttal', defaultMode: 'dark' });
 * runtime.setTheme('oca');
 * runtime.setMode('system');
 * const unsub = runtime.subscribe(console.log);
 * runtime.destroy();
 * ```
 */
export const createThemeRuntime = (
  config: ThemeRuntimeConfig = {}
): ThemeRuntime => {
  const {
    defaultTheme = DEFAULT_THEME_ID,
    defaultMode = 'system',
    storageKey = DEFAULT_STORAGE_KEY,
    root = document.documentElement,
  } = config;

  const listeners = new Set<(state: ThemeState) => void>();

  // --- Read persisted state ------------------------------------------------

  const stored = readStorage(storageKey);
  let themeId = stored?.themeId ?? defaultTheme;

  const storedMode = stored?.mode;
  let mode: ThemeMode =
    storedMode && VALID_MODES.includes(storedMode) ? storedMode : defaultMode;
  let resolvedMode: ResolvedMode = resolveMode(mode);

  // --- DOM helpers ---------------------------------------------------------

  const apply = (): void => {
    root.setAttribute(DATA_THEME_ATTR, themeId);
    root.setAttribute(DATA_MODE_ATTR, resolvedMode);
    root.style.colorScheme = resolvedMode;
  };

  const getState = (): ThemeState => {
    return {
      themeId,
      mode,
      resolvedMode,
    };
  };

  // --- Centralized state transition ----------------------------------------

  let prevSnapshot = `${themeId}\0${mode}\0${resolvedMode}`;

  const applyState = ({ persist }: { persist: boolean }): void => {
    const snapshot = `${themeId}\0${mode}\0${resolvedMode}`;

    if (snapshot === prevSnapshot) {
      return;
    }

    prevSnapshot = snapshot;
    apply();

    if (persist) {
      writeStorage(storageKey, { themeId, mode });
    }

    const state = getState();
    for (const listener of listeners) {
      listener(state);
    }
  };

  // --- Lazy system mode listener -------------------------------------------

  const mediaQuery =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  const onSystemChange = (): void => {
    resolvedMode = getSystemMode();
    applyState({ persist: false });
  };

  const syncMediaListener = (active: boolean): void => {
    if (!mediaQuery) {
      return;
    }
    mediaQuery.removeEventListener('change', onSystemChange);
    if (active) {
      mediaQuery.addEventListener('change', onSystemChange);
    }
  };

  syncMediaListener(mode === 'system');

  // --- Public API ----------------------------------------------------------

  const setTheme = (newThemeId: string): void => {
    if (
      typeof newThemeId !== 'string' ||
      !newThemeId ||
      !/^[a-zA-Z0-9_-]+$/.test(newThemeId)
    ) {
      return;
    }
    themeId = newThemeId;
    applyState({ persist: true });
  };

  const setMode = (newMode: ThemeMode): void => {
    if (!VALID_MODES.includes(newMode)) {
      return;
    }
    mode = newMode;
    resolvedMode = resolveMode(mode);
    syncMediaListener(mode === 'system');
    applyState({ persist: true });
  };

  const subscribe = (listener: (state: ThemeState) => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const destroy = (): void => {
    syncMediaListener(false);
    listeners.clear();
  };

  // --- Init ----------------------------------------------------------------

  apply();

  return { getState, setTheme, setMode, subscribe, destroy };
};
