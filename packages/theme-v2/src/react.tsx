import * as React from 'react';

import { deepMerge } from './roots/helpers';
import {
  createThemeRuntime,
  type ThemeMode,
  type ThemeRuntime,
  type ThemeState,
} from './runtime';
import { getThemeScriptContent, type ThemeScriptConfig } from './ssrScript';
import type { ThemeBundle, ThemeTokensV2 } from './Types';

// ---------------------------------------------------------------------------
// Semantic Tokens
// ---------------------------------------------------------------------------

/**
 * The semantic token layer of a theme. This is the **only** part of the token
 * system that components should consume — never `core.*` tokens directly.
 *
 * Obtain via `useTokens()` inside a `<ThemeProvider bundles={...}>`.
 *
 * @see {@link useTokens}
 */
export type SemanticTokens = ThemeTokensV2['semantic'];

const SemanticTokensCtx = React.createContext<SemanticTokens | null>(null);

/**
 * Resolves semantic tokens for the given theme + mode combination.
 * Returns `null` when the requested theme is not registered.
 */
const resolveSemanticTokens = (
  bundles: Record<string, ThemeBundle>,
  themeId: string,
  resolvedMode: 'light' | 'dark'
): SemanticTokens | null => {
  const bundle = bundles[themeId];
  if (!bundle) return null;
  if (resolvedMode === bundle.baseMode || !bundle.alternate?.semantic) {
    return bundle.base.semantic;
  }
  return deepMerge(
    bundle.base.semantic,
    bundle.alternate.semantic
  ) as SemanticTokens;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextValue extends ThemeState {
  setTheme: (themeId: string) => void;
  setMode: (mode: ThemeMode) => void;
  hasBundles: boolean;
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
  /**
   * Bundle registry for the semantic token API.
   *
   * When provided, `useTokens()` becomes available to all descendants and
   * returns only `ThemeTokensV2['semantic']` — enforcing the rule that
   * components never consume `core.*` tokens directly.
   *
   * @example
   * ```tsx
   * import { ThemeProvider } from '@ttoss/theme2/react';
   * import { defaultBundle, auroraBundle } from '@ttoss/theme2';
   *
   * <ThemeProvider bundles={{ default: defaultBundle, aurora: auroraBundle }}>
   *   <App />
   * </ThemeProvider>
   * ```
   */
  bundles?: Record<string, ThemeBundle>;
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
  bundles,
  children,
}: ThemeProviderProps) => {
  const runtimeRef = React.useRef<ThemeRuntime | null>(null);

  // Capture initial prop values — these are only read on mount.
  // Storing them in refs prevents the runtime from being destroyed and
  // recreated if a parent re-renders with new (but semantically identical)
  // literal values, and aligns with the documented "only read on initial mount" contract.
  const initDefaultTheme = React.useRef(defaultTheme);
  const initDefaultMode = React.useRef(defaultMode);
  const initStorageKey = React.useRef(storageKey);

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
      defaultTheme: initDefaultTheme.current,
      defaultMode: initDefaultMode.current,
      storageKey: initStorageKey.current,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = React.useCallback((themeId: string) => {
    runtimeRef.current?.setTheme(themeId);
  }, []);

  const setMode = React.useCallback((mode: ThemeMode) => {
    runtimeRef.current?.setMode(mode);
  }, []);

  // Resolve semantic tokens for current theme+mode. Only re-computed when
  // themeId or resolvedMode changes — zero overhead otherwise.
  const semanticTokens = React.useMemo(() => {
    return bundles
      ? resolveSemanticTokens(bundles, state.themeId, state.resolvedMode)
      : null;
  }, [bundles, state.themeId, state.resolvedMode]);

  const value: ThemeContextValue = {
    ...state,
    setTheme,
    setMode,
    hasBundles: !!bundles,
  };

  const themeNode = (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );

  // Only wrap with semantic context when bundles are registered.
  // This keeps the no-bundles path zero-overhead.
  if (bundles) {
    return (
      <SemanticTokensCtx.Provider value={semanticTokens}>
        {themeNode}
      </SemanticTokensCtx.Provider>
    );
  }

  return themeNode;
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
/**
 * Public shape returned by `useTheme()`. Does not expose internal fields.
 */
export interface UseThemeResult extends ThemeState {
  setTheme: (themeId: string) => void;
  setMode: (mode: ThemeMode) => void;
}

export const useTheme = (): UseThemeResult => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  const { hasBundles: _internal, ...publicValue } = context;
  return publicValue;
};

// ---------------------------------------------------------------------------
// useTokens
// ---------------------------------------------------------------------------

/**
 * Access the current theme's **semantic tokens only**.
 *
 * This is the consumption frontier: components receive `ThemeTokensV2['semantic']`
 * and have no access to `core.*` tokens, enforcing the design system contract
 * that UI code never consumes core tokens directly.
 *
 * Requires `<ThemeProvider bundles={...}>` with a bundle registry.
 *
 * @example
 * ```tsx
 * import { useTokens } from '@ttoss/theme2/react';
 *
 * const Button = () => {
 *   const tokens = useTokens();
 *   // tokens.colors.action.primary.background.default ✔
 *   // tokens.colors.brand ✘ (does not exist on SemanticTokens)
 *   return <button style={{ background: 'var(--tt-action-primary-background-default)' }} />;
 * };
 * ```
 */
export const useTokens = (): SemanticTokens => {
  const tokens = React.useContext(SemanticTokensCtx);
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTokens must be used within a <ThemeProvider>');
  }

  if (tokens === null) {
    if (!context.hasBundles) {
      throw new Error(
        'useTokens requires a <ThemeProvider> with a `bundles` prop. ' +
          'Pass your theme bundles: <ThemeProvider bundles={{ default: defaultBundle, ... }}>'
      );
    }
    throw new Error(
      `useTokens: theme "${context.themeId}" is not registered in the bundles prop. ` +
        'Add it to the bundles object passed to <ThemeProvider>.'
    );
  }

  return tokens;
};

export { useDatavizTokens } from './dataviz/useDatavizTokens';

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
