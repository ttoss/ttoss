import * as React from 'react';

import {
  createThemeRuntime,
  type ThemeMode,
  type ThemeRuntime,
  type ThemeState,
} from './runtime';
import { getThemeScriptContent, type ThemeScriptConfig } from './ssrScript';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextValue extends ThemeState {
  setTheme: (themeId: string) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// ThemeProvider
// ---------------------------------------------------------------------------

/**
 * Props for the `ThemeProvider` component.
 */
export interface ThemeProviderProps {
  /** Theme to use when no persisted value is found. Only read on initial mount. @default 'default' */
  defaultTheme?: string;
  /** Mode to use when no persisted value is found. Only read on initial mount. @default 'system' */
  defaultMode?: ThemeMode;
  /** localStorage key for persistence. Only read on initial mount. @default 'tt-theme' */
  storageKey?: string;
  children: React.ReactNode;
}

/**
 * React provider that manages theme switching via `createThemeRuntime`.
 *
 * Applies `data-tt-theme` and `data-tt-mode` on `<html>`, persists to
 * localStorage, and listens to system color scheme changes.
 *
 * Only exposes `themeId/mode/resolvedMode` + setters via context —
 * no giant token object, no unnecessary re-renders.
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@ttoss/theme2/react';
 *
 * export const App = () => (
 *   <ThemeProvider defaultTheme="bruttal">
 *     <YourApp />
 *   </ThemeProvider>
 * );
 * ```
 */
export const ThemeProvider = ({
  defaultTheme,
  defaultMode,
  storageKey,
  children,
}: ThemeProviderProps) => {
  const runtimeRef = React.useRef<ThemeRuntime | null>(null);

  const [state, setState] = React.useState<ThemeState>(() => {
    // SSR fallback — will be corrected on mount by the runtime
    const resolvedDefault =
      (defaultMode ?? 'system') === 'system'
        ? 'light'
        : (defaultMode as 'light' | 'dark');
    return {
      themeId: defaultTheme ?? 'default',
      mode: defaultMode ?? 'system',
      resolvedMode: resolvedDefault,
    };
  });

  React.useEffect(() => {
    const runtime = createThemeRuntime({
      defaultTheme,
      defaultMode,
      storageKey,
    });
    runtimeRef.current = runtime;

    // Sync state with runtime (covers hydration mismatch + persisted values)
    setState(runtime.getState());
    const unsubscribe = runtime.subscribe(setState);
    return () => {
      unsubscribe();
      runtime.destroy();
      runtimeRef.current = null;
    };
  }, []); // Intentionally initial-mount only — use setTheme/setMode to change at runtime. // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = React.useCallback((themeId: string) => {
    runtimeRef.current?.setTheme(themeId);
  }, []);

  const setMode = React.useCallback((mode: ThemeMode) => {
    runtimeRef.current?.setMode(mode);
  }, []);

  const value: ThemeContextValue = {
    ...state,
    setTheme,
    setMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// useTheme
// ---------------------------------------------------------------------------

/**
 * Access the current theme state and setters.
 *
 * Must be used within a `<ThemeProvider>`.
 *
 * @example
 * ```tsx
 * import { useTheme } from '@ttoss/theme2/react';
 *
 * const ThemeSwitcher = () => {
 *   const { themeId, mode, setTheme, setMode } = useTheme();
 *   return (
 *     <>
 *       <p>Theme: {themeId}, Mode: {mode}</p>
 *       <button onClick={() => setTheme('bruttal')}>Bruttal</button>
 *       <button onClick={() => setMode('dark')}>Dark</button>
 *     </>
 *   );
 * };
 * ```
 */
export const useTheme = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return context;
};

// ---------------------------------------------------------------------------
// ThemeScript
// ---------------------------------------------------------------------------

/**
 * Props for the `ThemeScript` component.
 */
export interface ThemeScriptProps extends ThemeScriptConfig {
  /** CSP nonce for the inline script. */
  nonce?: string;
}

/**
 * Renders an inline `<script>` that prevents theme flash on SSR/SSG.
 *
 * Place in the `<head>` before stylesheets.
 *
 * @example
 * ```tsx
 * // Next.js app/layout.tsx
 * import { ThemeScript } from '@ttoss/theme2/react';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <head>
 *         <ThemeScript defaultTheme="bruttal" />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export const ThemeScript = ({
  defaultTheme,
  defaultMode,
  storageKey,
  nonce,
}: ThemeScriptProps = {}) => {
  const scriptContent = getThemeScriptContent({
    defaultTheme,
    defaultMode,
    storageKey,
  });

  return (
    <script nonce={nonce} dangerouslySetInnerHTML={{ __html: scriptContent }} />
  );
};
