import * as React from 'react';

import { getThemeStylesContent } from './css';
import { deepMerge, flattenAndResolve } from './roots/helpers';
import {
  createThemeRuntime,
  type ResolvedMode,
  type ThemeMode,
  type ThemeRuntime,
  type ThemeState,
} from './runtime';
import { getThemeScriptContent, type ThemeScriptConfig } from './ssrScript';
import type { SemanticTokens, ThemeBundle, ThemeTokensV2 } from './Types';

export type { ThemeMode } from './runtime';
export type { ResolvedMode } from './runtime';

// ---------------------------------------------------------------------------
// Semantic Tokens
// ---------------------------------------------------------------------------

const SemanticTokensCtx = React.createContext<SemanticTokens | null>(null);

/**
 * Resolves semantic tokens for the given bundle + mode combination.
 */
const resolveSemanticTokens = (
  bundle: ThemeBundle,
  resolvedMode: ResolvedMode
): SemanticTokens => {
  if (resolvedMode === bundle.baseMode || !bundle.alternate?.semantic) {
    return bundle.base.semantic;
  }
  return deepMerge(
    bundle.base.semantic,
    bundle.alternate.semantic
  ) as SemanticTokens;
};

// ---------------------------------------------------------------------------
// Resolved Tokens — flat map of semantic.* keys with all refs resolved
// ---------------------------------------------------------------------------

const ResolvedTokensCtx = React.createContext<Record<
  string,
  string | number
> | null>(null);

// ---------------------------------------------------------------------------
// Mode Context — subscribed only to mode state for re-render isolation
// ---------------------------------------------------------------------------

interface ModeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  setMode: (mode: ThemeMode) => void;
}

const ModeContext = React.createContext<ModeContextValue | null>(null);

// ---------------------------------------------------------------------------
// ThemeProvider
// ---------------------------------------------------------------------------

/**
 * Props for the `ThemeProvider` component.
 */
export interface ThemeProviderProps {
  /** Mode to use when no persisted value is found. Only read on initial mount. @default 'system' */
  defaultMode?: ThemeMode;
  /** localStorage key for persistence. Only read on initial mount. @default 'tt-theme' */
  storageKey?: string;
  /**
   * Theme identifier written to `data-tt-theme`. Only read on initial mount.
   * Provide only for MFE / multi-theme CSS scoping.
   */
  themeId?: string;
  /**
   * The theme bundle for the app — the canonical 1-theme / 2-mode model.
   *
   * Passing `theme` enables `useTokens()` and `useResolvedTokens()` for all
   * descendants, and automatically injects the CSS Custom Properties `<style>`
   * tag into the document head (React 19 hoisting).
   *
   * @example
   * ```tsx
   * import { createTheme } from '@ttoss/theme2';
   * import { ThemeProvider } from '@ttoss/theme2/react';
   *
   * const myTheme = createTheme();
   *
   * <ThemeProvider theme={myTheme}>
   *   <App />
   * </ThemeProvider>
   * ```
   */
  theme?: ThemeBundle;
  /**
   * Called after each mode transition. Does **not** fire on initial mount —
   * only on subsequent user-triggered or system-triggered mode changes.
   *
   * Receives both `mode` (user intent: `'light' | 'dark' | 'system'`) and
   * `resolvedMode` (actual: `'light' | 'dark'`), covering all integration
   * needs in one callback.
   *
   * @example
   * ```tsx
   * <ThemeProvider
   *   theme={myTheme}
   *   onModeChange={(mode, resolvedMode) => {
   *     analytics.track('modeChanged', { mode, resolvedMode });
   *   }}
   * >
   * ```
   */
  onModeChange?: (mode: ThemeMode, resolvedMode: ResolvedMode) => void;
  /**
   * Root element to anchor `data-tt-theme` / `data-tt-mode` attributes.
   * Defaults to `document.documentElement`. Pass a container element for
   * Storybook isolation or micro-frontend use cases.
   *
   * Because the element is often `null` on the first render when passed via
   * `ref.current`, `root` is reactive: the runtime is recreated once when
   * it transitions from `undefined` to the actual element.
   *
   * @example
   * ```tsx
   * // Storybook decorator — isolates each story from <html>
   * const rootRef = React.useRef<HTMLDivElement>(null);
   * <div ref={rootRef}>
   *   <ThemeProvider theme={myTheme} root={rootRef.current ?? undefined}>
   *     <Story />
   *   </ThemeProvider>
   * </div>
   * ```
   */
  root?: HTMLElement;
  children: React.ReactNode;
}

/**
 * React provider that manages theme switching via `createThemeRuntime`.
 *
 * Applies `data-tt-theme` and `data-tt-mode` on `<html>` (or `root`),
 * persists to localStorage, and listens to system color scheme changes.
 * When `theme` is provided, automatically injects CSS Custom Properties into
 * the document `<head>` via React 19 style hoisting.
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@ttoss/theme2/react';
 * import { createTheme } from '@ttoss/theme2';
 *
 * const myTheme = createTheme();
 *
 * export const App = () => (
 *   <ThemeProvider theme={myTheme}>
 *     <YourApp />
 *   </ThemeProvider>
 * );
 * ```
 */
export const ThemeProvider = ({
  defaultMode,
  storageKey,
  theme,
  themeId,
  onModeChange,
  root,
  children,
}: ThemeProviderProps) => {
  const runtimeRef = React.useRef<ThemeRuntime | null>(null);

  // Capture initial prop values — these are only read on mount.
  // Storing them in refs prevents the runtime from being recreated
  // if a parent re-renders with new (but semantically identical) literal
  // values, and aligns with the documented "only read on initial mount" contract.
  const initDefaultMode = React.useRef(defaultMode);
  const initStorageKey = React.useRef(storageKey);
  const initThemeId = React.useRef(themeId);

  const [state, setState] = React.useState<ThemeState>(() => {
    // SSR fallback — will be corrected on mount by the runtime
    const resolvedDefault =
      (defaultMode ?? 'system') === 'system'
        ? 'light'
        : (defaultMode as 'light' | 'dark');
    return {
      mode: defaultMode ?? 'system',
      resolvedMode: resolvedDefault,
    };
  });

  // root is reactive: runtime is recreated when root element changes
  // (e.g. from undefined to actual element via ref). defaultMode and
  // storageKey are init-only and captured in refs.
  React.useEffect(() => {
    const runtime = createThemeRuntime({
      defaultTheme: initThemeId.current,
      defaultMode: initDefaultMode.current,
      storageKey: initStorageKey.current,
      root,
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
  }, [root]);

  const setMode = React.useCallback((mode: ThemeMode) => {
    runtimeRef.current?.setMode(mode);
  }, []);

  // Resolve semantic tokens for current theme + mode. Re-computed only when
  // theme or resolvedMode changes — zero overhead otherwise.
  const semanticTokens = React.useMemo(() => {
    return theme ? resolveSemanticTokens(theme, state.resolvedMode) : null;
  }, [theme, state.resolvedMode]);

  // Resolved flat token map — semantic.* keys only, all refs resolved to
  // raw values. Used by useResolvedTokens() for non-CSS environments.
  const resolvedTokens = React.useMemo((): Record<
    string,
    string | number
  > | null => {
    if (!theme || !semanticTokens) return null;

    const effectiveTheme: ThemeTokensV2 = {
      core: theme.base.core,
      semantic: semanticTokens,
    };
    const all = flattenAndResolve(effectiveTheme);

    const result: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith('semantic.')) {
        result[key] = value;
      }
    }
    return result;
  }, [theme, semanticTokens]);

  // CSS content for the theme bundle — memoized to avoid recomputing on
  // every render. Only recalculated when theme reference changes.
  const cssContent = React.useMemo(() => {
    return theme ? getThemeStylesContent(theme) : null;
  }, [theme]);

  // onModeChange: fires on subsequent mode transitions only (not on mount).
  // Use a ref for the callback to avoid stale-closure issues with inline fns.
  const onModeChangeRef = React.useRef(onModeChange);
  React.useEffect(() => {
    onModeChangeRef.current = onModeChange;
  });

  // Track previous mode values to fire onModeChange only when they actually
  // change — not on initial mount and not when the runtime is recreated (e.g.
  // root prop transition) without a real mode change.
  const prevModeRef = React.useRef<{
    mode: ThemeMode;
    resolvedMode: ResolvedMode;
  } | null>(null);
  React.useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = {
      mode: state.mode,
      resolvedMode: state.resolvedMode,
    };
    if (prev === null) return; // initial mount — skip
    if (prev.mode === state.mode && prev.resolvedMode === state.resolvedMode)
      return; // no change
    onModeChangeRef.current?.(state.mode, state.resolvedMode);
  }, [state.mode, state.resolvedMode]);

  // ModeContext value is memoized separately so that useColorMode() consumers
  // only re-render on mode changes — never on themeId changes.
  const modeContextValue = React.useMemo<ModeContextValue>(() => {
    return { mode: state.mode, resolvedMode: state.resolvedMode, setMode };
  }, [state.mode, state.resolvedMode, setMode]);

  const coreNode = (
    <ModeContext.Provider value={modeContextValue}>
      {children}
    </ModeContext.Provider>
  );

  if (theme) {
    return (
      <>
        <style precedence="default">{cssContent}</style>
        <ResolvedTokensCtx.Provider value={resolvedTokens}>
          <SemanticTokensCtx.Provider value={semanticTokens}>
            {coreNode}
          </SemanticTokensCtx.Provider>
        </ResolvedTokensCtx.Provider>
      </>
    );
  }

  return coreNode;
};

// ---------------------------------------------------------------------------
// useColorMode
// ---------------------------------------------------------------------------

/**
 * Access mode state and the mode setter — without subscribing to theme changes.
 *
 * Consumers of `useColorMode()` only re-render on mode transitions, never on
 * `themeId` changes. Use this for components that only need dark/light toggling
 * (e.g. a sun/moon icon button) to avoid unnecessary re-renders.
 *
 * Must be used within a `<ThemeProvider>`.
 *
 * @example
 * ```tsx
 * import { useColorMode } from '@ttoss/theme2/react';
 *
 * const DarkModeToggle = () => {
 *   const { resolvedMode, setMode } = useColorMode();
 *   return (
 *     <button onClick={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}>
 *       {resolvedMode === 'dark' ? '☀️' : '🌙'}
 *     </button>
 *   );
 * };
 * ```
 */
export interface UseColorModeResult {
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  setMode: (mode: ThemeMode) => void;
}

export const useColorMode = (): UseColorModeResult => {
  const context = React.useContext(ModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within a <ThemeProvider>');
  }
  return context;
};

// ---------------------------------------------------------------------------
// useTokens
// ---------------------------------------------------------------------------

/**
 * Access the current theme's **semantic tokens only** — the structural tree
 * with **unresolved** `TokenRef` values (e.g. `'{core.colors.brand.500}'`).
 *
 * ### Primary use cases
 * - Introspection and devtools
 * - Token path comparison (e.g. checking which tokens differ between themes)
 * - Passing to `createTheme` calls
 *
 * ### ✗ Do not use for styling
 * `TokenRef` values are reference strings, not CSS values. Using them in
 * inline styles produces silently broken rendering:
 *
 * ```tsx
 * // ✗ WRONG — tokens.colors.brand.main is '{core.colors.brand.main}', not '#FF0000'
 * <div style={{ color: tokens.colors.brand.main }} />
 *
 * // ✓ CSS consumers — use vars:
 * <div style={{ color: 'var(--tt-color-brand-main)' }} />
 *
 * // ✓ Non-CSS consumers (React Native, canvas) — use useResolvedTokens():
 * const resolved = useResolvedTokens();
 * <View style={{ backgroundColor: resolved['semantic.colors.action.primary.background.default'] }} />
 * ```
 *
 * Requires `<ThemeProvider theme={...}>`.
 *
 * @example
 * ```tsx
 * import { useTokens } from '@ttoss/theme2/react';
 *
 * const Button = () => {
 *   const tokens = useTokens(); // introspection only
 *   // tokens.colors.action.primary.background.default → '{core.colors.brand.500}'
 *   return <button style={{ background: 'var(--tt-action-primary-background-default)' }} />;
 * };
 * ```
 */
export const useTokens = (): SemanticTokens => {
  const tokens = React.useContext(SemanticTokensCtx);
  const context = React.useContext(ModeContext);

  if (!context) {
    throw new Error('useTokens must be used within a <ThemeProvider>');
  }

  if (tokens === null) {
    throw new Error(
      'useTokens requires a <ThemeProvider theme={...}>. ' +
        'Pass your theme bundle: <ThemeProvider theme={myTheme} />'
    );
  }

  return tokens;
};

// ---------------------------------------------------------------------------
// useResolvedTokens
// ---------------------------------------------------------------------------

/**
 * Access fully resolved token values as a flat `Record<string, string | number>`.
 *
 * All `{ref}` indirections are resolved to their final raw values — hex colors,
 * px sizes, unitless numbers, etc. Keys use `semantic.*` dot-path notation.
 *
 * ### When to use
 * Use in non-CSS environments where CSS custom properties (`var()`) are not
 * available: React Native, canvas renderers, PDF generation, test assertions.
 *
 * ### ✗ Do not use for CSS rendering
 * CSS consumers should use `vars.*` instead for zero-JS rendering:
 *
 * ```tsx
 * // ✓ CSS (browser)
 * <div style={{ color: 'var(--tt-color-content-primary-default)' }} />
 *
 * // ✓ Non-CSS (React Native, canvas)
 * const resolved = useResolvedTokens();
 * <View style={{ backgroundColor: resolved['semantic.colors.action.primary.background.default'] }} />
 * ```
 *
 * Requires `<ThemeProvider theme={...}>`.
 *
 * @example
 * ```tsx
 * import { useResolvedTokens } from '@ttoss/theme2/react';
 *
 * const ReactNativeButton = () => {
 *   const resolved = useResolvedTokens();
 *   return (
 *     <View style={{ backgroundColor: resolved['semantic.colors.action.primary.background.default'] }}>
 *       <Text>Click</Text>
 *     </View>
 *   );
 * };
 * ```
 */
export const useResolvedTokens = (): Record<string, string | number> => {
  const resolved = React.useContext(ResolvedTokensCtx);
  const context = React.useContext(ModeContext);

  if (!context) {
    throw new Error('useResolvedTokens must be used within a <ThemeProvider>');
  }

  if (resolved === null) {
    throw new Error(
      'useResolvedTokens requires a <ThemeProvider theme={...}>. ' +
        'Pass your theme bundle: <ThemeProvider theme={myTheme} />'
    );
  }

  return resolved;
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

// ---------------------------------------------------------------------------
// ThemeStyles
// ---------------------------------------------------------------------------

/**
 * Props for the `ThemeStyles` component.
 */
export interface ThemeStylesProps {
  /** The theme bundle to generate CSS for. */
  theme: ThemeBundle;
  /**
   * Theme identifier for CSS scoping (`[data-tt-theme="<themeId>"]`).
   *
   * **Omit in the canonical 1-theme model** — CSS targets `:root` and the
   * alternate mode selector becomes `:root[data-tt-mode="dark"]`. No theme
   * name repetition required.
   *
   * Pass `themeId` only for multi-theme scenarios (Storybook, micro-frontends,
   * apps with visual theme switching).
   */
  themeId?: string;
  /** CSP nonce for the inline style tag. */
  nonce?: string;
}

/**
 * Renders an inline `<style>` tag with all CSS Custom Properties for a theme
 * bundle — including coarse-pointer, reduced-motion, and container query
 * progressive enhancement blocks.
 *
 * Use as an escape hatch for SSR frameworks that need explicit `<head>` style
 * injection. In most React apps, `<ThemeProvider theme={...}>` already injects
 * styles automatically via React 19 style hoisting — no `<ThemeStyles>` needed.
 *
 * `dangerouslySetInnerHTML` is safe: content comes exclusively from
 * `toCssVars()` (a pure internal function) — no user input is interpolated.
 *
 * @example
 * ```tsx
 * // SSR escape hatch — no themeId needed for canonical 1-theme model
 * import { ThemeScript, ThemeStyles } from '@ttoss/theme2/react';
 * import { createTheme } from '@ttoss/theme2';
 *
 * const myTheme = createTheme();
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <head>
 *         <ThemeScript />
 *         <ThemeStyles theme={myTheme} />
 *       </head>
 *       <body>
 *         <ThemeProvider theme={myTheme}>{children}</ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Multi-theme: explicit themeId for CSS scoping
 * <ThemeStyles theme={brandA} themeId="brand-a" />
 * <ThemeStyles theme={brandB} themeId="brand-b" />
 * ```
 */
export const ThemeStyles = ({ theme, themeId, nonce }: ThemeStylesProps) => {
  return (
    <style
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: getThemeStylesContent(theme, themeId),
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// ThemeHead
// ---------------------------------------------------------------------------

/**
 * Props for the `ThemeHead` component.
 */
export interface ThemeHeadProps extends ThemeStylesProps {
  /** Mode to use when no persisted value is found. @default 'system' */
  defaultMode?: ThemeMode;
  /** localStorage key for persistence. Must match `ThemeProvider`'s `storageKey`. @default 'tt-theme' */
  storageKey?: string;
}

/**
 * Convenience component that renders both `<ThemeScript>` and `<ThemeStyles>`
 * in a single line — the complete SSR `<head>` setup for flash-free theming.
 *
 * Use in SSR frameworks (Next.js, Remix) where you need explicit `<head>`
 * injection. In CSR apps, `<ThemeProvider theme={...}>` handles everything.
 *
 * @example
 * ```tsx
 * // Next.js app/layout.tsx
 * import { ThemeHead, ThemeProvider } from '@ttoss/theme2/react';
 * import { createTheme } from '@ttoss/theme2';
 *
 * const myTheme = createTheme();
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <head>
 *         <ThemeHead theme={myTheme} />
 *       </head>
 *       <body>
 *         <ThemeProvider theme={myTheme}>{children}</ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export const ThemeHead = ({
  theme,
  themeId,
  nonce,
  defaultMode,
  storageKey,
}: ThemeHeadProps) => {
  return (
    <>
      <ThemeScript
        defaultTheme={themeId}
        defaultMode={defaultMode}
        storageKey={storageKey}
        nonce={nonce}
      />
      <ThemeStyles theme={theme} themeId={themeId} nonce={nonce} />
    </>
  );
};
