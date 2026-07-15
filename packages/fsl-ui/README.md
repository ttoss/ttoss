# @ttoss/fsl-ui

Semantic, token-native component library for ttoss. Built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) with `@ttoss/fsl-theme` tokens.

Components are not visual variants of widgets — they are executable expressions of the [FSL](https://ttoss.dev/docs/design/design-system/fsl) semantic model. A component's identity (`Entity`, `Structure`, `Composition`, `Consequence`) determines which tokens it may consume.

## Install

```bash
pnpm add @ttoss/fsl-ui @ttoss/fsl-theme react-aria-components
```

Peer dependencies: `react >= 18`, `react-dom >= 18`. The package is ESM-only, ships `sideEffects: false`, and tree-shakes: a Button-only import costs ≈ 1.8 KB minified before shared dependencies (React Aria Components is the dominant cost and is shared across every component you use).

## Quickstart

Components read CSS-variable tokens, so the theme must be mounted once at the root:

```tsx
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { Button } from '@ttoss/fsl-ui';

const theme = createTheme(); // base theme + dark alternate

export const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <Button
        evaluation="primary"
        onPress={() => {
          console.log('pressed');
        }}
      >
        Save
      </Button>
    </ThemeProvider>
  );
};
```

Three props carry the semantic model everywhere:

- `evaluation` — authorial emphasis (`primary`, `muted`, `negative`, …). Data-entry components (`TextField`, `Select`, `Checkbox`, …) intentionally have none: validation is the runtime `isInvalid` state, never a color prop.
- `consequence` — effect on state (`neutral`, `committing`, `destructive`). It drives mechanism: a `destructive` `ConfirmationDialog` requires a two-click armed confirmation.
- `composition` — the slot an element plays inside a parent (`primaryAction`, `dismissAction`, …). `DialogActions` reorders its children by it per platform convention.

Flow-critical labels are required props with no English defaults — `ConfirmationDialog` and `WizardNavigation` force the caller to supply localized copy (see `CONTRIBUTING.md` §6).

## Customization

Composites accept no `style`/`className`. Geometry the host legitimately owns is exposed as `--fsl-*` CSS custom properties with built-in fallbacks:

```css
[data-scope='dialog'] {
  --fsl-dialog-max-width: 720px;
}
```

The registered knobs and the full policy live in [`src/tokens/CONTRACT.md`](./src/tokens/CONTRACT.md) §7.

## AI-first surface

The published tarball ships the machine-readable ground truth:

- **`llms.txt`** — distilled contract: semantic model, component catalog, Entity → token map, state cascade, integration rules.
- **`src/tokens/CONTRACT.md`** — the full Layer-2 authoring contract. Given an `Entity`, it specifies the exact `vars.*` paths, state cascade, and `data-*` conventions a component must use.

## Contributing

- **`src/semantics/taxonomy.ts`** — the FSL vocabulary and legality matrices.
- **`CONTRIBUTING.md`** — how to add components, entities, and taxonomy terms; hard rules; package ADRs.

Contract tests auto-discover every `*Meta` export from `src/index.ts` and validate it against the taxonomy + token hygiene rules. No manual registry. `pnpm run verify:treeshake` proves the barrel still tree-shakes.
