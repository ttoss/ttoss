---
title: Token Implementation Guide
---

# Token Implementation Guide

This guide covers the technical implementation of design tokens in the ttoss ecosystem, from theme configuration to component usage.

## Theme Structure

Design tokens are implemented in the theme configuration files located in `/packages/theme/`:

```
packages/theme/src/
├── defaultTokens/          # Core token definitions
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── borders.ts
│   └── index.ts
├── themes/                 # Theme implementations
│   ├── Bruttal/
│   │   ├── BruttalTheme.ts # Complete theme with semantic tokens
│   │   └── BruttalIcons.ts
│   ├── Oca/
│   │   └── OcaTheme.ts
│   └── default/
│       └── defaultTheme.ts
└── index.ts
```

## Core Token Implementation

### Default Tokens

Core tokens are defined in `defaultTokens/` and shared across themes:

```typescript
// packages/theme/src/defaultTokens/typography.ts
export const fontSizes = Object.freeze({
  '4xs': '0.375rem', // 6px
  '3xs': '0.5rem', // 8px
  '2xs': '0.625rem', // 10px
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  md: '1rem', // 16px
  lg: '1.125rem', // 18px
  // ... rest of scale
});

// packages/theme/src/defaultTokens/spacing.ts
export const spacing = Object.freeze({
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  // ... rest of scale
});
```

### Theme-Specific Core Tokens

Each theme defines its own brand colors:

```typescript
// packages/theme/src/themes/Bruttal/BruttalTheme.ts
const coreColors = {
  // Brand colors
  main: '#292C2a',
  complimentary: '#f4f3f3',
  accent: '#0469E3',
  darkNeutral: '#325C82',
  lightNeutral: '#F8F8F8',

  // Functional colors
  black: '#000000',
  white: '#ffffff',
  gray100: '#f9f9f9',
  gray200: '#dedede',
  // ... gray scale
  red700: '#c62121',
  amber600: '#d97706',
  teal600: '#0d9488',
};
```

## Semantic Token Implementation

Semantic tokens reference core tokens and organize them by context:

```typescript
// BruttalTheme.ts - Semantic color structure
export const BruttalTheme: Theme = {
  colors: {
    // Action context - buttons, CTAs, interactive elements
    action: {
      background: {
        primary: {
          default: coreColors.main,
          active: coreColors.complimentary,
        },
        secondary: {
          default: coreColors.gray200,
          active: coreColors.white,
        },
        accent: { default: coreColors.accent },
        negative: { default: coreColors.red700 },
      },
      text: {
        primary: { default: coreColors.black },
        secondary: { default: coreColors.white },
        accent: { default: coreColors.white },
        negative: { default: coreColors.white },
      },
      border: {
        primary: { default: coreColors.main },
        secondary: { default: coreColors.black },
        muted: { default: coreColors.gray600 },
      },
    },

    // Input context - forms, fields, validation
    input: {
      background: {
        primary: { default: coreColors.white },
        muted: {
          default: coreColors.gray200,
          disabled: coreColors.gray300,
        },
      },
      // ... rest of input tokens
    },

    // Display context - content, text, information
    display: {
      // ... display tokens
    },

    // Feedback context - alerts, notifications, status
    feedback: {
      // ... feedback tokens
    },

    // Navigation context - menus, links, wayfinding
    navigation: {
      // ... navigation tokens
    },
  },
};
```

## Component Integration

### Theme UI Integration

Components use semantic tokens through the `sx` prop:

```tsx
// packages/ui/src/components/Button.tsx
export const Button = ({ variant = 'primary', ...props }) => {
  return (
    <button
      {...props}
      sx={{
        // Maps to theme.buttons[variant] which uses semantic tokens
        variant: `buttons.${variant}`,
        ...props.sx,
      }}
    />
  );
};
```

### Component Style Definitions

Component variants are defined using semantic tokens:

```typescript
// BruttalTheme.ts - Button component styles
export const BruttalTheme: Theme = {
  // ... other theme properties

  buttons: {
    primary: {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.secondary.default',
      borderRadius: 'sm',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':active': {
        backgroundColor: 'action.background.primary.active',
        color: 'action.text.secondary.default',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        borderColor: 'action.border.muted.default',
        color: 'action.text.muted.default',
      },
    },

    secondary: {
      backgroundColor: 'action.background.secondary.default',
      color: 'action.text.primary.default',
      borderRadius: 'sm',
      border: 'md',
      borderColor: 'action.border.primary.default',
      // ... state styles
    },

    destructive: {
      color: 'action.text.negative.default',
      backgroundColor: 'action.background.negative.default',
      // ... state styles
    },
  },
};
```

## Usage in Applications

### Theme Provider Setup

```tsx
// app/src/App.tsx
import { ThemeProvider } from '@ttoss/ui';
import { BruttalTheme } from '@ttoss/theme/Bruttal';

export const App = () => (
  <ThemeProvider theme={BruttalTheme}>
    <YourAppContent />
  </ThemeProvider>
);
```

### Component Usage with Semantic Tokens

```tsx
// Using component variants (recommended)
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="destructive">Delete</Button>

// Using sx prop with semantic tokens
<Box sx={{
  backgroundColor: 'display.background.secondary.default',
  color: 'display.text.primary.default',
  border: 'sm',
  borderColor: 'display.border.muted.default',
  borderRadius: 'md',
  padding: 'lg'
}}>
  Custom component using semantic tokens
</Box>

// Responsive token usage
<Text sx={{
  fontSize: ['sm', 'md', 'lg'],  // Responsive font sizes
  color: 'display.text.primary.default'
}}>
  Responsive text
</Text>
```

### Accessing Tokens in Custom Components

```tsx
import { useTheme } from '@ttoss/ui';

const CustomComponent = () => {
  const { theme } = useTheme();

  // Access semantic tokens
  const primaryBg = theme.colors.action.background.primary.default;
  const primaryText = theme.colors.action.text.secondary.default;

  // Access core tokens (when needed)
  const baseFontSize = theme.fontSizes.md;
  const baseSpacing = theme.space[4];

  return (
    <div
      style={{
        backgroundColor: primaryBg,
        color: primaryText,
        fontSize: baseFontSize,
        padding: baseSpacing,
      }}
    >
      Custom styled component
    </div>
  );
};
```

## Creating Custom Themes

### Theme Creation Process

1. **Define core brand colors**
2. **Map semantic tokens to core colors**
3. **Configure component styles**
4. **Test across component library**

### Example Custom Theme

```typescript
// MyCustomTheme.ts
import { Theme } from 'theme-ui';
import { defaultTheme } from '@ttoss/theme/default';

// 1. Define core brand colors
const customCoreColors = {
  // Brand colors
  main: '#007acc', // Custom primary blue
  complimentary: '#f0f8ff', // Light blue
  accent: '#ff6b35', // Orange accent
  darkNeutral: '#2c3e50',
  lightNeutral: '#ecf0f1',

  // Inherit functional colors
  black: '#000000',
  white: '#ffffff',
  // ... gray scale and other colors
};

// 2. Create theme with semantic tokens
export const MyCustomTheme: Theme = {
  // Inherit default tokens
  ...defaultTheme,

  // Custom colors with semantic structure
  colors: {
    action: {
      background: {
        primary: {
          default: customCoreColors.main, // Uses custom blue
          hover: customCoreColors.accent, // Orange on hover
        },
        secondary: {
          default: customCoreColors.lightNeutral,
          hover: customCoreColors.white,
        },
      },
      text: {
        primary: { default: customCoreColors.darkNeutral },
        secondary: { default: customCoreColors.white },
      },
      // ... rest of action tokens
    },
    // ... other semantic contexts
  },

  // 3. Configure component styles
  buttons: {
    primary: {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.secondary.default',
      ':hover': {
        backgroundColor: 'action.background.primary.hover',
      },
    },
  },
};
```

## Development Workflow

### Token Development

1. **Update core tokens** in `defaultTokens/` if adding new token categories
2. **Update semantic tokens** in theme files to reference new core tokens
3. **Update component styles** to use new semantic tokens
4. **Test in Storybook** to verify token usage
5. **Update documentation** to reflect new tokens

### Testing Tokens

```bash
# Start development server with Storybook
npm run storybook

# Test specific components
npm run test:components

# Build themes to check for errors
npm run build:theme
```

### Token Validation

```typescript
// Type checking helps ensure token structure
interface SemanticColors {
  action: {
    background: {
      primary: { default: string; hover?: string; active?: string };
      // ... rest of structure
    };
  };
}

// Runtime validation in development
if (process.env.NODE_ENV === 'development') {
  validateTokenStructure(theme.colors);
}
```

## Best Practices

### Token Organization

- **Consistent naming**: Follow established patterns across themes
- **Complete coverage**: Include all necessary states for interactive elements
- **Documentation**: Comment complex token relationships
- **Testing**: Verify tokens work across all components

### Performance Considerations

- **Object freezing**: Use `Object.freeze()` for core tokens to prevent mutations
- **Token references**: Semantic tokens should only reference core tokens, not raw values
- **Bundle size**: Core tokens are shared, semantic tokens are theme-specific

### Migration Strategy

When updating tokens:

1. **Add new tokens** alongside existing ones
2. **Update components** to use new tokens
3. **Deprecate old tokens** with console warnings
4. **Remove deprecated tokens** in next major version

## Troubleshooting

### Common Issues

**Token not found error**:

```
Cannot read property 'default' of undefined at action.background.primary.default
```

- Check token path in theme configuration
- Verify token exists in current theme
- Check for typos in token name

**Inconsistent styling across themes**:

- Ensure all themes implement the same semantic token structure
- Check that component styles use semantic tokens, not core tokens directly
- Verify token values meet accessibility contrast requirements

**Component not updating with theme changes**:

- Ensure ThemeProvider wraps your component tree
- Check that component uses theme tokens, not hardcoded values
- Verify theme switching logic updates theme prop

## Next Steps

- **[Theme Definition](/docs/design/design-system/theme)**: Understanding complete theme architecture
- **[Component Development](/docs/design/design-system/components)**: Building components with tokens
- **[Storybook Integration](https://storybook.ttoss.dev)**: Testing tokens in components
