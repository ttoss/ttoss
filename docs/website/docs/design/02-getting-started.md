---
title: Getting Started
---

# Getting Started

Get up and running with the ttoss Design System in minutes.

## Installation

```bash
npm install @ttoss/ui @ttoss/theme
```

## Basic Setup

### 1. **Wrap Your App with ThemeProvider**

```tsx
import { ThemeProvider } from '@ttoss/ui';
import { BruttalTheme } from '@ttoss/theme/Bruttal';

export const App = () => (
  <ThemeProvider theme={BruttalTheme}>{/* Your app content */}</ThemeProvider>
);
```

### 2. **Use Components**

```tsx
import { Button, Text, Box } from '@ttoss/ui';

export const MyComponent = () => (
  <Box sx={{ padding: 4 }}>
    <Text variant="headline">Welcome to ttoss</Text>
    <Button variant="primary">Get Started</Button>
  </Box>
);
```

### 3. **Access Design Tokens**

```tsx
import { Box } from '@ttoss/ui';

export const TokenExample = () => (
  <Box
    sx={{
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.secondary.default',
      padding: 'lg',
      borderRadius: 'sm',
    }}
  >
    Using semantic tokens
  </Box>
);
```

## Next Steps

- **[Explore Components](https://storybook.ttoss.dev)**: Interactive component library
- **[Understand Design Tokens](/docs/design/design-system/design-tokens)**: Foundation of our design system
- **[View Examples](https://github.com/ttoss/ttoss/tree/main/packages/theme/src/themes)**: Real-world usage patterns

## Development Workflow

### For Designers

1. Use Figma components that match our design tokens
2. Reference token names in design handoffs
3. Collaborate with developers using shared vocabulary

### For Developers

1. Import components and themes from `@ttoss/ui`
2. Use semantic tokens through the `sx` prop
3. Create new components following our patterns

## Need Help?

- **[Storybook Documentation](https://storybook.ttoss.dev)**: Interactive examples
- **[Design System Overview](/docs/design/design-system)**: Core concepts
- **[Token Reference](/docs/design/design-system/design-tokens)**: All available tokens
