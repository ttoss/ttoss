# @ttoss/theme2

Type-safe design tokens engine for the ttoss ecosystem. Two-layer token architecture (core → semantic), built-in themes with light/dark mode support, three universal root exports (CSS Custom Properties, Flat Token Map, W3C DTCG), and a framework-agnostic runtime for theme/mode switching with SSR support.

## Installation

```bash
pnpm add @ttoss/theme2
```

## Token Architecture

```
ThemeTokensV2
├── core     — raw primitives (colors, fonts, spacing, radii, motion, etc.)
└── semantic — stable aliases via {core.*} references (the only layer components consume)
```

Components **never** consume core tokens directly. Semantic tokens **only** contain `{core.*}` references, not raw values.

## Quick Start

```ts
import { bundles, bundleToCssVars, createThemeRuntime } from '@ttoss/theme2';

// Generate CSS with light + dark mode support
const css = bundleToCssVars(bundles.default, {
  themeId: 'default',
}).toCssString();
// → base block (all vars) + dark block (diff only) + coarse pointer blocks

// Switch themes and modes at runtime (client-only)
const runtime = createThemeRuntime({
  defaultTheme: 'default',
  defaultMode: 'system',
});
runtime.setTheme('bruttal');
runtime.setMode('dark');
```

## Creating Themes

```ts
import { createTheme } from '@ttoss/theme2';

const myTheme = createTheme({
  overrides: {
    core: { colors: { brand: { main: '#FF4500', accent: '#D4A017' } } },
  },
});

// Theme inheritance
const child = createTheme({
  base: myTheme,
  overrides: { core: { radii: { md: '16px' } } },
});
```

`createTheme` deep-merges overrides into the base and returns a fully independent clone — mutations never propagate between themes.

## Theme Bundles (Color Modes)

A `ThemeBundle` pairs a complete base theme with an optional partial alternate for the opposite color mode. The alternate contains **only the diff** — typically ~20 core tokens (neutrals, hue adjustments, elevation shadows). Semantic tokens resolve automatically via `var()` cascade.

```ts
import { createThemeBundle, type ThemeBundle } from '@ttoss/theme2';

const myBundle: ThemeBundle = createThemeBundle({
  baseMode: 'light', // default
  overrides: {
    core: { colors: { brand: { main: '#FF4500' } } },
  },
  alternate: {
    core: {
      colors: {
        neutral: { white: '#0f172a', black: '#f8fafc' },
      },
    },
  },
});
```

Generate CSS from a bundle with `bundleToCssVars`:

```ts
import { bundles, bundleToCssVars } from '@ttoss/theme2';

const result = bundleToCssVars(bundles.default, { themeId: 'default' });

result.base; // CssVarsResult — all vars under [data-tt-theme="default"]
result.alternate; // CssVarsResult — diff-only vars under [data-tt-theme="default"][data-tt-mode="dark"]
result.toCssString(); // complete CSS string with both blocks + coarse pointer overrides
```

## Root Exports

Three universal, framework-agnostic formats.

### `toCssVars(theme, options?)` — CSS Custom Properties

For single-mode themes or manual mode scoping:

```ts
import { themes, toCssVars } from '@ttoss/theme2';

toCssVars(themes.default).toCssString();
// → :root { --tt-color-brand-main: #292C2a; ... }

toCssVars(themes.bruttal, { themeId: 'bruttal' }).toCssString();
// → [data-tt-theme="bruttal"] { --tt-color-brand-main: #0A0A0A; ... }
```

For themes with color modes, prefer `bundleToCssVars` (see above).

### `toFlatTokens(theme)` — Flat Token Map

Flat `Record<string, string | number>` with dot-separated keys and all `{ref}` values fully resolved.

```ts
import { themes, toFlatTokens } from '@ttoss/theme2';

const tokens = toFlatTokens(themes.default);
tokens['core.colors.brand.main']; // '#292C2a'
tokens['semantic.colors.action.primary.background.default']; // '#0469E3' (resolved)
```

### `toDTCG(theme)` — W3C Design Tokens (DTCG JSON)

Structured token tree following the [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) format. Every leaf has `$value` (fully resolved) and `$type` (inferred from path).

```ts
import { themes, toDTCG } from '@ttoss/theme2';

const tokens = toDTCG(themes.default);
// tokens.core.colors.brand.main === { $value: '#292C2a', $type: 'color' }
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

| Theme     | Palette                                      | Base mode | Dark alternate |
| --------- | -------------------------------------------- | --------- | -------------- |
| `default` | Neutral baseline, system fonts, gray palette | light     | yes            |
| `bruttal` | Bold contrasts, dark neutrals, zero radii    | light     | yes            |
| `oca`     | Natural greens, organic warmth               | light     | yes            |
| `aurora`  | Cool-toned purples, rounded surfaces         | light     | yes            |
| `terra`   | Warm amber/olive, grounded feel              | light     | yes            |
| `neon`    | Vibrant accents, dark backgrounds            | dark      | —              |

Every theme is available as both a plain `ThemeTokensV2` (via `themes.*`) and a `ThemeBundle` with mode support (via `bundles.*`).
