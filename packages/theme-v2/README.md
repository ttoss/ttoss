# @ttoss/theme2

Type-safe design tokens engine for the ttoss ecosystem. Two-layer token architecture (core → semantic), built-in themes, adapters for Chakra UI v3 / Tailwind CSS / CSS custom properties, and a framework-agnostic runtime for theme/mode switching with SSR support.

## Installation

```bash
pnpm add @ttoss/theme2
```

## Quick Start

### Chakra UI v3

```ts
import { themes, toChakraTheme } from '@ttoss/theme2';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

const system = createSystem(defaultConfig, toChakraTheme(themes.bruttal));

export const App = ({ children }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);
```

### CSS Custom Properties + Runtime

```ts
import { themes, toCssVars, createThemeRuntime } from '@ttoss/theme2';

// Generate CSS for each theme
const defaultCss = toCssVars(themes.default).toCssString();
const bruttalCss = toCssVars(themes.bruttal, {
  themeId: 'bruttal',
}).toCssString();

// Switch themes at runtime (client-only)
const runtime = createThemeRuntime({
  defaultTheme: 'bruttal',
  defaultMode: 'system',
});
runtime.setTheme('oca');
runtime.setMode('dark');
```

## Token Architecture

```
ThemeTokensV2
├── core    — raw primitives (colors, fonts, spacing, radii, motion, etc.)
└── semantic — stable aliases via {core.*} references (the only layer components consume)
```

Components must **never** consume core tokens directly. Semantic tokens must **only** contain `{core.*}` references, not raw values.

## Creating Themes

```ts
import { createTheme, defaultTheme } from '@ttoss/theme2';

const myTheme = createTheme({
  overrides: {
    core: {
      colors: { brand: { main: '#FF4500', accent: '#D4A017' } },
    },
  },
});

// Theme inheritance
const child = createTheme({
  base: myTheme,
  overrides: { core: { radii: { md: '16px' } } },
});
```

`createTheme` deep-merges overrides into the base and returns a fully independent clone — mutations never propagate between themes.

## Adapters

### `toChakraTheme(theme)` → Chakra UI v3

```ts
import { createSystem, defaultConfig } from '@chakra-ui/react';
const system = createSystem(defaultConfig, toChakraTheme(themes.bruttal));
```

Returns `{ theme: { tokens, semanticTokens, textStyles }, breakpoints }`.

### `toTailwindTheme(theme)` → Tailwind CSS

```ts
const tw = toTailwindTheme(themes.default);
const css = tw.toCssString(); // :root { --tt-color-brand-main: #292C2a; ... }
// tw.config — Tailwind theme config referencing CSS vars
```

### `toCssVars(theme, options?)` → CSS Custom Properties

```ts
// :root baseline
toCssVars(themes.default).toCssString();

// Scoped by theme
toCssVars(themes.bruttal, { themeId: 'bruttal' }).toCssString();
// → [data-tt-theme="bruttal"] { --tt-color-brand-main: #0A0A0A; ... }

// Scoped by theme + mode
toCssVars(darkTheme, {
  themeId: 'bruttal',
  mode: 'dark',
  colorScheme: 'dark',
}).toCssString();
// → [data-tt-theme="bruttal"][data-tt-mode="dark"] { color-scheme: dark; ... }
```

## Runtime

### `createThemeRuntime(config?)`

Framework-agnostic, client-only. Manages `data-tt-theme` / `data-tt-mode` attributes, `color-scheme` style, localStorage persistence, and `prefers-color-scheme` listener.

```ts
const runtime = createThemeRuntime({
  defaultTheme: 'bruttal',
  defaultMode: 'system',
});

runtime.getState(); // { themeId, mode, resolvedMode }
runtime.setTheme('oca');
runtime.setMode('dark');
runtime.subscribe(console.log);
runtime.destroy();
```

### SSR — Preventing Theme Flash

```tsx
// Next.js app/layout.tsx
import { getThemeScriptContent } from '@ttoss/theme2';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeScriptContent() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## React Integration

Import from `@ttoss/theme2/react` (React is an optional peer dependency):

```tsx
import { ThemeProvider, ThemeScript, useTheme } from '@ttoss/theme2/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <ThemeScript defaultTheme="bruttal" />
      </head>
      <body>
        <ThemeProvider defaultTheme="bruttal">{children}</ThemeProvider>
      </body>
    </html>
  );
}

// In any component inside ThemeProvider
const { themeId, mode, resolvedMode, setTheme, setMode } = useTheme();
```

## Built-in Themes

| Theme     | Palette                                      |
| --------- | -------------------------------------------- |
| `default` | Neutral baseline, system fonts, gray palette |
| `bruttal` | Bold contrasts, dark neutrals, zero radii    |
| `oca`     | Natural greens, organic warmth               |
| `aurora`  | Cool-toned purples, rounded surfaces         |
| `terra`   | Warm amber/olive, grounded feel              |
| `neon`    | Vibrant accents, dark backgrounds            |
