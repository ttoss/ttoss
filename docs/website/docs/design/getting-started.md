---
sidebar_position: 2
title: Getting Started
---

# Getting Started

The design system ships as two packages: [`@ttoss/fsl-theme`](https://www.npmjs.com/package/@ttoss/fsl-theme) (design tokens, themes, modes) and [`@ttoss/fsl-ui`](https://www.npmjs.com/package/@ttoss/fsl-ui) (semantic React components built on React Aria Components).

```bash
pnpm add @ttoss/fsl-ui @ttoss/fsl-theme react-aria-components
```

Mount the theme once at the root; every component reads CSS-variable tokens from it:

```tsx
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { Button } from '@ttoss/fsl-ui';

const theme = createTheme(); // base theme + dark alternate

export const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <Button evaluation="primary" onPress={() => console.log('pressed')}>
        Save
      </Button>
    </ThemeProvider>
  );
};
```

From here:

- **Integrate the theme** (SSR, Next.js, mode switching, custom themes) — [`@ttoss/fsl-theme` README](https://github.com/ttoss/ttoss/blob/main/packages/fsl-theme/README.md)
- **Use the components** (semantic props, customization knobs) — [`@ttoss/fsl-ui` README](https://github.com/ttoss/ttoss/blob/main/packages/fsl-ui/README.md) and the [UI Components overview](/docs/design/ui-components)
- **Pick tokens by intent** — [Design Tokens quick reference](/docs/design/design-system/design-tokens/quick-reference)
- **Understand the model** — [Design System document map](/docs/design/design-system)
