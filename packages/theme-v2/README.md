# @ttoss/theme2

Type-safe design tokens for the ttoss ecosystem. Two-layer architecture (core → semantic), light/dark mode, React 19 style hoisting, SSR support.

## Installation

```bash
pnpm add @ttoss/theme2
```

## Entry points

| Import                  | Exports                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@ttoss/theme2`         | `createTheme`, `darkAlternate`, types                                                                        |
| `@ttoss/theme2/react`   | `ThemeProvider`, `ThemeHead`, `ThemeScript`, `ThemeStyles`, `useColorMode`, `useTokens`, `useResolvedTokens` |
| `@ttoss/theme2/dataviz` | `withDataviz`, `useDatavizTokens`                                                                            |
| `@ttoss/theme2/css`     | `getThemeStylesContent`, `toCssVars`, `toFlatTokens`                                                         |
| `@ttoss/theme2/vars`    | Static typed `vars.*` CSS variable references                                                                |
| `@ttoss/theme2/dtcg`    | `toDTCG` (W3C Design Tokens format)                                                                          |
| `@ttoss/theme2/runtime` | `createThemeRuntime`, `getThemeScriptContent`                                                                |

## Token architecture

```
ThemeTokensV2
├── core     — raw primitives (immutable across modes)
└── semantic — usage aliases, always {core.*} refs (remapped per mode)
```

Components consume only semantic tokens. Core tokens never change between light and dark — only semantic references remap.

## createTheme

```ts
import { createTheme } from '@ttoss/theme2';

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
        content: {
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

**`alternate`** is typed `ModeOverride = { semantic: DeepPartial<ThemeTokensV2['semantic']> }`. Core tokens are immutable across modes — only semantic references remap.

**Default**: `createTheme()` includes the built-in `darkAlternate`. Pass `alternate: null` to opt out (single-mode).

**`darkAlternate`** is also exported from `@ttoss/theme2` for direct composition.

## React (Vite / CRA)

```tsx
// main.tsx
import { ThemeProvider } from '@ttoss/theme2/react';
import { myTheme } from './theme';

export const App = () => (
  <ThemeProvider theme={myTheme} defaultMode="system">
    <YourApp />
  </ThemeProvider>
);
```

`ThemeProvider` injects CSS Custom Properties via React 19 style hoisting and persists mode to localStorage.

### Hooks

```tsx
import { useColorMode } from '@ttoss/theme2/react';

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
import { useResolvedTokens } from '@ttoss/theme2/react';

// Non-CSS environments (React Native, canvas) — resolved raw values
const resolved = useResolvedTokens();
// resolved['semantic.colors.action.primary.background.default'] → '#0469E3'
```

### Consuming tokens

```css
/* CSS — no JS overhead, no re-renders */
.button {
  background: var(--tt-action-primary-background-default);
}
```

```tsx
import { vars } from '@ttoss/theme2/vars';

// Typed CSS variable references
<div style={{ color: vars.colors.content.primary.default }} />;
```

## Next.js (SSR)

### React 19 App Router (recommended)

`ThemeProvider` with a `theme` prop uses React 19 style hoisting to inject CSS into `<head>` automatically. Only add `ThemeScript` for flash-prevention:

```tsx
// app/layout.tsx
import { ThemeScript, ThemeProvider } from '@ttoss/theme2/react';
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
import { ThemeHead, ThemeProvider } from '@ttoss/theme2/react';
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

> **Warning:** Do not combine `<ThemeHead theme={...}>` with `<ThemeProvider theme={...}>`. Both inject CSS — `ThemeHead` via a plain `<style>` tag and `ThemeProvider` via React 19 style hoisting — resulting in duplicate CSS in the document. Use one or the other.

## Dataviz extension

```ts
// theme.ts
import { createTheme } from '@ttoss/theme2';
import { withDataviz } from '@ttoss/theme2/dataviz';

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
import { getThemeStylesContent } from '@ttoss/theme2/css';

const css = getThemeStylesContent(myTheme);
// → :root { --tt-* } + :root[data-tt-mode="dark"] { --tt-* (overrides) }
```

## Storybook / micro-frontends

Anchor theme attributes to a specific element instead of `<html>`:

```tsx
const rootRef = React.useRef<HTMLDivElement>(null);
<div ref={rootRef}>
  <ThemeProvider theme={myTheme} root={rootRef.current ?? undefined}>
    <Story />
  </ThemeProvider>
</div>;
```
