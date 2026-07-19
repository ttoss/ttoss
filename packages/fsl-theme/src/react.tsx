'use client';

import * as React from 'react';

import { getThemeStylesContent } from './css';
import { deepMerge, toFlatTokens } from './roots/helpers';
import { PREFLIGHT_CSS } from './roots/preflight';
import {
  createThemeRuntime,
  type ResolvedMode,
  type ThemeMode,
  type ThemeRuntime,
  type ThemeState,
} from './runtime';
import { getThemeScriptContent, type ThemeScriptConfig } from './ssrScript';
import type { SemanticTokens, ThemeBundle, ThemeTokens } from './Types';

// ---------------------------------------------------------------------------
// Hoisted-style dedup key
// ---------------------------------------------------------------------------

/**
 * Stable `href` for the theme's hoistable `<style>` tag. React 19 keys style
 * hoisting **and dedup** on `href` + `precedence`, so re-renders and multiple
 * `<ThemeProvider>`s sharing a `themeId` collapse to a single tag, while
 * distinct `themeId`s coexist (micro-frontends). Note: `ThemeStyles` /
 * `ThemeHead` render an href-less inline `<style>`, so they do **not** dedup
 * against this hoisted tag — don't combine them with a themed `ThemeProvider`.
 */
const themeStyleHref = (themeId?: string): string => {
  return `tt-theme-${themeId ?? 'root'}`;
};

/**
 * DEV-only registry of injected theme CSS per hoisted-style `href`.
 * React dedups hoisted `<style>` tags by `href`, so two providers with
 * *different* themes but the same `href` silently drop the second theme's
 * CSS. This registry detects that mismatch and warns.
 */
const injectedThemeCss = new Map<string, { css: string; count: number }>();

/**
 * Runs on the client before paint; falls back to `useEffect` on the server
 * so SSR renders never warn. Used for the runtime-creation effect so
 * `data-tt-*` attributes land before first paint in CSR apps (less mode flash).
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/**
 * Accepted shapes for the `root` prop: a concrete element, or a ref object.
 * Prefer the ref form — refs are populated before layout effects run, so the
 * runtime attaches directly to the target element with no transient attach
 * to `<html>` on the first render (the element form is `null` during the
 * first render when read from `ref.current`).
 */
type ThemeRootInput = HTMLElement | React.RefObject<HTMLElement | null>;

const resolveRootElement = (
  root: ThemeRootInput | undefined
): HTMLElement | undefined => {
  if (!root) return undefined;
  if (root instanceof HTMLElement) return root;
  return root.current ?? undefined;
};

/**
 * The OS-preference CSS fallback only makes sense when the app follows the
 * OS. A fixed `'light'`/`'dark'` default must not let `prefers-color-scheme`
 * override it on first paint.
 */
const shouldEmitSystemFallback = (
  defaultMode: ThemeMode | undefined
): boolean => {
  return (defaultMode ?? 'system') === 'system';
};

/**
 * DEV-only: warn when two providers with different themes share the same
 * hoisted-style `href` — React dedups by href, so the second theme's CSS is
 * silently dropped. Distinct `themeId`s give distinct hrefs and coexist.
 */
const useDedupMismatchWarning = (
  cssContent: string | null,
  themeId: string | undefined
): void => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !cssContent) return;
    const href = themeStyleHref(themeId);
    const entry = injectedThemeCss.get(href);
    if (entry && entry.css !== cssContent) {
      // eslint-disable-next-line no-console
      console.warn(
        `[fsl-theme] Two <ThemeProvider>s with different themes share the same ` +
          `style key "${href}". React dedups hoisted <style> tags by href, so ` +
          `only the first theme's CSS is injected. Give each theme a distinct ` +
          `themeId: <ThemeProvider theme={...} themeId="my-theme">.`
      );
      // Fall through and register anyway (entry.css stays first-wins, matching
      // React's behavior) so the count survives the first provider unmounting
      // and a later conflicting mount still warns.
    }
    const next = entry ?? { css: cssContent, count: 0 };
    next.count += 1;
    injectedThemeCss.set(href, next);
    return () => {
      const current = injectedThemeCss.get(href);
      if (!current) return;
      current.count -= 1;
      if (current.count <= 0) injectedThemeCss.delete(href);
    };
  }, [cssContent, themeId]);
};

// ---------------------------------------------------------------------------
// Coarse-pointer detection — bridges the hit.fine/hit.coarse coupling for
// non-CSS consumers (useResolvedTokens). CSS consumers are handled
// automatically by the @media (any-pointer: coarse) block in toCssVars.
// ---------------------------------------------------------------------------

const COARSE_QUERY = '(any-pointer: coarse)';

/**
 * Subscribe to coarse-pointer media query changes.
 * Returns `true` when the device has at least one coarse pointer (touch).
 * Returns `false` on SSR or when `matchMedia` is unavailable (React Native).
 */
const useCoarsePointer = (): boolean => {
  const [isCoarse, setIsCoarse] = React.useState(() => {
    return typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
      ? window.matchMedia(COARSE_QUERY).matches
      : false;
  });

  React.useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }
    const mql = window.matchMedia(COARSE_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      return setIsCoarse(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => {
      return mql.removeEventListener('change', handler);
    };
  }, []);

  return isCoarse;
};

/**
 * Apply coarse-pointer hit target overrides to a resolved token map.
 *
 * When `isCoarse` is true, replaces the `semantic.sizing.hit` value with the
 * raw coarse value from `core.sizing.hit.coarse`. This mirrors the
 * `@media (any-pointer: coarse)` block that `toCssVars` emits for CSS
 * consumers — ensuring non-CSS consumers (React Native, canvas) get
 * touch-appropriate hit targets.
 */
const applyCoarseHitOverrides = (
  tokens: Record<string, string | number>,
  theme: ThemeTokens,
  isCoarse: boolean
): Record<string, string | number> => {
  if (!isCoarse) return tokens;

  return { ...tokens, 'semantic.sizing.hit': theme.core.sizing.hit.coarse };
};

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

interface ModeCtxValue {
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  setMode: (mode: ThemeMode) => void;
}

const ModeCtx = React.createContext<ModeCtxValue | null>(null);

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
   * Theme identifier written to `data-tt-theme`. Reactive — changing this
   * prop recreates the runtime and rewrites the attribute so the browser
   * matches the scoped CSS (e.g. `[data-tt-theme="<id>"]`). Provide only
   * for MFE / multi-theme CSS scoping (Storybook toolbar, runtime theme swap).
   */
  themeId?: string;
  /**
   * The theme bundle for the app — the canonical 1-theme / 2-mode model.
   *
   * Passing `theme` enables `useTokens()` and `useResolvedTokens()` for all
   * descendants, and automatically injects the CSS Custom Properties `<style>`
   * tag into the document head (React 19 hoisting, deduped by `href`).
   *
   * **React version:** auto-injection into `<head>` requires **React 19** style
   * hoisting. On React 18 the `<style>` renders inline where the provider sits
   * (not hoisted); use `<ThemeHead>` / `<ThemeStyles>` in your `<head>` for
   * explicit injection there — but do not also pass `theme` here, since the
   * href-less `<ThemeHead>`/`<ThemeStyles>` tag does not dedup against this
   * provider's href-keyed one. The stable `href` only collapses multiple themed
   * `<ThemeProvider>`s sharing a `themeId` into one tag on 19.
   *
   * @example
   * ```tsx
   * import { createTheme } from '@ttoss/fsl-theme';
   * import { ThemeProvider } from '@ttoss/fsl-theme/react';
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
   * **System mode:** when `mode` is `'system'`, this callback fires whenever
   * the OS `prefers-color-scheme` changes (e.g. automatic dark mode at sunset)
   * — without any user interaction. Avoid side-effects that should only happen
   * on explicit user action (e.g. API calls, toast notifications):
   *
   * ```tsx
   * onModeChange={(mode, resolvedMode) => {
   *   // ✓ safe for system-triggered changes
   *   analytics.track('modeChanged', { mode, resolvedMode });
   *
   *   // ✗ guard explicit user actions
   *   if (mode !== 'system') showToast('Theme updated');
   * }}
   * ```
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
   * Defaults to `document.documentElement`. Pass a container for Storybook
   * isolation or micro-frontend use cases.
   *
   * **Must be paired with `themeId`.** Without a `themeId`, the generated CSS
   * targets `:root` / `:root[data-tt-mode="dark"]` (the `<html>` element),
   * while the attributes are written to this element — the alternate mode CSS
   * would never match. A dev-mode warning fires on this combination.
   *
   * **Prefer passing the ref object itself** (`root={rootRef}`): refs are
   * populated before layout effects, so the runtime attaches directly to the
   * element. Passing `rootRef.current ?? undefined` also works, but the value
   * is `null` on the first render, causing one transient attach to `<html>`
   * before the runtime is recreated on the element.
   *
   * @example
   * ```tsx
   * // Storybook decorator — isolates each story from <html>
   * const rootRef = React.useRef<HTMLDivElement>(null);
   * <div ref={rootRef}>
   *   <ThemeProvider theme={myTheme} themeId="story" root={rootRef}>
   *     <Story />
   *   </ThemeProvider>
   * </div>
   * ```
   */
  root?: ThemeRootInput;
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
 * import { ThemeProvider } from '@ttoss/fsl-theme/react';
 * import { createTheme } from '@ttoss/fsl-theme';
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
  // useState initializers never re-run, so a parent re-rendering with new
  // (but semantically identical) literal values cannot recreate the runtime,
  // matching the documented "only read on initial mount" contract. (State,
  // not refs — these are also read during render, where refs are illegal.)
  const [initialDefaultMode] = React.useState(defaultMode);
  const [initialStorageKey] = React.useState(storageKey);

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

  // `root` and `themeId` are reactive: the runtime is recreated when either
  // changes so `data-tt-theme` tracks the active theme (Storybook toolbar,
  // MFE theme swap). `defaultMode` and `storageKey` remain init-only and are
  // captured in refs; mode state is preserved across recreations via
  // localStorage.
  // An ancestor's ref is not yet populated while this (descendant) layout
  // effect first runs — React attaches refs bottom-up, after descendant
  // effects. Bumping state from a layout effect forces a synchronous
  // re-render *before paint*; by that second pass the ancestor's ref is
  // attached, so a ref-object `root` binds directly to its element with no
  // transient attach to <html>. One retry only — a permanently-null ref
  // then falls back to `document.documentElement` (same as the element form).
  const [rootRetry, setRootRetry] = React.useState(0);

  useIsomorphicLayoutEffect(() => {
    const rootPending =
      root !== undefined &&
      !(root instanceof HTMLElement) &&
      root.current === null;
    if (rootPending && rootRetry === 0) {
      setRootRetry(1);
      return;
    }

    if (process.env.NODE_ENV !== 'production' && root && !themeId) {
      // eslint-disable-next-line no-console
      console.warn(
        '[fsl-theme] `root` was passed without `themeId`. Without a themeId, ' +
          'the generated CSS targets `:root`/`:root[data-tt-mode="dark"]` on <html>, ' +
          'but mode attributes are written to the `root` element — the alternate ' +
          'mode CSS will never match. Pass a `themeId` so CSS is scoped to ' +
          '`[data-tt-theme="<id>"]` selectors that match the `root` element.'
      );
    }

    const runtime = createThemeRuntime({
      defaultTheme: themeId,
      defaultMode: initialDefaultMode,
      storageKey: initialStorageKey,
      root: resolveRootElement(root),
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
  }, [root, themeId, rootRetry]);

  const setMode = React.useCallback((mode: ThemeMode) => {
    runtimeRef.current?.setMode(mode);
  }, []);

  // Resolve semantic tokens for current theme + mode. Re-computed only when
  // theme or resolvedMode changes — zero overhead otherwise.
  const semanticTokens = React.useMemo(() => {
    return theme ? resolveSemanticTokens(theme, state.resolvedMode) : null;
  }, [theme, state.resolvedMode]);

  // Coarse-pointer detection for non-CSS consumers (useResolvedTokens).
  // CSS consumers are already covered by the @media block in toCssVars.
  const isCoarse = useCoarsePointer();

  // Resolved flat token map — semantic.* keys only, all refs resolved to
  // raw values. Used by useResolvedTokens() for non-CSS environments.
  // When a coarse pointer is detected, hit target tokens are overridden
  // with the touch-appropriate values from core.sizing.hit.coarse.
  const resolvedTokens = React.useMemo((): Record<
    string,
    string | number
  > | null => {
    if (!theme || !semanticTokens) return null;

    const effectiveTheme: ThemeTokens = {
      core: theme.base.core,
      semantic: semanticTokens,
    };
    const all = toFlatTokens(effectiveTheme);

    const result: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith('semantic.')) {
        result[key] = value;
      }
    }
    return applyCoarseHitOverrides(result, theme.base, isCoarse);
  }, [theme, semanticTokens, isCoarse]);

  // CSS content for the theme bundle — memoized to avoid recomputing on
  // every render. Recalculated when theme or themeId changes so the injected
  // <style> stays in sync with the `data-tt-theme` attribute the runtime
  // writes to the DOM (scoped selector matches the active theme).
  const cssContent = React.useMemo(() => {
    return theme
      ? getThemeStylesContent(theme, themeId, {
          systemModeFallback: shouldEmitSystemFallback(initialDefaultMode),
        })
      : null;
  }, [theme, themeId]);

  useDedupMismatchWarning(cssContent, themeId);

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

  // ModeCtx value is memoized separately so that useColorMode() consumers
  // only re-render on mode changes — never on themeId changes.
  const modeCtxValue = React.useMemo<ModeCtxValue>(() => {
    return { mode: state.mode, resolvedMode: state.resolvedMode, setMode };
  }, [state.mode, state.resolvedMode, setMode]);

  const coreNode = (
    <ModeCtx.Provider value={modeCtxValue}>{children}</ModeCtx.Provider>
  );

  if (theme) {
    return (
      <>
        <style href={themeStyleHref(themeId)} precedence="default">
          {cssContent}
        </style>
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
 * import { useColorMode } from '@ttoss/fsl-theme/react';
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
  const context = React.useContext(ModeCtx);
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
 * // ✗ WRONG — the leaf is '{core.colors.neutral.1000}' (a ref string), not a CSS color
 * <div style={{ color: tokens.colors.action.primary.text.default }} />
 *
 * // ✓ CSS consumers — use vars:
 * <div style={{ color: 'var(--tt-colors-action-primary-text-default)' }} />
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
 * import { useTokens } from '@ttoss/fsl-theme/react';
 *
 * const Button = () => {
 *   const tokens = useTokens(); // introspection only
 *   // tokens.colors.action.primary.background.default → '{core.colors.neutral.1000}'
 *   return <button style={{ background: 'var(--tt-colors-action-primary-background-default)' }} />;
 * };
 * ```
 */
export const useTokens = (): SemanticTokens => {
  const tokens = React.useContext(SemanticTokensCtx);
  const context = React.useContext(ModeCtx);

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
 * <div style={{ color: 'var(--tt-colors-informational-primary-text-default)' }} />
 *
 * // ✓ Non-CSS (React Native, canvas)
 * const resolved = useResolvedTokens();
 * <View style={{ backgroundColor: resolved['semantic.colors.action.primary.background.default'] }} />
 * ```
 *
 * ### ⚠ CSS-coupled tokens stay unresolved
 * A registered set of dimensional tokens (model.md §8 — spacing steps, fluid
 * `text.*.fontSize`, `sizing.hit`, `sizing.viewport.*`, `sizing.measure.reading`,
 * `spacing.gutter.*`) carry CSS-only constructs (`var()`, `calc()`, `clamp()`,
 * `cqi`, `dvh`, `ch`). This hook returns those **as-is** — they are not usable
 * outside a CSS engine. Colors, opacity, z-index, font weights/leading and
 * other scalar tokens resolve to plain raw values and are safe everywhere.
 *
 * Requires `<ThemeProvider theme={...}>`.
 *
 * @example
 * ```tsx
 * import { useResolvedTokens } from '@ttoss/fsl-theme/react';
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
  const context = React.useContext(ModeCtx);

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
 * import { ThemeScript } from '@ttoss/fsl-theme/react';
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
  /**
   * Emit the `@media (prefers-color-scheme)` fallback block (themeId-less
   * bundles only). Default `true`. Set `false` when the app's `defaultMode`
   * is a fixed `'light'`/`'dark'` rather than `'system'` — `<ThemeHead>`
   * derives this automatically from its `defaultMode`.
   */
  systemModeFallback?: boolean;
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
 * Renders a plain inline `<style>` where you place it (put it in `<head>`).
 * Do **not** also pass `theme` to `<ThemeProvider>` — that injects a second
 * copy; pass `theme` to the head component only (see README SSR section).
 *
 * @example
 * ```tsx
 * // SSR escape hatch — no themeId needed for canonical 1-theme model
 * import { ThemeScript, ThemeStyles } from '@ttoss/fsl-theme/react';
 * import { createTheme } from '@ttoss/fsl-theme';
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
export const ThemeStyles = ({
  theme,
  themeId,
  nonce,
  systemModeFallback,
}: ThemeStylesProps) => {
  return (
    <style
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: getThemeStylesContent(theme, themeId, { systemModeFallback }),
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// ThemeReset
// ---------------------------------------------------------------------------

/** Props for the `ThemeReset` component. */
export interface ThemeResetProps {
  /** CSP nonce forwarded to the injected `<style>` element. */
  nonce?: string;
}

/**
 * Injects the theme's base stylesheet (the {@link PREFLIGHT_CSS} preflight):
 * a box-sizing reset, the document body's default typography and colour drawn
 * from the semantic tokens, and the global reduced-motion guard. Render it
 * once at the app root, alongside `<ThemeProvider>` / `<ThemeStyles>` — so the
 * base layer is the theme's responsibility, not hand-written per app.
 *
 * It sets no widths, heights, or component styling (those belong to
 * `@ttoss/fsl-ui` and the app). Requires the `--tt-*` custom properties to be
 * present on the page.
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={theme}>
 *   <ThemeReset />
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeReset = ({ nonce }: ThemeResetProps = {}) => {
  return (
    <style nonce={nonce} dangerouslySetInnerHTML={{ __html: PREFLIGHT_CSS }} />
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
 * **`storageKey` invariant:** `ThemeHead` forwards `storageKey` to `ThemeScript`,
 * which reads localStorage before the first paint. `ThemeProvider` reads the
 * same key at runtime. If you pass a custom `storageKey`, pass the **same value**
 * to both `<ThemeHead>` and `<ThemeProvider>` — a mismatch causes a theme flash
 * exactly in the scenario this component was designed to prevent.
 *
 * @example
 * ```tsx
 * // Next.js app/layout.tsx
 * import { ThemeHead, ThemeProvider } from '@ttoss/fsl-theme/react';
 * import { createTheme } from '@ttoss/fsl-theme';
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
 *
 * @example
 * ```tsx
 * // Custom storageKey — must be identical on both sides
 * <ThemeHead theme={myTheme} storageKey="my-app-theme" />
 * // ...
 * <ThemeProvider theme={myTheme} storageKey="my-app-theme">{children}</ThemeProvider>
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
      <ThemeStyles
        theme={theme}
        themeId={themeId}
        nonce={nonce}
        systemModeFallback={shouldEmitSystemFallback(defaultMode)}
      />
    </>
  );
};
