# @ttoss/fsl-theme

Design token system for the ttoss ecosystem. Separates raw values (`core`) from stable design meaning (`semantic`) so components never break when themes change or modes switch. The semantic layer is the public contract — type-safe, mode-agnostic, and consumed directly as CSS custom properties with zero runtime overhead.

## Installation

```bash
pnpm add @ttoss/fsl-theme
```

## Entry points

| Import                     | Exports                                                                                                                                                                                         |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ttoss/fsl-theme`         | `createTheme`, `darkAlternate`, built-in themes (`bruttal`, `corporate`, `oca`, `ventures`), types (`ThemeTokens`, `ThemeBundle`, `SemanticTokens`, `ModeOverride`, `DeepPartial`, `ThemeMode`) |
| `@ttoss/fsl-theme/react`   | `ThemeProvider`, `ThemeHead`, `ThemeScript`, `ThemeStyles`, `useColorMode`, `useTokens`, `useResolvedTokens`                                                                                    |
| `@ttoss/fsl-theme/dataviz` | `withDataviz`, `useDatavizTokens`                                                                                                                                                               |
| `@ttoss/fsl-theme/css`     | `getThemeStylesContent`, `toCssVars`, `toCssVarName`, `toFlatTokens`                                                                                                                            |
| `@ttoss/fsl-theme/vars`    | `vars`, `buildVarsMap`, type `CssVarsMap`                                                                                                                                                       |
| `@ttoss/fsl-theme/dtcg`    | `toDTCG` (W3C Design Tokens format)                                                                                                                                                             |
| `@ttoss/fsl-theme/runtime` | `createThemeRuntime`, `getThemeScriptContent`                                                                                                                                                   |

## Token architecture

```
ThemeTokens
├── core     — raw primitives (immutable across modes)
└── semantic — {core.*} references (the public contract; remapped per mode)
```

Components consume only semantic tokens. Core tokens never change between light and dark — only semantic references remap.

## Token grammar

One entry per semantic family. Use `vars.*` for typed CSS variable references; use the `semantic.*` path shape below when naming tokens in TypeScript or in discussion.

| Family    | Path shape                                                          | Leaf value              |
| --------- | ------------------------------------------------------------------- | ----------------------- |
| colors    | `semantic.colors.{ux}.{role}.{dimension}.{state}`                   | CSS color               |
| spacing   | `semantic.spacing.inset.{control,surface}.{sm,md,lg}`               | CSS length              |
|           | `semantic.spacing.gap.{stack,inline}.{xs,sm,md,lg,xl}`              | CSS length              |
|           | `semantic.spacing.gutter.{page,section}`                            | CSS length / `clamp()`  |
|           | `semantic.spacing.separation.interactive.min`                       | CSS length              |
| text      | `semantic.text.{display,headline,title,body,label,code}.{lg,md,sm}` | TextStyle object        |
| sizing    | `semantic.sizing.hit.{min,base,prominent}`                          | CSS length              |
|           | `semantic.sizing.icon.{sm,md,lg}`                                   | CSS length              |
|           | `semantic.sizing.identity.{sm,md,lg,xl}`                            | CSS length              |
|           | `semantic.sizing.measure.reading`                                   | CSS `ch` / `clamp()`    |
|           | `semantic.sizing.surface.maxWidth`                                  | CSS length              |
|           | `semantic.sizing.viewport.{height,width}.full`                      | CSS dvh/dvw             |
| radii     | `semantic.radii.{control,surface,round}`                            | CSS length              |
| border    | `semantic.border.divider`                                           | `{width, style}`        |
|           | `semantic.border.outline.{surface,control,selected}`                | `{width, style}`        |
| focus     | `semantic.focus.ring`                                               | `{width, style, color}` |
| elevation | `semantic.elevation.surface.{flat,raised,overlay,blocking}`         | CSS box-shadow          |
|           | `semantic.elevation.tonal.{flat,raised,overlay,blocking}`           | CSS color (optional)    |
| opacity   | `semantic.opacity.{scrim,loading,disabled}`                         | number in (0, 1)        |
| overlay   | `semantic.overlay.scrim`                                            | CSS color with alpha    |
| motion    | `semantic.motion.{feedback,emphasis,decorative}`                    | `{duration, easing}`    |
|           | `semantic.motion.transition.{enter,exit}`                           | `{duration, easing}`    |
| zIndex    | `semantic.zIndex.layer.{base,sticky,overlay,blocking,transient}`    | integer                 |

**Colors axes** (`semantic.colors.{ux}.{role}.{dimension}.{state}`):

- `ux` — FSL Entity Kind: `action` · `input` · `navigation` · `feedback` · `informational`
- `role` — Evaluation: `primary` · `secondary` · `accent` · `muted` · `positive` · `caution` · `negative`
- `dimension` — `background` · `border` · `text`
- `state` — `default` · `hover` · `active` · `focused` · `disabled` · `selected` · `pressed`

## Pick a token in 60s

Find the CSS property you are setting, then follow the branch to the leaf.

**`color` / `background` / `border-color` / `fill`** → `colors`

1. What does the element _do_? → `{ux}`: `action` (button, link, CTA) · `input` (field, toggle, checkbox) · `navigation` (tab, menu item, breadcrumb) · `feedback` (alert, banner, toast, progress) · `informational` (card, badge, chip, stat)
2. What is its _emphasis_? → `{role}`: `primary` (default for the context) · `secondary` (supporting) · `accent` (brand pop) · `muted` (subdued) · `positive` / `caution` / `negative` (outcome valence)
3. What is being colored? → `background` · `border` · `text`
4. What is the interaction state? → `default` · `hover` · `active` · `focused` · `disabled` · `selected` · `pressed`

**`padding`** → `spacing.inset`

- Element is interactive (button, input, toggle) → `spacing.inset.control.{sm|md|lg}`
- Element is a container (card, panel, dialog, section) → `spacing.inset.surface.{sm|md|lg}`
- Default step at any level → `md`

**`gap`** → `spacing.gap`

- Siblings flow vertically (list, form fields, stacked sections) → `spacing.gap.stack.{xs|sm|md|lg|xl}`
- Siblings flow horizontally (icon + label, toolbar, chip row) → `spacing.gap.inline.{xs|sm|md|lg|xl}`
- Adjacent independently focusable targets → `spacing.separation.interactive.min`

**`padding` on a page or section wrapper** → `spacing.gutter.{page|section}`

**`font-size` / `font-family` / `font-weight` / `line-height`** → `text`

| Element's text function               | Token                      |
| ------------------------------------- | -------------------------- |
| Hero / landing emphasis               | `text.display.{lg,md,sm}`  |
| Page or section heading               | `text.headline.{lg,md,sm}` |
| Surface heading (card, panel, dialog) | `text.title.{lg,md,sm}`    |
| Reading prose / description           | `text.body.{lg,md,sm}`     |
| UI label / button text / badge        | `text.label.{lg,md,sm}`    |
| Code / identifiers / monospace        | `text.code.{md,sm}`        |

**`width` / `height` / `min-width` / `min-height`** → `sizing`

- Interactive area (hit target) → `sizing.hit.{min|base|prominent}`
- Icon glyph dimension → `sizing.icon.{sm|md|lg}`
- Avatar / identity object → `sizing.identity.{sm|md|lg|xl}`
- Reading line length (`max-width` in `ch`) → `sizing.measure.reading`
- Surface max-width (page shell, card, dialog) → `sizing.surface.maxWidth`
- Full viewport dimension → `sizing.viewport.{height|width}.full`

**`border-radius`** → `radii`

- Interactive control (button, input, toggle) → `radii.control`
- Containing surface (card, panel, dialog, menu) → `radii.surface`
- Pill, capsule, or avatar → `radii.round`

**`border-width` / `border-style`** → `border` (pair with a `colors` token for the color)

- Separator between content groups → `border.divider`
- Enclosing edge of a surface → `border.outline.surface`
- Enclosing edge of an interactive control → `border.outline.control`
- Selection / current-item line weight → `border.outline.selected`

**`outline` (keyboard focus)** → `focus`

- Component has a clear FSL Entity Kind → `{ux}.{role}.border.focused` (from `colors`)
- No clear Entity Kind (focusable card, custom widget) → `focus.ring`

**`box-shadow`** → `elevation.surface`

- Flush with page → `elevation.surface.flat`
- Card or panel → `elevation.surface.raised`
- Dropdown, popover → `elevation.surface.overlay`
- Dialog, sheet → `elevation.surface.blocking`

**`z-index`** → `zIndex.layer`

- Normal page content → `zIndex.layer.base`
- Sticky header / nav → `zIndex.layer.sticky`
- Dropdown, popover → `zIndex.layer.overlay`
- Dialog with scrim → `zIndex.layer.blocking`
- Toast / transient notification → `zIndex.layer.transient`

**`opacity` (whole element)** → `opacity`

- Modal backdrop dimming → `opacity.scrim`
- Content visible during async work → `opacity.loading`
- Disabled visual asset (image, avatar) → `opacity.disabled`
- _For disabled controls or text: use `{ux}.{role}.{dimension}.disabled` from `colors` — opacity cannot carry contrast guarantees._

**`transition` / `animation`** → `motion`

- User input response on a single element → `motion.feedback`
- Element entering the layout → `motion.transition.enter`
- Element leaving the layout → `motion.transition.exit`
- Must-notice in-place change → `motion.emphasis`
- Ambient / decorative loop → `motion.decorative`

**Modal backdrop color** → `overlay.scrim`

## Per-family specs

Full grammar rules, decision matrices, and anti-patterns live in the family specs. Each file follows the pattern `families/{family}.md`:

[colors](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/colors.md) · [spacing](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/spacing.md) · [typography](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/typography.md) · [sizing](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/sizing.md) · [radii](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/radii.md) · [borders](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/borders.md) · [elevation](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/elevation.md) · [opacity](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/opacity.md) · [motion](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/motion.md) · [z-index](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/z-index.md) · [breakpoints](https://github.com/ttoss/ttoss/blob/main/docs/website/docs/design/design-system/design-tokens/families/breakpoints.md)

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

`ThemeProvider` injects CSS Custom Properties via React 19 style hoisting and persists mode to localStorage.

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
// resolved['semantic.colors.action.primary.background.default'] → '#0469E3'
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

const myTheme = createTheme({/* … */});

export const myVars: CssVarsMap<MySemanticTokens> = buildVarsMap(
  myTheme.base
) as CssVarsMap<MySemanticTokens>;
```

For one-off custom keys, use `toCssVarName` from `@ttoss/fsl-theme/css` directly — no extended type required.

## Next.js (SSR)

### React 19 App Router (recommended)

`ThemeProvider` with a `theme` prop uses React 19 style hoisting to inject CSS into `<head>` automatically. Only add `ThemeScript` for flash-prevention:

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

> **Warning:** Do not combine `<ThemeHead theme={...}>` with `<ThemeProvider theme={...}>`. Both inject CSS — `ThemeHead` via a plain `<style>` tag and `ThemeProvider` via React 19 style hoisting — resulting in duplicate CSS in the document. Use one or the other.

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
