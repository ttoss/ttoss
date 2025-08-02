# @ttoss/theme

Pre-built themes and theme creation utilities for the [ttoss Design System](https://ttoss.dev/docs/design/design-system). Provides complete visual personalities for React applications using [design tokens](https://ttoss.dev/docs/design/design-system/design-tokens) and Theme UI integration.

## Installation

```shell
pnpm add @ttoss/theme @ttoss/react-icons
```

## Quick Start

### 1. Use Pre-built Theme

```tsx
import { ThemeProvider } from '@ttoss/ui';
import { BruttalTheme } from '@ttoss/theme/Bruttal';

export const App = () => (
  <ThemeProvider theme={BruttalTheme}>
    <YourAppContent />
  </ThemeProvider>
);
```

### 2. Create Custom Theme

```tsx
import { createTheme } from '@ttoss/theme';

export const MyTheme = createTheme({
  colors: {
    primary: '#007acc',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#212529',
  },
  fonts: {
    body: '"Inter", sans-serif',
    heading: '"Poppins", sans-serif',
  },
});
```

## Available Themes

### Bruttal Theme

**Bold, high-contrast design with sharp aesthetics**

```tsx
import { BruttalTheme, BruttalFonts, BrutalIcons } from '@ttoss/theme/Bruttal';

// Complete theme with semantic tokens
<ThemeProvider theme={BruttalTheme}>

// Typography: Atkinson Hyperlegible, Work Sans
// Colors: Deep charcoal (#292C2a), bright blue (#0469E3)
// Style: Minimal border radius, sharp corners
```

### Oca Theme

**Soft, friendly design with rounded elements**

```tsx
import { OcaTheme, OcaFonts, OcaIcons } from '@ttoss/theme/Oca';

// Soft contrasts and warm palette
<ThemeProvider theme={OcaTheme}>

// Typography: Source Sans Pro, approachable fonts
// Colors: Soft black (#111827), bright green (#03FF7A)
// Style: Generous border radius, comfortable spacing
```

### Default Theme

**Foundation theme with core tokens only**

```tsx
import { defaultTheme } from '@ttoss/theme/default';

// Base tokens without semantic mapping
// Use as foundation for custom themes
```

## Theme Structure

Each theme provides:

- **Core Tokens**: Colors, typography, spacing, sizing
- **Semantic Tokens**: Context-specific token mappings (action, navigation, feedback)
- **Component Styles**: Pre-configured component variants
- **Global Styles**: Base styles for HTML elements
- **Font Integration**: Web font loading and fallbacks
- **Icon Integration**: Icon library configuration

## API Reference

### `createTheme(theme, base?)`

Creates a new theme by merging configuration with a base theme.

```tsx
import { createTheme, defaultTheme } from '@ttoss/theme';

const customTheme = createTheme(
  {
    // Your theme overrides
    colors: { primary: '#custom-color' },
  },
  defaultTheme
); // Optional base theme
```

**Parameters:**

- `theme: Theme` - Theme configuration object
- `base?: Theme` - Base theme to extend (defaults to `defaultTheme`)

**Returns:** Complete `Theme` object for use with `ThemeProvider`

## Advanced Usage

### Custom Theme Development

```tsx
import { createTheme } from '@ttoss/theme';

export const BrandTheme = createTheme({
  // 1. Define core brand values
  colors: {
    primary: '#your-brand-primary',
    secondary: '#your-brand-secondary',
  },

  // 2. Configure semantic tokens
  colors: {
    action: {
      background: {
        primary: { default: 'primary' },
        secondary: { default: 'secondary' },
      },
    },
  },

  // 3. Customize component styles
  buttons: {
    primary: {
      backgroundColor: 'action.background.primary.default',
      borderRadius: 'lg',
    },
  },
});
```

### Font and Icon Integration

```tsx
import { BruttalTheme, BruttalFonts } from '@ttoss/theme/Bruttal';

// Fonts are automatically loaded when using pre-built themes
// For custom themes, handle font loading separately

export const App = () => (
  <ThemeProvider theme={BruttalTheme} fonts={BruttalFonts}>
    <YourApp />
  </ThemeProvider>
);
```

## Integration

- **Design System**: Core part of [ttoss Design System](https://ttoss.dev/docs/design/design-system)
- **Component Library**: Used by [@ttoss/ui](https://ttoss.dev/docs/modules/packages/ui) components
- **Design Tokens**: Implements [semantic token](https://ttoss.dev/docs/design/design-system/design-tokens/semantic-tokens) architecture
- **Theme UI**: Built on [Theme UI](https://theme-ui.com/) specification
- **TypeScript**: Full type safety and IntelliSense support

## Related Packages

- **[@ttoss/ui](https://ttoss.dev/docs/modules/packages/ui)**: React component library that consumes themes
- **[@ttoss/react-icons](https://ttoss.dev/docs/modules/packages/react-icons)**: Icon library integration
- **[Design System Documentation](https://ttoss.dev/docs/design/design-system)**: Complete design system guide
