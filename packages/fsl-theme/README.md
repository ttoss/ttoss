# @ttoss/fsl-theme

Design token system for the ttoss ecosystem. Separates raw values (`core`) from stable design meaning (`semantic`) so components never break when themes change or modes switch. The semantic layer is the public contract — type-safe, mode-agnostic, and consumed directly as CSS custom properties with zero runtime overhead.

## Installation

```bash
pnpm add @ttoss/fsl-theme
```

## Entry points

| Import                     | Exports                                                                                                                                                                     |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ttoss/fsl-theme`         | `createTheme`, `baseTheme`, `darkAlternate`, built-in theme (`bruttal`), types (`ThemeTokens`, `ThemeBundle`, `SemanticTokens`, `ModeOverride`, `DeepPartial`, `ThemeMode`) |
| `@ttoss/fsl-theme/react`   | `ThemeProvider`, `ThemeHead`, `ThemeScript`, `ThemeStyles`, `useColorMode`, `useTokens`, `useResolvedTokens`                                                                |
| `@ttoss/fsl-theme/dataviz` | `withDataviz`, `useDatavizTokens`                                                                                                                                           |
| `@ttoss/fsl-theme/css`     | `getThemeStylesContent`, `toCssVars`, `toCssVarName`, `toFlatTokens`                                                                                                        |
| `@ttoss/fsl-theme/vars`    | `vars`, `buildVarsMap`, type `CssVarsMap`                                                                                                                                   |
| `@ttoss/fsl-theme/dtcg`    | `toDTCG` (W3C Design Tokens format)                                                                                                                                         |
| `@ttoss/fsl-theme/runtime` | `createThemeRuntime`, `getThemeScriptContent`                                                                                                                               |

## Token architecture

```
ThemeTokens
├── core     — raw primitives (immutable across modes)
└── semantic — {core.*} references (the public contract; remapped per mode)
```

Components consume only semantic tokens. Core tokens never change between light and dark — only semantic references remap.

## Token grammar

One entry per semantic family. Use `vars.*` for typed CSS variable references; use the `semantic.*` path shape below when naming tokens in TypeScript or in discussion.

| Family      | Path shape                                                       | Leaf value                      |
| ----------- | ---------------------------------------------------------------- | ------------------------------- |
| colors      | `semantic.colors.{ux}.{role}.{dimension}.{state}`                | CSS color                       |
| spacing     | `semantic.spacing.inset.control.{sm,md,lg}`                      | CSS length (fixed)              |
|             | `semantic.spacing.inset.surface.{xs,sm,md,lg}`                   | CSS length (`xs` fixed)         |
|             | `semantic.spacing.gap.{stack,inline}.{xs,sm,md,lg,xl}`           | CSS length                      |
|             | `semantic.spacing.gutter.{page,section}`                         | CSS length / `clamp()`          |
|             | `semantic.spacing.separation.interactive.min`                    | CSS length                      |
| text        | `semantic.text.{display,headline,title,body,label}.{lg,md,sm}`   | TextStyle object                |
|             | `semantic.text.code.{md,sm}`                                     | TextStyle object                |
| sizing      | `semantic.sizing.hit`                                            | CSS length                      |
|             | `semantic.sizing.icon.{sm,md,lg}`                                | CSS length                      |
|             | `semantic.sizing.identity.{sm,md,lg,xl}`                         | CSS length                      |
|             | `semantic.sizing.measure.reading`                                | CSS `ch` / `clamp()`            |
|             | `semantic.sizing.surface.maxWidth`                               | CSS length                      |
|             | `semantic.sizing.viewport.{height,width}.full`                   | CSS dvh/dvw                     |
| radii       | `semantic.radii.{control,surface,round}`                         | CSS length                      |
| border      | `semantic.border.divider`                                        | `{width, style}`                |
|             | `semantic.border.outline.{surface,control,selected}`             | `{width, style}`                |
| focus       | `semantic.focus.ring`                                            | `{width, style, color, offset}` |
| consequence | `semantic.consequence.destructive.ink`                           | CSS color                       |
| elevation   | `semantic.elevation.surface.{flat,raised,overlay,blocking}`      | CSS box-shadow                  |
|             | `semantic.elevation.tonal.{raised,overlay,blocking}`             | CSS color (optional)            |
| opacity     | `semantic.opacity.{scrim,loading,disabled}`                      | number in (0, 1)                |
| overlay     | `semantic.overlay.scrim`                                         | CSS color with alpha            |
|             | `semantic.overlay.outline`                                       | CSS color                       |
| rail        | `semantic.rail.track`                                            | CSS color                       |
| motion      | `semantic.motion.{feedback,emphasis,decorative}`                 | `{duration, easing}`            |
|             | `semantic.motion.transition.{enter,exit}`                        | `{duration, easing}`            |
| zIndex      | `semantic.zIndex.layer.{base,sticky,overlay,blocking,transient}` | integer                         |

The colors axes (`{ux}`, `{role}`, `{dimension}`, `{state}`) are a formal FSL projection with a normative mapping — including which Entity Kinds collapse into which `ux` value, and which states are legal per `ux`. That grammar is defined once, in [Semantic Color Grammar](https://ttoss.dev/docs/design/design-system/design-tokens/model#semantic-color-grammar--fsl-projection) and the [colors family spec](https://ttoss.dev/docs/design/design-system/design-tokens/families/colors).

## Pick a token

The intent → token cheatsheet — "I want a primary button / a card padding / a focus ring" mapped to the exact token path, for every family — lives in the design docs and is maintained there as the single source: **[Quick Reference](https://ttoss.dev/docs/design/design-system/design-tokens/quick-reference)**.

Agents consuming this package offline get the same mapping from `llms.txt`, shipped in the tarball.

## Per-family specs

Full grammar rules, decision matrices, and anti-patterns live in the family specs:

[colors](https://ttoss.dev/docs/design/design-system/design-tokens/families/colors) · [spacing](https://ttoss.dev/docs/design/design-system/design-tokens/families/spacing) · [typography](https://ttoss.dev/docs/design/design-system/design-tokens/families/typography) · [sizing](https://ttoss.dev/docs/design/design-system/design-tokens/families/sizing) · [radii](https://ttoss.dev/docs/design/design-system/design-tokens/families/radii) · [borders](https://ttoss.dev/docs/design/design-system/design-tokens/families/borders) · [elevation](https://ttoss.dev/docs/design/design-system/design-tokens/families/elevation) · [opacity](https://ttoss.dev/docs/design/design-system/design-tokens/families/opacity) · [motion](https://ttoss.dev/docs/design/design-system/design-tokens/families/motion) · [z-index](https://ttoss.dev/docs/design/design-system/design-tokens/families/z-index) · [breakpoints](https://ttoss.dev/docs/design/design-system/design-tokens/families/breakpoints)

## createTheme

```ts
import { createTheme } from '@ttoss/fsl-theme';

// Default — light base + built-in dark alternate included
const myTheme = createTheme();

// With brand overrides (dark mode still included)
const myTheme = createTheme({
  overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
});

// Custom semantic dark alternate
const myTheme = createTheme({
  overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
  alternate: {
    semantic: {
      colors: {
        informational: {
          primary: { background: { default: '{core.colors.neutral.900}' } },
        },
      },
    },
  },
});

// Single-mode theme (opt out of dark alternate)
const myTheme = createTheme({ alternate: null });

// Inherit from an existing bundle (inherits base + alternate)
const childTheme = createTheme({ extends: myTheme });
```

**`alternate`** is typed `ModeOverride = { semantic: DeepPartial<ThemeTokens['semantic']> }`. Pass `alternate: null` for single-mode.

**`darkAlternate`** is also exported for direct composition. `createTheme()` includes it by default.

## React (Vite / CRA)

```tsx
// main.tsx
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { myTheme } from './theme';

export const App = () => (
  <ThemeProvider theme={myTheme} defaultMode="system">
    <YourApp />
  </ThemeProvider>
);
```

`ThemeProvider` injects CSS Custom Properties via React 19 style hoisting, persists mode to localStorage, and keeps open tabs in sync via the `storage` event. The react entry point ships with `'use client'`, so it can be imported directly from a Next.js App Router layout.

### Hooks

```tsx
import { useColorMode } from '@ttoss/fsl-theme/react';

const DarkToggle = () => {
  const { resolvedMode, setMode } = useColorMode();
  return (
    <button onClick={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}>
      {resolvedMode === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};
```

```tsx
import { useResolvedTokens } from '@ttoss/fsl-theme/react';

// Non-CSS environments (React Native, canvas) — resolved raw values
const resolved = useResolvedTokens();
// resolved['semantic.colors.action.primary.background.default'] → '#020617'
// ⚠ CSS-coupled tokens (spacing steps, fluid text sizes, hit/viewport sizing —
// see model.md §8) stay as CSS expressions (var()/calc()/clamp()/cqi) and are
// not usable outside a CSS engine. Colors and scalar tokens resolve fully.
```

### Consuming tokens

```css
/* CSS — no JS overhead, no re-renders */
.button {
  background: var(--tt-colors-action-primary-background-default);
}
```

```tsx
import { vars } from '@ttoss/fsl-theme/vars';

// Typed CSS variable references
<div style={{ color: vars.colors.informational.primary.background.default }} />;
```

### Extending `vars` with custom semantic tokens

`vars` is typed against the default `SemanticTokens` shape. If your project adds custom families (e.g. a dataviz palette, project-specific component tokens), those leaves won't appear on the default export. Build a typed mirror of your extended shape with the public `buildVarsMap` helper:

```ts
import { createTheme, type SemanticTokens } from '@ttoss/fsl-theme';
import { buildVarsMap, type CssVarsMap } from '@ttoss/fsl-theme/vars';

type MySemanticTokens = SemanticTokens & {
  colors: SemanticTokens['colors'] & {
    brandX: { primary: { default: string } };
  };
};

const myTheme = createTheme({
  /* … */
});

export const myVars: CssVarsMap<MySemanticTokens> = buildVarsMap(
  myTheme.base
) as CssVarsMap<MySemanticTokens>;
```

For one-off custom keys, use `toCssVarName` from `@ttoss/fsl-theme/css` directly — no extended type required.

The first-party dataviz extension ships its own mirror — import `datavizVars` from `@ttoss/fsl-theme/dataviz` instead of hand-rolling this recipe (e.g. `datavizVars.color.series[1]` → `'var(--tt-dataviz-color-series-1)'`).

## Next.js (SSR)

### React 19 App Router (recommended)

`ThemeProvider` with a `theme` prop uses React 19 style hoisting to inject CSS into `<head>` automatically. The injected `<style>` carries a stable `href` (`tt-theme-<themeId|root>`), so multiple providers or a re-render collapse to a single tag instead of duplicating. Only add `ThemeScript` for flash-prevention:

> **React 18:** auto-injection into `<head>` requires React 19 style hoisting. On React 18 the `<ThemeProvider>` `<style>` renders inline where the provider sits — use the `ThemeHead` / `ThemeStyles` path below to place CSS in `<head>` explicitly.

```tsx
// app/layout.tsx
import { ThemeScript, ThemeProvider } from '@ttoss/fsl-theme/react';
import { myTheme } from './theme';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Flash-prevention only — ThemeProvider handles CSS via React 19 hoisting */}
        <ThemeScript defaultMode="system" />
      </head>
      <body>
        <ThemeProvider theme={myTheme} defaultMode="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Non-React-19 SSR / no style hoisting

Use `ThemeHead` (script + CSS) **without** a `theme` prop on `ThemeProvider` — or use `ThemeHead` standalone when
React style hoisting is unavailable:

```tsx
// app/layout.tsx — for frameworks without React 19 style hoisting
import { ThemeHead, ThemeProvider } from '@ttoss/fsl-theme/react';
import { myTheme } from './theme';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Injects flash-prevention script + CSS vars */}
        <ThemeHead theme={myTheme} defaultMode="system" />
      </head>
      <body>
        {/* No theme prop — CSS is already in <head> via ThemeHead */}
        <ThemeProvider defaultMode="system">{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

> **Warning:** Do not pass `theme` to **both** `<ThemeHead>` and `<ThemeProvider>`. `ThemeHead` injects a plain `<style>`; `ThemeProvider` injects a React-19-hoisted `<style>` — different mechanisms that do **not** dedup against each other, so you get duplicate CSS. Pass `theme` to the head component only; the body `<ThemeProvider>` (no `theme`) manages mode. (Multiple `<ThemeProvider theme={...}>` on React 19 _do_ dedup, via the shared `href`.)

## Dataviz extension

```ts
// theme.ts
import { createTheme } from '@ttoss/fsl-theme';
import { withDataviz } from '@ttoss/fsl-theme/dataviz';

export const myTheme = withDataviz(createTheme());
```

```tsx
// Consume via CSS vars — no JS overhead
<span style={{ color: `var(--tt-dataviz-color-series-${i + 1})` }}>
  {category}
</span>
```

## CSS generation (server / build-time)

```ts
import { getThemeStylesContent } from '@ttoss/fsl-theme/css';

const css = getThemeStylesContent(myTheme);
// → :root { --tt-* } + :root[data-tt-mode="dark"] { --tt-* (overrides) }
//   + @media (prefers-color-scheme: dark) fallback for no-JS / pre-hydration

// Fixed light/dark default (dark only via explicit toggle)? Skip the OS fallback:
const lightFirstCss = getThemeStylesContent(myTheme, undefined, {
  systemModeFallback: false,
});
// <ThemeProvider> / <ThemeHead> derive this automatically from `defaultMode`.
```

## Storybook / micro-frontends

Anchor theme attributes to a specific element instead of `<html>`. Always pair `root` with a `themeId` — without one, the CSS targets `:root` on `<html>` while the attributes land on the element, and the alternate mode would never apply (a dev warning fires on this combination):

```tsx
const rootRef = React.useRef<HTMLDivElement>(null);
<div ref={rootRef}>
  <ThemeProvider theme={myTheme} themeId="story" root={rootRef}>
    <Story />
  </ThemeProvider>
</div>;
```
